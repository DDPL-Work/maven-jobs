const paymentService = require("../services/payment.service");
const asyncHandler = require("../middleware/async.middleware");

exports.createOrder = asyncHandler(async (req, res) => {
  const { planType, customAmount } = req.body;

  if (planType === "JOB_POST") {
    if (!customAmount || customAmount < 100) {
      return res.status(400).json({ success: false, message: "Invalid amount for job post" });
    }
    const result = await paymentService.createOrder({
      userId: req.user._id,
      role: req.user.role,
      planType: "PREMIUM",
      companyId: req.user.companyId,
      customAmount,
      customLabel: "Job Posting",
      durationDays: 30,
    });
    return res.json({ success: true, data: result });
  }

  const jobPackages = {
    "JOB_PACKAGE_1": { amount: 19900, jobLimit: 5, label: "Job Package 1 — 5 Job Posts" },
    "JOB_PACKAGE_2": { amount: 34900, jobLimit: 12, label: "Job Package 2 — 12 Job Posts" },
    "JOB_PACKAGE_3": { amount: 59900, jobLimit: 20, label: "Job Package 3 — 20 Job Posts" },
  };
  if (jobPackages[planType]) {
    const pkg = jobPackages[planType];
    const result = await paymentService.createOrder({
      userId: req.user._id,
      role: req.user.role,
      planType,
      companyId: req.user.companyId,
      customAmount: pkg.amount,
      customLabel: pkg.label,
      durationDays: 365,
    });
    return res.json({ success: true, data: result });
  }

  if (!planType) {
    return res.status(400).json({ success: false, message: "planType is required" });
  }

  const validPlans = req.user.role === "CANDIDATE" ? ["PRO", "ELITE", "ELITE_QUARTERLY"] : ["PREMIUM"];
  if (!validPlans.includes(planType)) {
    return res.status(400).json({ success: false, message: `Invalid plan for role ${req.user.role}` });
  }

  const companyId = req.user.role === "CLIENT" ? req.user.companyId : undefined;

  const result = await paymentService.createOrder({
    userId: req.user._id,
    role: req.user.role,
    planType,
    companyId,
  });

  res.json({ success: true, data: result });
});

exports.confirmPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({ success: false, message: "Missing payment details" });
  }

  const result = await paymentService.confirmPayment({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  res.json({ success: true, data: result });
});

exports.verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  await paymentService.verifyPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature });

  res.json({ success: true, message: "Signature verified" });
});

exports.webhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const rawBody = JSON.stringify(req.body);

  const isValid = paymentService.verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    return res.status(401).json({ success: false, message: "Invalid webhook signature" });
  }

  const event = req.body.event;
  const result = await paymentService.handleWebhook(event, req.body.payload);

  res.json({ success: true, data: result });
});

exports.getPlans = asyncHandler(async (req, res) => {
  const plans = paymentService.PLAN_CONFIG;
  const role = req.query.role || req.user?.role;

  const filtered = role === "CANDIDATE"
    ? { PRO: plans.PRO, ELITE: plans.ELITE, ELITE_QUARTERLY: plans.ELITE_QUARTERLY }
    : {
        PREMIUM: plans.PREMIUM,
        JOB_PACKAGE_1: plans.JOB_PACKAGE_1,
        JOB_PACKAGE_2: plans.JOB_PACKAGE_2,
        JOB_PACKAGE_3: plans.JOB_PACKAGE_3,
      };

  const result = Object.entries(filtered).map(([key, val]) => ({
    planType: key,
    amount: val.amount,
    durationDays: val.durationDays,
    label: val.label,
  }));

  res.json({ success: true, data: result });
});
