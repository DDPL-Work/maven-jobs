/**
 * MavenJobs Subscription Transition Verification Script
 * Validates:
 * 1. Downgrade (Corporate -> SMB): Starts only after current plan ends, scheduled activation
 * 2. Same-Level Extension (Corporate -> Corporate): Immediate merge, validity extended
 * 3. Upgrade (SMB -> Corporate): Immediate start, dual-batch FIFO, old expired without touching new
 */
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Plan = require("../models/Plan");
const PlanVersion = require("../models/PlanVersion");
const Product = require("../models/Product");
const Subscription = require("../models/Subscription");
const Entitlement = require("../models/Entitlement");
const Company = require("../models/Company");
const CommercialOrder = require("../models/CommercialOrder");
const CommercialPayment = require("../models/CommercialPayment");
const PurchaseService = require("../services/commercial/purchase.service");
const EntitlementService = require("../services/commercial/entitlement.service");
const CreditLedgerService = require("../services/commercial/credit-ledger.service");

async function runVerification() {
  console.log("================================================================================");
  console.log(" MavenJobs Subscription Lifecycle: Upgrade, Downgrade & Extension Verification");
  console.log("================================================================================\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mavenjobs";
  await mongoose.connect(mongoUri);
  console.log(" Connected to MongoDB");

  const now = new Date();

  // Setup / fetch test products
  let hotProduct = await Product.findOne({ code: "HOT_VACANCY" });
  if (!hotProduct) {
    hotProduct = await Product.create({
      code: "HOT_VACANCY",
      name: "Hot Vacancy Job Posting",
      category: "JOB_POSTING",
      unit: "Job",
      defaultPrice: 1500,
      validity: 90,
      status: "ACTIVE",
    });
  }

  let smbProduct = await Product.findOne({ code: "SMB_JOB" });
  if (!smbProduct) {
    smbProduct = await Product.create({
      code: "SMB_JOB",
      name: "SMB Job Posting",
      category: "JOB_POSTING",
      unit: "Job",
      defaultPrice: 500,
      validity: 30,
      status: "ACTIVE",
    });
  }

  // Setup test plans
  let corporatePlan = await Plan.findOne({ code: "TEST_CORP" });
  if (!corporatePlan) {
    corporatePlan = await Plan.create({
      name: "Test Corporate Plan",
      code: "TEST_CORP",
      planType: "CORPORATE",
      status: "ACTIVE",
      description: "Corporate test tier",
    });
  }
  let corpVersion = await PlanVersion.findOne({ planId: corporatePlan._id, status: "PUBLISHED" });
  if (!corpVersion) {
    corpVersion = await PlanVersion.create({
      planId: corporatePlan._id,
      name: "Test Corporate Plan v1",
      version: 1,
      status: "PUBLISHED",
      basePrice: 10000,
      finalPrice: 11800,
      validity: 90,
      validityUnit: "DAYS",
      billingCycle: "QUARTERLY",
      taxAmount: 1800,
      items: [
        {
          productId: hotProduct._id,
          productCode: hotProduct.code,
          productName: hotProduct.name,
          quantity: 10,
          unit: "Job",
        },
      ],
    });
  }

  let smbPlan = await Plan.findOne({ code: "TEST_SMB" });
  if (!smbPlan) {
    smbPlan = await Plan.create({
      name: "Test SMB Plan",
      code: "TEST_SMB",
      planType: "SMB",
      status: "ACTIVE",
      description: "SMB test tier",
    });
  }
  let smbVersion = await PlanVersion.findOne({ planId: smbPlan._id, status: "PUBLISHED" });
  if (!smbVersion) {
    smbVersion = await PlanVersion.create({
      planId: smbPlan._id,
      name: "Test SMB Plan v1",
      version: 1,
      status: "PUBLISHED",
      basePrice: 3000,
      finalPrice: 3540,
      validity: 30,
      validityUnit: "DAYS",
      billingCycle: "MONTHLY",
      taxAmount: 540,
      items: [
        {
          productId: hotProduct._id,
          productCode: hotProduct.code,
          productName: hotProduct.name,
          quantity: 4,
          unit: "Job",
        },
      ],
    });
  }

  // ---------------------------------------------------------------------------
  // TEST SCENARIO 1: DOWNGRADE (Corporate -> SMB)
  // ---------------------------------------------------------------------------
  console.log("\n--- [TEST 1] Downgrade (Corporate -> SMB) ---");
  const comp1 = await Company.create({
    name: "Test Corp One",
    email: "corp1@test.com",
    commercialStatus: "ACTIVE",
    createdByCRM: new mongoose.Types.ObjectId(),
  });

  const corpEnd1 = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // ends in 5 days
  const corpSub1 = await Subscription.create({
    companyId: comp1._id,
    subscriptionType: "PLAN",
    planId: corporatePlan._id,
    planVersionId: corpVersion._id,
    status: "ACTIVE",
    startDate: now,
    endDate: corpEnd1,
    commercialSnapshot: {
      planName: corporatePlan.name,
      planType: corporatePlan.planType,
      validityDays: 90,
      pricePaid: 11800,
    },
  });

  await Entitlement.create({
    companyId: comp1._id,
    subscriptionId: corpSub1._id,
    productId: hotProduct._id,
    productCode: hotProduct.code,
    productName: hotProduct.name,
    allocatedQuantity: 10,
    consumedQuantity: 6,
    remainingQuantity: 4,
    unit: "Job",
    startDate: now,
    expiryDate: corpEnd1,
    status: "ACTIVE",
  });

  comp1.planSnapshot = {
    planId: corporatePlan._id,
    planName: corporatePlan.name,
    planType: corporatePlan.planType,
    endDate: corpEnd1,
    services: [{ productCode: "HOT_VACANCY", quantity: 10, usedQuantity: 6 }],
  };
  await comp1.save();

  // Employer purchases lower SMB plan today
  const downgradeRes = await PurchaseService.purchasePlan({
    companyId: comp1._id,
    userId: new mongoose.Types.ObjectId(),
    planId: smbPlan._id,
    versionId: smbVersion._id,
    paymentMethod: "ONLINE",
    transactionId: "TEST-DOWNGRADE-TX",
  });

  console.log("   Downgrade Purchase Result:", {
    transitionType: downgradeRes.transitionType,
    isScheduled: downgradeRes.isScheduled,
    status: downgradeRes.subscription.status,
  });

  if (downgradeRes.transitionType !== "DOWNGRADE" || !downgradeRes.isScheduled || downgradeRes.subscription.status !== "SCHEDULED") {
    throw new Error("FAIL: Downgrade subscription should be SCHEDULED");
  }

  // Verify current plan is still active and untouched
  const currentSubStillActive = await Subscription.findById(corpSub1._id);
  if (currentSubStillActive.status !== "ACTIVE") {
    throw new Error("FAIL: Current Corporate plan must remain ACTIVE until end date");
  }

  const updatedComp1 = await Company.findById(comp1._id);
  if (!updatedComp1.scheduledPlan || String(updatedComp1.scheduledPlan.subscriptionId) !== String(downgradeRes.subscription._id)) {
    throw new Error("FAIL: Company scheduledPlan metadata not set properly");
  }
  console.log("   ✓ Downgrade successfully SCHEDULED. Corporate remains ACTIVE until", corpEnd1.toISOString().slice(0, 10));

  // Now simulate arrival of plan end date (5 days later)
  console.log("   Simulating arrival of current plan end date (transition activation)...");
  downgradeRes.subscription.startDate = new Date(Date.now() - 1000); // make it due
  await downgradeRes.subscription.save();

  const activatedCount = await PurchaseService.activateScheduledSubscriptions(comp1._id);
  console.log("   Activated count:", activatedCount);

  const promotedSub = await Subscription.findById(downgradeRes.subscription._id);
  const oldExpiredSub = await Subscription.findById(corpSub1._id);
  const compAfterActivation = await Company.findById(comp1._id);

  console.log("   promotedSub.status:", promotedSub?.status);
  console.log("   oldExpiredSub.status:", oldExpiredSub?.status);
  console.log("   compAfterActivation.scheduledPlan:", compAfterActivation?.scheduledPlan);

  const hasScheduledPlan = compAfterActivation.scheduledPlan && compAfterActivation.scheduledPlan.subscriptionId;
  if (promotedSub.status !== "ACTIVE" || oldExpiredSub.status !== "EXPIRED" || hasScheduledPlan) {
    throw new Error(`FAIL: Scheduled transition activation failed: promoted=${promotedSub.status}, old=${oldExpiredSub.status}, scheduled=${JSON.stringify(compAfterActivation.scheduledPlan)}`);
  }

  const freshSmbEnt = await Entitlement.findOne({
    companyId: comp1._id,
    subscriptionId: promotedSub._id,
    status: "ACTIVE",
  });
  if (!freshSmbEnt || freshSmbEnt.remainingQuantity !== 4) {
    throw new Error("FAIL: Fresh SMB entitlements were not activated properly");
  }
  console.log("   ✓ Scheduled date arrived: Corporate expired (credits vanished), SMB activated with fresh 4 credits!");

  // ---------------------------------------------------------------------------
  // TEST SCENARIO 2: SAME-LEVEL RENEWAL (Corporate -> Corporate)
  // ---------------------------------------------------------------------------
  console.log("\n--- [TEST 2] Same-Level Renewal (Corporate -> Corporate) ---");
  const comp2 = await Company.create({
    name: "Test Corp Two",
    email: "corp2@test.com",
    commercialStatus: "ACTIVE",
    createdByCRM: new mongoose.Types.ObjectId(),
  });

  const corpEnd2 = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days left
  const corpSub2 = await Subscription.create({
    companyId: comp2._id,
    subscriptionType: "PLAN",
    planId: corporatePlan._id,
    planVersionId: corpVersion._id,
    status: "ACTIVE",
    startDate: now,
    endDate: corpEnd2,
    commercialSnapshot: {
      planName: corporatePlan.name,
      planType: corporatePlan.planType,
      validityDays: 90,
      pricePaid: 11800,
    },
  });

  // 4 Hot Vacancies remaining
  await Entitlement.create({
    companyId: comp2._id,
    subscriptionId: corpSub2._id,
    productId: hotProduct._id,
    productCode: hotProduct.code,
    productName: hotProduct.name,
    allocatedQuantity: 10,
    consumedQuantity: 6,
    remainingQuantity: 4,
    unit: "Job",
    startDate: now,
    expiryDate: corpEnd2,
    status: "ACTIVE",
  });

  comp2.planSnapshot = {
    planId: corporatePlan._id,
    planName: corporatePlan.name,
    planType: corporatePlan.planType,
    endDate: corpEnd2,
    services: [{ productCode: "HOT_VACANCY", quantity: 10, usedQuantity: 6 }],
  };
  await comp2.save();

  // Employer repurchases Corporate Plan today (10 new credits)
  const sameLevelRes = await PurchaseService.purchasePlan({
    companyId: comp2._id,
    userId: new mongoose.Types.ObjectId(),
    planId: corporatePlan._id,
    versionId: corpVersion._id,
    paymentMethod: "ONLINE",
    transactionId: "TEST-SAME-LEVEL-TX",
  });

  console.log("   Same-Level Purchase Result:", {
    transitionType: sameLevelRes.transitionType,
    status: sameLevelRes.subscription.status,
  });

  if (sameLevelRes.transitionType !== "SAME_LEVEL_RENEWAL" || sameLevelRes.subscription.status !== "ACTIVE") {
    throw new Error("FAIL: Same-level renewal should be active immediately");
  }

  // Check live active entitlements: should be 14 total (4 old + 10 new)
  const activeSameEnts = await Entitlement.find({
    companyId: comp2._id,
    status: "ACTIVE",
    productCode: "HOT_VACANCY",
  });
  const totalSameAvail = activeSameEnts.reduce((sum, e) => sum + e.remainingQuantity, 0);
  console.log("   Total Available Hot Vacancies:", totalSameAvail);

  if (totalSameAvail !== 14) {
    throw new Error(`FAIL: Expected 14 merged credits (4 old + 10 new), got ${totalSameAvail}`);
  }

  // Verify validity of merged credits is extended to new 90 days end date
  const newExpectedEnd = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const activeEntExpiry = new Date(activeSameEnts[0].expiryDate).toISOString().slice(0, 10);
  console.log("   Active Entitlement Expiry Date:", activeEntExpiry, "(Expected ~", newExpectedEnd, ")");

  if (activeEntExpiry !== newExpectedEnd) {
    throw new Error(`FAIL: Expected expiry date ${newExpectedEnd}, got ${activeEntExpiry}`);
  }
  console.log("   ✓ Same-level renewal: 4 old + 10 new = 14 credits merged, and validity extended to 90 days!");

  // ---------------------------------------------------------------------------
  // TEST SCENARIO 3: UPGRADE (SMB -> Corporate)
  // ---------------------------------------------------------------------------
  console.log("\n--- [TEST 3] Upgrade (SMB -> Corporate) ---");
  const comp3 = await Company.create({
    name: "Test SMB Three",
    email: "smb3@test.com",
    commercialStatus: "ACTIVE",
    createdByCRM: new mongoose.Types.ObjectId(),
  });

  const smbEnd3 = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days left
  const smbSub3 = await Subscription.create({
    companyId: comp3._id,
    subscriptionType: "PLAN",
    planId: smbPlan._id,
    planVersionId: smbVersion._id,
    status: "ACTIVE",
    startDate: now,
    endDate: smbEnd3,
    commercialSnapshot: {
      planName: smbPlan.name,
      planType: smbPlan.planType,
      validityDays: 30,
      pricePaid: 3540,
    },
  });

  // Batch 1: 4 Hot Vacancies remaining from SMB, expiring in 10 days
  const oldBatchEnt = await Entitlement.create({
    companyId: comp3._id,
    subscriptionId: smbSub3._id,
    productId: hotProduct._id,
    productCode: hotProduct.code,
    productName: hotProduct.name,
    allocatedQuantity: 4,
    consumedQuantity: 0,
    remainingQuantity: 4,
    unit: "Job",
    startDate: now,
    expiryDate: smbEnd3,
    status: "ACTIVE",
  });

  comp3.planSnapshot = {
    planId: smbPlan._id,
    planName: smbPlan.name,
    planType: smbPlan.planType,
    endDate: smbEnd3,
    services: [{ productCode: "HOT_VACANCY", quantity: 4, usedQuantity: 0 }],
  };
  await comp3.save();

  // Employer upgrades to Corporate Plan today (10 new credits for 90 days)
  const upgradeRes = await PurchaseService.purchasePlan({
    companyId: comp3._id,
    userId: new mongoose.Types.ObjectId(),
    planId: corporatePlan._id,
    versionId: corpVersion._id,
    paymentMethod: "ONLINE",
    transactionId: "TEST-UPGRADE-TX",
  });

  console.log("   Upgrade Purchase Result:", {
    transitionType: upgradeRes.transitionType,
    status: upgradeRes.subscription.status,
  });

  if (upgradeRes.transitionType !== "UPGRADE" || upgradeRes.subscription.status !== "ACTIVE") {
    throw new Error("FAIL: Upgrade should start immediately with ACTIVE status");
  }

  // Check that dual-batch active entitlements exist
  const activeBatches = await Entitlement.find({
    companyId: comp3._id,
    productCode: "HOT_VACANCY",
    status: "ACTIVE",
    remainingQuantity: { $gt: 0 },
  }).sort({ expiryDate: 1 });

  console.log("   Active Entitlement Batches Count:", activeBatches.length);
  if (activeBatches.length !== 2) {
    throw new Error(`FAIL: Expected 2 active entitlement batches for upgrade, got ${activeBatches.length}`);
  }

  const batch1 = activeBatches[0]; // Old SMB batch
  const batch2 = activeBatches[1]; // New Corporate batch

  console.log("   Batch 1 (Old SMB):", {
    remaining: batch1.remainingQuantity,
    expiry: batch1.expiryDate.toISOString().slice(0, 10),
  });
  console.log("   Batch 2 (New Corp):", {
    remaining: batch2.remainingQuantity,
    expiry: batch2.expiryDate.toISOString().slice(0, 10),
  });

  const totalPool = batch1.remainingQuantity + batch2.remainingQuantity;
  if (totalPool !== 14) {
    throw new Error(`FAIL: Total stacked pool should be 14, got ${totalPool}`);
  }
  console.log("   ✓ Dual-batch active: 4 credits (expires in 10d) + 10 credits (expires in 90d) = 14 total");

  // Recruiter posts 2 jobs -> FIFO must consume from Batch 1 first!
  console.log("   Consuming 2 Hot Vacancy credits (FIFO earliest-expiry-first)...");
  await EntitlementService.consumeCredit({
    companyId: comp3._id,
    productCode: "HOT_VACANCY",
    quantity: 2,
    referenceType: "Job",
    referenceId: "JOB-TEST-001",
    notes: "Posting 2 test jobs",
  });

  const batch1AfterConsume = await Entitlement.findById(batch1._id);
  const batch2AfterConsume = await Entitlement.findById(batch2._id);

  console.log("   After consumption of 2 credits:");
  console.log("     Batch 1 remaining:", batch1AfterConsume.remainingQuantity, "(expected: 2)");
  console.log("     Batch 2 remaining:", batch2AfterConsume.remainingQuantity, "(expected: 10)");

  if (batch1AfterConsume.remainingQuantity !== 2 || batch2AfterConsume.remainingQuantity !== 10) {
    throw new Error("FAIL: FIFO earliest-expiry consumption did not consume from Batch 1 first");
  }
  console.log("   ✓ FIFO confirmed: Batch 1 consumed first (2 left), Batch 2 untouched (10 left)");

  // Now simulate Day 11 arrives (Batch 1 expires)
  console.log("   Simulating arrival of Day 11 (Batch 1 validity ends)...");
  batch1AfterConsume.expiryDate = new Date(Date.now() - 1000); // in the past
  await batch1AfterConsume.save();

  // Run expiry sweep
  await PurchaseService.checkAndExpireSubscriptions();

  const batch1AfterExpiry = await Entitlement.findById(batch1._id);
  const batch2AfterExpiry = await Entitlement.findById(batch2._id);

  console.log("   After Day 11 expiry check:");
  console.log("     Batch 1 status:", batch1AfterExpiry.status, "remaining:", batch1AfterExpiry.remainingQuantity, "(expected EXPIRED, 0)");
  console.log("     Batch 2 status:", batch2AfterExpiry.status, "remaining:", batch2AfterExpiry.remainingQuantity, "(expected ACTIVE, 10)");

  if (batch1AfterExpiry.status !== "EXPIRED" || batch1AfterExpiry.remainingQuantity !== 0) {
    throw new Error("FAIL: Batch 1 should be EXPIRED with 0 remaining");
  }
  if (batch2AfterExpiry.status !== "ACTIVE" || batch2AfterExpiry.remainingQuantity !== 10) {
    throw new Error("FAIL: Batch 2 should remain ACTIVE with 10 credits untouched");
  }
  console.log("   ✓ Day 11 confirmed: Leftover 2 old credits vanished, new 10 Corporate credits 100% unaffected!");

  // ---------------------------------------------------------------------------
  // TEST SCENARIO 4: FREE TIER / EXPIRED PLAN TRANSITION (Free -> Paid Fresh Start)
  // ---------------------------------------------------------------------------
  console.log("\n--- [TEST 4] Free Tier / Expired Plan Transition (Free -> SMB Fresh Start) ---");
  const comp4 = await Company.create({
    name: "Test Free Co Four",
    email: "free4@test.com",
    commercialStatus: "ACTIVE",
    createdByCRM: new mongoose.Types.ObjectId(),
  });

  // Setup Free Plan
  let freePlan = await Plan.findOne({ code: "TEST_FREE" });
  if (!freePlan) {
    freePlan = await Plan.create({
      name: "Test Free Plan",
      code: "TEST_FREE",
      planType: "FREE",
      status: "ACTIVE",
      description: "Free tier grant",
    });
  }
  let freeVersion = await PlanVersion.findOne({ planId: freePlan._id, status: "PUBLISHED" });
  if (!freeVersion) {
    freeVersion = await PlanVersion.create({
      planId: freePlan._id,
      name: "Test Free Plan v1",
      version: 1,
      status: "PUBLISHED",
      basePrice: 0,
      finalPrice: 0,
      validity: 90,
      validityUnit: "DAYS",
      billingCycle: "CUSTOM",
      taxAmount: 0,
      items: [
        {
          productId: hotProduct._id,
          productCode: hotProduct.code,
          productName: hotProduct.name,
          quantity: 2,
          unit: "Job",
        },
      ],
    });
  }

  const freeSub4 = await Subscription.create({
    companyId: comp4._id,
    subscriptionType: "PLAN",
    planId: freePlan._id,
    planVersionId: freeVersion._id,
    status: "ACTIVE",
    startDate: now,
    endDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
    commercialSnapshot: {
      planName: freePlan.name,
      planType: "FREE",
      validityDays: 90,
      pricePaid: 0,
    },
  });

  const freeEnt4 = await Entitlement.create({
    companyId: comp4._id,
    subscriptionId: freeSub4._id,
    productId: hotProduct._id,
    productCode: hotProduct.code,
    productName: hotProduct.name,
    allocatedQuantity: 2,
    consumedQuantity: 0,
    remainingQuantity: 2,
    unit: "Job",
    startDate: now,
    expiryDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
    status: "ACTIVE",
  });

  comp4.planSnapshot = {
    planId: freePlan._id,
    planName: freePlan.name,
    planType: "FREE",
    endDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
    services: [{ productCode: "HOT_VACANCY", quantity: 2, usedQuantity: 0 }],
  };
  await comp4.save();

  // Employer on Free Tier now purchases paid SMB Plan (4 fresh Hot Vacancies)
  const freeToSmbRes = await PurchaseService.purchasePlan({
    companyId: comp4._id,
    userId: new mongoose.Types.ObjectId(),
    planId: smbPlan._id,
    versionId: smbVersion._id,
    paymentMethod: "ONLINE",
    transactionId: "TEST-FREE-TO-SMB-TX",
  });

  console.log("   Free -> SMB Transition Result:", {
    transitionType: freeToSmbRes.transitionType,
    status: freeToSmbRes.subscription.status,
  });

  if (freeToSmbRes.transitionType !== "FRESH_START") {
    throw new Error(`FAIL: Free -> SMB should be FRESH_START, got ${freeToSmbRes.transitionType}`);
  }

  // Verify old free subscription is EXPIRED
  const oldFreeSubAfter = await Subscription.findById(freeSub4._id);
  if (oldFreeSubAfter.status !== "EXPIRED") {
    throw new Error(`FAIL: Old free subscription must be EXPIRED, got ${oldFreeSubAfter.status}`);
  }

  // Verify old free entitlement is EXPIRED with 0 remaining
  const oldFreeEntAfter = await Entitlement.findById(freeEnt4._id);
  if (oldFreeEntAfter.status !== "EXPIRED" || oldFreeEntAfter.remainingQuantity !== 0) {
    throw new Error(`FAIL: Old free entitlement must be EXPIRED with 0 remaining, got status=${oldFreeEntAfter.status}, remaining=${oldFreeEntAfter.remainingQuantity}`);
  }

  // Verify active entitlements for company ONLY contain the fresh SMB credits (4 Hot Vacancies, NOT 2 + 4 = 6)
  const activeSmbEnts = await Entitlement.find({
    companyId: comp4._id,
    status: "ACTIVE",
    productCode: "HOT_VACANCY",
  });
  const totalSmbAvail = activeSmbEnts.reduce((sum, e) => sum + e.remainingQuantity, 0);
  console.log("   Active Hot Vacancies after Free -> SMB:", totalSmbAvail, "(expected: 4, NOT 6)");

  if (totalSmbAvail !== 4) {
    throw new Error(`FAIL: Expected pure 4 credits from SMB plan without old free credits, got ${totalSmbAvail}`);
  }

  // Verify Company planSnapshot services has quantity 4, NOT 6
  const comp4After = await Company.findById(comp4._id).lean();
  const hotService = comp4After.planSnapshot?.services?.find((s) => s.productCode === "HOT_VACANCY");
  if (!hotService || hotService.quantity !== 4) {
    throw new Error(`FAIL: Company planSnapshot should have quantity 4, got ${hotService?.quantity}`);
  }

  console.log("   ✓ Free -> Paid confirmed: Old free credits vanished (0 carried over), new SMB plan starts fresh with exactly 4 credits!");

  // ---------------------------------------------------------------------------
  // TEST SCENARIO 5: DOWNGRADE TO FREE (SMB -> Free Scheduled Transition)
  // ---------------------------------------------------------------------------
  console.log("\n--- [TEST 5] Downgrade to Free (SMB -> Free Scheduled Transition) ---");
  const comp5 = await Company.create({
    name: "Test SMB Co Five",
    email: "smb5@test.com",
    commercialStatus: "ACTIVE",
    createdByCRM: new mongoose.Types.ObjectId(),
  });

  const smbEnd5 = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // ends in 15 days
  const smbSub5 = await Subscription.create({
    companyId: comp5._id,
    subscriptionType: "PLAN",
    planId: smbPlan._id,
    planVersionId: smbVersion._id,
    status: "ACTIVE",
    startDate: now,
    endDate: smbEnd5,
    commercialSnapshot: {
      planName: smbPlan.name,
      planType: "SMB",
      validityDays: 30,
      pricePaid: 3540,
    },
  });

  await Entitlement.create({
    companyId: comp5._id,
    subscriptionId: smbSub5._id,
    productId: hotProduct._id,
    productCode: hotProduct.code,
    productName: hotProduct.name,
    allocatedQuantity: 4,
    consumedQuantity: 0,
    remainingQuantity: 4,
    unit: "Job",
    startDate: now,
    expiryDate: smbEnd5,
    status: "ACTIVE",
  });

  comp5.planSnapshot = {
    planId: smbPlan._id,
    planName: smbPlan.name,
    planType: "SMB",
    endDate: smbEnd5,
    services: [{ productCode: "HOT_VACANCY", quantity: 4, usedQuantity: 0 }],
  };
  await comp5.save();

  // Employer on SMB chooses to downgrade to Free plan
  const smbToFreeRes = await PurchaseService.purchasePlan({
    companyId: comp5._id,
    userId: new mongoose.Types.ObjectId(),
    planId: freePlan._id,
    versionId: freeVersion._id,
    paymentMethod: "FREE",
    transactionId: "TEST-SMB-TO-FREE-TX",
  });

  console.log("   SMB -> Free Transition Result:", {
    transitionType: smbToFreeRes.transitionType,
    isScheduled: smbToFreeRes.isScheduled,
    status: smbToFreeRes.subscription.status,
  });

  if (smbToFreeRes.transitionType !== "DOWNGRADE" || !smbToFreeRes.isScheduled || smbToFreeRes.subscription.status !== "SCHEDULED") {
    throw new Error(`FAIL: SMB -> Free should be SCHEDULED DOWNGRADE, got ${smbToFreeRes.transitionType}, status=${smbToFreeRes.subscription.status}`);
  }

  // Current SMB plan must remain ACTIVE until end date
  const smbSubStillActive = await Subscription.findById(smbSub5._id);
  if (smbSubStillActive.status !== "ACTIVE") {
    throw new Error(`FAIL: SMB plan must remain ACTIVE until end date, got ${smbSubStillActive.status}`);
  }

  // Current SMB entitlements must remain ACTIVE
  const smbEntStillActive = await Entitlement.findOne({ subscriptionId: smbSub5._id });
  if (smbEntStillActive.status !== "ACTIVE" || smbEntStillActive.remainingQuantity !== 4) {
    throw new Error("FAIL: SMB entitlements must remain ACTIVE with all credits intact");
  }

  // Company scheduledPlan must be populated with Free plan
  const comp5After = await Company.findById(comp5._id).lean();
  if (!comp5After.scheduledPlan || String(comp5After.scheduledPlan.subscriptionId) !== String(smbToFreeRes.subscription._id)) {
    throw new Error("FAIL: Company scheduledPlan metadata not set to scheduled Free plan");
  }

  console.log("   ✓ SMB -> Free confirmed: Current SMB plan remains ACTIVE until", smbEnd5.toISOString().slice(0, 10), ", and Free plan is SCHEDULED!");

  // Cleanup test records
  console.log("\nCleaning up test records...");
  await Company.deleteMany({ _id: { $in: [comp1._id, comp2._id, comp3._id, comp4._id, comp5._id] } });
  await Subscription.deleteMany({ companyId: { $in: [comp1._id, comp2._id, comp3._id, comp4._id, comp5._id] } });
  await Entitlement.deleteMany({ companyId: { $in: [comp1._id, comp2._id, comp3._id, comp4._id, comp5._id] } });

  console.log("\n================================================================================");
  console.log(" ALL 5 LIFECYCLE TRANSITION SCENARIOS PASSED WITH 100% SUCCESS!");
  console.log("================================================================================\n");

  await mongoose.disconnect();
}

runVerification().catch((err) => {
  console.error("\n❌ VERIFICATION TEST FAILED:", err);
  process.exit(1);
});
