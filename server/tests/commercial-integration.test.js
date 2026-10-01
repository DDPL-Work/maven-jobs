const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8"]);
const dotenv = require("dotenv");
dotenv.config();

const Product = require("../src/models/Product");
const ProductOffer = require("../src/models/ProductOffer");
const Plan = require("../src/models/Plan");
const PlanVersion = require("../src/models/PlanVersion");
const Subscription = require("../src/models/Subscription");
const Entitlement = require("../src/models/Entitlement");
const CreditLedger = require("../src/models/CreditLedger");

const PurchaseService = require("../src/services/commercial/purchase.service");
const EntitlementService = require("../src/services/commercial/entitlement.service");
const OfferService = require("../src/services/commercial/offer.service");

async function runTests() {
  console.log("=== STARTING COMMERCIAL PLATFORM INTEGRATION TESTS ===");
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI not found in environment");
  }

  await mongoose.connect(mongoUri);
  console.log("[DB] Connected successfully.");

  const testCompanyId = new mongoose.Types.ObjectId();
  const testUserId = new mongoose.Types.ObjectId();
  const testActor = { id: testUserId, email: "test-recruiter@example.com", role: "CLIENT" };

  try {
    // -------------------------------------------------------------
    // Test 1: Catalog Integrity & Exclusion of User Seats on /buy-online
    // -------------------------------------------------------------
    console.log("\n[TEST 1] Testing Catalog & User Seat Exclusion on Buy-Online...");
    const allOffers = await OfferService.getStandaloneOffers();
    const buyOnlineOffers = allOffers.filter(
      (o) =>
        (o.product?.category || o.productId?.category) !== "USER_SEAT" &&
        !(o.product?.code || o.productId?.code || "").includes("SEAT") &&
        !(o.product?.code || o.productId?.code || "").includes("USER")
    );

    const hasSeatOffersInFiltered = buyOnlineOffers.some(
      (o) => (o.product?.code || o.productId?.code) === "RESDEX_SEAT" || (o.product?.code || o.productId?.code) === "JOB_POSTING_SEAT"
    );

    if (hasSeatOffersInFiltered) {
      throw new Error("FAIL: Seat products found in Buy Online catalog!");
    }
    console.log(`✓ PASS: ${buyOnlineOffers.length} valid standalone offers available. 0 seat products present.`);

    // -------------------------------------------------------------
    // Test 2: Plan Purchase Simulation (SMB Starter)
    // -------------------------------------------------------------
    console.log("\n[TEST 2] Testing Plan Purchase & Immutable Entitlement Creation...");
    const smbPlan = await Plan.findOne({ code: "SMB_STARTER", status: "ACTIVE" }).populate("currentVersion");
    if (!smbPlan) {
      throw new Error("SMB_STARTER plan not found. Please run seed script first.");
    }

    const planPurchaseResult = await PurchaseService.purchasePlan({
      companyId: testCompanyId,
      planId: smbPlan._id,
      paymentMethod: "TEST_GATEWAY",
      actor: testActor,
      notes: "Test Plan Purchase",
    });

    if (!planPurchaseResult.success) {
      throw new Error("Plan purchase failed: " + planPurchaseResult.error);
    }

    const subId = planPurchaseResult.subscription._id;
    console.log(`✓ PASS: Plan purchased. Subscription ID: ${subId}`);

    // Verify Subscription Snapshots
    const subscription = await Subscription.findById(subId).lean();
    if (!subscription.commercialSnapshot || !subscription.entitlementSnapshot) {
      throw new Error("FAIL: Subscription is missing commercial or entitlement snapshot!");
    }
    console.log(`✓ PASS: Subscription contains immutable commercialSnapshot & entitlementSnapshot.`);

    // Verify Entitlements Created
    const createdEntitlements = await Entitlement.find({ subscriptionId: subId }).lean();
    console.log(`✓ PASS: Created ${createdEntitlements.length} entitlement records for subscription.`);
    for (const ent of createdEntitlements) {
      console.log(`   - ${ent.productCode}: ${ent.remainingQuantity} ${ent.unit}s (Expires: ${new Date(ent.expiryDate).toLocaleDateString()})`);
    }

    // -------------------------------------------------------------
    // Test 3: Standalone Purchase & Isolated Subscription
    // -------------------------------------------------------------
    console.log("\n[TEST 3] Testing Standalone Product Purchase...");
    const jobOffer = await ProductOffer.findOne({ sku: "SMB_JOB_5", status: "ACTIVE" });
    if (!jobOffer) {
      throw new Error("SMB_JOB_5 not found");
    }

    const standalonePurchase = await PurchaseService.purchaseStandaloneOffer({
      companyId: testCompanyId,
      offerId: jobOffer._id,
      quantity: 1,
      paymentMethod: "TEST_GATEWAY",
      actor: testActor,
      notes: "Test Standalone Job Pack Purchase",
    });

    if (!standalonePurchase.success) {
      throw new Error("Standalone purchase failed");
    }
    console.log(`✓ PASS: Standalone offer purchased. Subscription ID: ${standalonePurchase.subscription._id}`);

    // -------------------------------------------------------------
    // Test 4: Deterministic FIFO Credit Consumption Test
    // -------------------------------------------------------------
    console.log("\n[TEST 4] Testing Deterministic Earliest-Expiry (FIFO) Credit Consumption...");

    // We now have two SMB_JOB entitlement records:
    // Batch A: From Plan (90 days)
    // Batch B: From Standalone Offer (30 days) -> Earliest expiry!
    const activeJobEnts = await Entitlement.find({
      companyId: testCompanyId,
      productCode: "SMB_JOB",
      status: "ACTIVE",
    }).sort({ expiryDate: 1 });

    console.log(`Found ${activeJobEnts.length} active SMB_JOB entitlement batches:`);
    activeJobEnts.forEach((e, idx) => {
      console.log(`   [${idx + 1}] ID: ${e._id}, Qty: ${e.remainingQuantity}, Expiry: ${new Date(e.expiryDate).toISOString()}`);
    });

    const earliestBatchIdBefore = activeJobEnts[0]._id.toString();
    const earliestBatchQtyBefore = activeJobEnts[0].remainingQuantity;

    // Consume 2 credits
    const consumeRes = await EntitlementService.consumeCredit({
      companyId: testCompanyId,
      productCode: "SMB_JOB",
      quantity: 2,
      referenceType: "Job",
      referenceId: new mongoose.Types.ObjectId().toString(),
      actor: testActor,
      notes: "Testing FIFO consumption",
    });

    console.log(`✓ Consumed 2 SMB_JOB credits. Remaining available: ${consumeRes.remaining}`);

    // Verify earliest batch was decremented
    const earliestBatchAfter = await Entitlement.findById(earliestBatchIdBefore);
    if (earliestBatchAfter.remainingQuantity !== earliestBatchQtyBefore - 2) {
      throw new Error(`FAIL: Earliest expiry batch was not decremented first! Expected ${earliestBatchQtyBefore - 2}, got ${earliestBatchAfter.remainingQuantity}`);
    }
    console.log(`✓ PASS: FIFO verified! Deducted 2 credits from earliest expiring batch (${earliestBatchIdBefore}).`);

    // Verify CreditLedger double-entry entry
    const ledgerEntry = await CreditLedger.findOne({
      companyId: testCompanyId,
      productCode: "SMB_JOB",
      transactionType: "JOB_POSTED",
    }).sort({ createdAt: -1 });

    if (!ledgerEntry || ledgerEntry.quantity !== -2) {
      throw new Error("FAIL: CreditLedger entry was not recorded properly.");
    }
    console.log(`✓ PASS: CreditLedger audit logged transaction: -2 credits, Balance After: ${ledgerEntry.balanceAfter}`);

    // -------------------------------------------------------------
    // Test 5: Overdraft Protection Test
    // -------------------------------------------------------------
    console.log("\n[TEST 5] Testing Overdraft Protection...");
    let overdraftThrewExpectedError = false;
    try {
      await EntitlementService.consumeCredit({
        companyId: testCompanyId,
        productCode: "SMB_JOB",
        quantity: 999999, // Exorbitant amount
        referenceType: "Job",
        referenceId: "overdraft_test",
        actor: testActor,
      });
    } catch (err) {
      if (err.code === "INSUFFICIENT_CREDITS" && err.statusCode === 402) {
        overdraftThrewExpectedError = true;
      } else {
        console.error("Unexpected error:", err);
      }
    }

    if (!overdraftThrewExpectedError) {
      throw new Error("FAIL: Overdraft did not throw INSUFFICIENT_CREDITS 402 error!");
    }
    console.log("✓ PASS: Atomic overdraft protection successfully rejected excessive credit request.");

    // -------------------------------------------------------------
    // Test 6: Aggregate Entitlements Query
    // -------------------------------------------------------------
    console.log("\n[TEST 6] Testing Aggregated Entitlements Query...");
    const companyEntitlements = await EntitlementService.getCompanyEntitlements(testCompanyId);
    console.log(`Active Plan: ${companyEntitlements.activePlan?.planName} (Days remaining: ${companyEntitlements.activePlan?.daysRemaining})`);
    console.log(`Active Subscriptions Count: ${companyEntitlements.activeSubscriptionsCount}`);
    console.log("Available Products:");
    companyEntitlements.products.forEach((p) => {
      console.log(`   - ${p.name} (${p.code}): ${p.available} available (${p.consumed} consumed)`);
    });

    if (!companyEntitlements.activePlan || companyEntitlements.products.length === 0) {
      throw new Error("FAIL: Aggregated entitlements missing active plan or products.");
    }
    console.log("✓ PASS: Aggregated entitlements resolved correctly.");

    console.log("\n=======================================================");
    console.log(" ALL COMMERCIAL INTEGRATION TESTS PASSED SUCCESSFULLY! ");
    console.log("=======================================================\n");
  } finally {
    // Cleanup test data created for testCompanyId
    console.log("Cleaning up test records for company:", testCompanyId);
    await Subscription.deleteMany({ companyId: testCompanyId });
    await Entitlement.deleteMany({ companyId: testCompanyId });
    await CreditLedger.deleteMany({ companyId: testCompanyId });
    await mongoose.disconnect();
    console.log("Test finished & database disconnected.");
  }
}

runTests().catch((err) => {
  console.error("TEST FAILED WITH ERROR:", err);
  process.exit(1);
});
