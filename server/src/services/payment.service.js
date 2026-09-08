const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/User");
const Company = require("../models/Company");
const PaymentTransaction = require("../models/PaymentTransaction");

function getKeyId() { return process.env.RAZORPAY_KEY_ID; }
function getKeySecret() { return process.env.RAZORPAY_KEY_SECRET; }
function getWebhookSecret() { return process.env.RAZORPAY_WEBHOOK_SECRET; }

let razorpayInstance = null;

function getRazorpay() {
  const KEY_ID = getKeyId();
  const KEY_SECRET = getKeySecret();
  if (!KEY_ID || !KEY_SECRET) {
    throw new Error("Razorpay credentials not configured");
  }
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
  }
  return razorpayInstance;
}

const PLAN_CONFIG = {
  PRO: { amount: 89000, durationDays: 30, label: "MavenPro Monthly" },
  ELITE: { amount: 199900, durationDays: 30, label: "MavenPro Elite Monthly" },
  ELITE_QUARTERLY: { amount: 99900, durationDays: 90, label: "MavenPro Elite Quarterly" },
  PREMIUM: { amount: 999900, durationDays: 30, label: "MavenJobs Premium Monthly" },
  JOB_PACKAGE_1: { amount: 19900, durationDays: 365, label: "Job Package 1 — 5 Job Posts" },
  JOB_PACKAGE_2: { amount: 34900, durationDays: 365, label: "Job Package 2 — 12 Job Posts" },
  JOB_PACKAGE_3: { amount: 59900, durationDays: 365, label: "Job Package 3 — 20 Job Posts" },
};

const JOB_PACKAGE_LIMITS = {
  JOB_PACKAGE_1: 5,
  JOB_PACKAGE_2: 12,
  JOB_PACKAGE_3: 20,
};

function getPlanConfig(planType) {
  const config = PLAN_CONFIG[planType];
  if (!config) throw new Error(`Invalid plan type: ${planType}`);
  return config;
}

async function createOrder({ userId, role, planType, companyId, customAmount, customLabel, durationDays: customDuration }) {
  const config = getPlanConfig(planType);
  const rzp = getRazorpay();

  let rzpOrder;
  try {
    rzpOrder = await rzp.orders.create({
      amount: customAmount || config.amount,
      currency: "INR",
      receipt: `rcpt_${Date.now().toString(36)}${userId.toString().slice(-4)}`,
      notes: {
        userId: String(userId),
        role,
        planType,
        companyId: companyId ? String(companyId) : "",
      },
    });
  } catch (err) {
    const detail = err.error?.description || err.error?.message || err.error?.code || err.message || "Unknown Razorpay error";
    console.error("[Razorpay] createOrder failed:", JSON.stringify(err.error || err));
    throw new Error(`Payment gateway error: ${detail}`);
  }

  const transaction = await PaymentTransaction.create({
    userId,
    role,
    companyId: companyId || null,
    razorpayOrderId: rzpOrder.id,
    amount: customAmount || config.amount,
    currency: "INR",
    planType,
    durationDays: customDuration || config.durationDays,
    status: "CREATED",
    metadata: { rzpOrder },
  });

  return {
    orderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    keyId: getKeyId(),
    transactionId: transaction._id,
    planLabel: customLabel || config.label,
    durationDays: customDuration || config.durationDays,
  };
}

async function verifyPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSig = crypto
    .createHmac("sha256", getKeySecret())
    .update(body)
    .digest("hex");

  if (expectedSig !== razorpaySignature) {
    throw new Error("Invalid payment signature");
  }
  return true;
}

async function confirmPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  await verifyPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature });

  const transaction = await PaymentTransaction.findOne({ razorpayOrderId });
  if (!transaction) throw new Error("Transaction not found");
  if (transaction.status === "PAID") return { alreadyProcessed: true, transaction };

  transaction.razorpayPaymentId = razorpayPaymentId;
  transaction.razorpaySignature = razorpaySignature;
  transaction.status = "PAID";
  await transaction.save();

  const now = new Date();
  const durationMs = (transaction.durationDays || 30) * 24 * 60 * 60 * 1000;
  const expiresAt = new Date(now.getTime() + durationMs);

  if (transaction.role === "CANDIDATE") {
    const planName = (transaction.planType === "ELITE" || transaction.planType === "ELITE_QUARTERLY") ? "ELITE" : "PRO";
    await User.findByIdAndUpdate(transaction.userId, {
      "membership.plan": planName,
      "membership.active": true,
      "membership.startedAt": now,
      "membership.expiresAt": expiresAt,
    });
  } else if (transaction.role === "CLIENT") {
    const planType = transaction.planType;
    let jobLimit = 2;

    if (planType === "PREMIUM") jobLimit = 10;
    else if (planType === "ELITE") jobLimit = 20;
    else if (JOB_PACKAGE_LIMITS[planType]) {
      const existing = await Company.findById(transaction.companyId);
      jobLimit = (existing?.jobLimit || 0) + JOB_PACKAGE_LIMITS[planType];
      await Company.findByIdAndUpdate(transaction.companyId, { jobLimit });
      return { alreadyProcessed: false, transaction, expiresAt: null };
    }

    await Company.findByIdAndUpdate(transaction.companyId, {
      packageType: planType,
      jobLimit,
      packageExpiresAt: expiresAt,
    });
  }

  return { alreadyProcessed: false, transaction, expiresAt };
}

async function handleWebhook(event, payload) {
  if (event === "payment.captured") {
    const payment = payload.payment?.entity;
    if (!payment) return { handled: false, reason: "No payment entity" };

    const orderId = payment.order_id;
    const transaction = await PaymentTransaction.findOne({ razorpayOrderId: orderId });
    if (!transaction) return { handled: false, reason: "Transaction not found" };
    if (transaction.status === "PAID") return { handled: true, alreadyProcessed: true };

    return confirmPayment({
      razorpayOrderId: orderId,
      razorpayPaymentId: payment.id,
      razorpaySignature: "",
    });
  }
  return { handled: false, reason: `Unhandled event: ${event}` };
}

function verifyWebhookSignature(body, signature) {
  const secret = getWebhookSecret();
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === signature;
}

module.exports = {
  createOrder,
  confirmPayment,
  handleWebhook,
  verifyWebhookSignature,
  getPlanConfig,
  PLAN_CONFIG,
  JOB_PACKAGE_LIMITS,
};
