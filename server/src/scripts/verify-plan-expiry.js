const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../../.env") });
if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
  require("dotenv").config({ path: path.join(__dirname, "../../.env") });
}

const connectDB = require("../config/db");
const Company = require("../models/Company");
const User = require("../models/User");
const Plan = require("../models/Plan");
const PlanVersion = require("../models/PlanVersion");
const Product = require("../models/Product");
const Subscription = require("../models/Subscription");
const Entitlement = require("../models/Entitlement");
const CreditLedger = require("../models/CreditLedger");
const PurchaseService = require("../services/commercial/purchase.service");
const PlanService = require("../services/commercial/plan.service");

// Mock email sending during test
PurchaseService.sendOrderConfirmationNotification = async () => {};

async function runVerification() {
  console.log("\n========================================================");
  console.log("🚀 MAVEN JOBS: PLAN EXPIRY & COMMERCIAL LOGIC VERIFICATION");
  console.log("========================================================\n");

  await connectDB();

  const testSuffix = Date.now().toString(36);
  let testCompany = null;
  let testUser = null;
  let testPlan = null;
  let testPlanVersion = null;
  let testProduct = null;

  try {
    // 1. Setup minimal test fixtures
    console.log("📦 [1/6] Setting up test fixtures...");
    testProduct = await Product.findOne({ code: "SMB_JOB" });
    if (!testProduct) {
      testProduct = await Product.create({
        name: "Test SMB Job",
        code: "SMB_JOB",
        category: "JOB_POSTING",
        defaultPrice: 500,
        unit: "Job",
        status: "ACTIVE",
      });
    }

    testPlan = await Plan.findOne({ status: "ACTIVE" });
    if (testPlan) {
      testPlanVersion = await PlanVersion.findOne({ planId: testPlan._id, status: "PUBLISHED" });
    }

    if (!testPlan || !testPlanVersion) {
      testPlan = await Plan.create({
        name: `Test Plan ${testSuffix}`,
        code: `TP_${testSuffix.toUpperCase()}`,
        planType: "SMB",
        status: "ACTIVE",
      });
      testPlanVersion = await PlanVersion.create({
        planId: testPlan._id,
        version: 1,
        status: "PUBLISHED",
        basePrice: 5000,
        finalPrice: 5000,
        validity: 30,
        items: [
          {
            productId: testProduct._id,
            productCode: "SMB_JOB",
            productName: "SMB Job Postings",
            quantity: 10,
            unit: "Job",
            validityDays: 30,
          },
        ],
      });
      testPlan.activeVersion = testPlanVersion._id;
      await testPlan.save();
    }

    const CrmUser = require("../models/CrmUser");
    const existingCrm = await CrmUser.findOne();
    const crmUserId = existingCrm ? existingCrm._id : new mongoose.Types.ObjectId();

    testCompany = await Company.create({
      name: `Verification Test Co ${testSuffix}`,
      email: `test_${testSuffix}@example.com`,
      status: "ACTIVE",
      commercialStatus: "ACTIVE",
      createdByCRM: crmUserId,
    });

    testUser = await User.create({
      name: "Test Recruiter",
      email: `recruiter_${testSuffix}@example.com`,
      companyId: testCompany._id,
      role: "CLIENT",
    });

    console.log(`   ✓ Created test company: ${testCompany.name} (ID: ${testCompany._id})`);

    // ── TEST 1: Initial Purchase & Active Entitlement ──
    console.log("\n🧪 [2/6] TEST 1: Purchasing Base Plan...");
    const purchaseResult = await PurchaseService.purchasePlan({
      companyId: testCompany._id,
      userId: testUser._id,
      planId: testPlan._id,
      paymentMethod: "SIMULATED",
      transactionId: `TXN_${testSuffix}_1`,
    });

    const activeSub = purchaseResult.subscription;
    console.log(`   ✓ Purchased Plan: ${activeSub.commercialSnapshot?.planName} (Status: ${activeSub.status})`);

    const initialEnts = await Entitlement.find({
      companyId: testCompany._id,
      status: "ACTIVE",
    });
    console.log(`   ✓ Active Entitlements Created: ${initialEnts.length}`);
    if (initialEnts.length === 0) throw new Error("Entitlements were not created on purchase!");

    // ── TEST 2: Mid-Term Upgrade Stacking (Q2.4) ──
    console.log("\n🧪 [3/6] TEST 2: Mid-term Upgrade Credit Stacking (Q2.4)...");
    // Simulate consuming 1 credit
    const entToConsume = initialEnts[0];
    const originalQty = entToConsume.remainingQuantity;
    const qtyToDeduct = Math.min(1, originalQty);
    entToConsume.consumedQuantity = qtyToDeduct;
    entToConsume.remainingQuantity = originalQty - qtyToDeduct;
    await entToConsume.save();

    // Also update company.planSnapshot to keep both in sync
    const compForSnapshot = await Company.findById(testCompany._id);
    if (compForSnapshot?.planSnapshot?.services) {
      const snapSvc = compForSnapshot.planSnapshot.services.find(s => s.productCode === entToConsume.productCode);
      if (snapSvc) {
        snapSvc.usedQuantity = (snapSvc.usedQuantity || 0) + qtyToDeduct;
        await compForSnapshot.save();
      }
    }

    console.log(`   ✓ Consumed ${qtyToDeduct} credit(s). Remaining balance: ${entToConsume.remainingQuantity}`);

    // Upgrade mid-term (isUpgrade = true)
    const upgradeResult = await PurchaseService.purchasePlan({
      companyId: testCompany._id,
      userId: testUser._id,
      planId: testPlan._id,
      paymentMethod: "SIMULATED",
      transactionId: `TXN_${testSuffix}_UPG`,
      isUpgrade: true,
    });

    const upgradedEnt = await Entitlement.findOne({
      companyId: testCompany._id,
      subscriptionId: upgradeResult.subscription._id,
      productCode: entToConsume.productCode,
      status: "ACTIVE",
    });

    const planItemForProduct = testPlanVersion.items.find(i => i.productCode === entToConsume.productCode);
    const addedQty = planItemForProduct ? planItemForProduct.quantity : 0;
    const expectedStacked = (originalQty - qtyToDeduct) + addedQty;
    console.log(`   ✓ Stacked balance after upgrade: ${upgradedEnt.remainingQuantity} (Expected: ${expectedStacked}, added: ${addedQty})`);
    if (upgradedEnt.remainingQuantity !== expectedStacked) {
      throw new Error(`Upgrade stacking mismatch! Got ${upgradedEnt.remainingQuantity}, expected ${expectedStacked}`);
    }
    console.log("   ✅ Q2.4 Mid-Term Upgrade Stacking Verified!");

    // ── TEST 3: Plan Expiry & Forfeiture of Unused Credits (Q2.7) ──
    console.log("\n🧪 [4/6] TEST 3: Scheduled Expiration & Credit Forfeiture (Q2.7)...");
    // Backdate the subscription and entitlement to simulate expiry yesterday
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const currentSub = upgradeResult.subscription;
    currentSub.endDate = yesterday;
    await currentSub.save();

    upgradedEnt.expiryDate = yesterday;
    await upgradedEnt.save();

    // Trigger the automated expiry engine
    const expiryCycleResult = await PurchaseService.checkAndExpireSubscriptions();
    console.log("   ✓ Ran checkAndExpireSubscriptions():", expiryCycleResult);

    const refreshedSub = await Subscription.findById(currentSub._id);
    const refreshedEnt = await Entitlement.findById(upgradedEnt._id);
    const refreshedComp = await Company.findById(testCompany._id);

    console.log(`   ✓ Subscription status: ${refreshedSub.status} (Expected: EXPIRED)`);
    console.log(`   ✓ Entitlement status: ${refreshedEnt.status} (Expected: EXPIRED)`);
    console.log(`   ✓ Entitlement remaining: ${refreshedEnt.remainingQuantity} (Expected: 0)`);
    console.log(`   ✓ Company commercialStatus: ${refreshedComp.commercialStatus} (Expected: EXPIRED_GRACE)`);
    console.log(`   ✓ Plan Grace Expires At: ${refreshedComp.planGraceExpiresAt?.toISOString()}`);

    if (refreshedSub.status !== "EXPIRED" || refreshedEnt.status !== "EXPIRED" || refreshedEnt.remainingQuantity !== 0) {
      throw new Error("Plan expiry did not forfeit credits properly!");
    }
    if (refreshedComp.commercialStatus !== "EXPIRED_GRACE") {
      throw new Error("Company was not placed in EXPIRED_GRACE!");
    }

    const expiryLedger = await CreditLedger.findOne({
      companyId: testCompany._id,
      transactionType: "EXPIRED",
    }).sort({ createdAt: -1 });

    if (!expiryLedger) {
      throw new Error("CreditLedger record was not created for expired credits!");
    }
    console.log(`   ✓ CreditLedger forfeiture logged: ${expiryLedger.quantity} credits, reason: ${expiryLedger.notes}`);
    console.log("   ✅ Q2.7 Credit Forfeiture & Ledger Entry Verified!");

    // ── TEST 4: Renewal with Zero Carry-Forward (Q2.7) ──
    console.log("\n🧪 [5/6] TEST 4: Plan Renewal Starts Fresh (No Rollover)...");
    const renewResult = await PurchaseService.renewPlan({
      companyId: testCompany._id,
      userId: testUser._id,
      subscriptionId: refreshedSub._id,
      paymentMethod: "SIMULATED",
      transactionId: `TXN_${testSuffix}_RENEW`,
    });

    const renewedSub = renewResult.subscription;
    const renewedEnt = await Entitlement.findOne({
      companyId: testCompany._id,
      subscriptionId: renewedSub._id,
      productCode: testPlanVersion.items[0].productCode,
      status: "ACTIVE",
    });
    const refreshedCompAfterRenew = await Company.findById(testCompany._id);

    const expectedRenewQty = testPlanVersion.items[0].quantity; // Exact base plan, no rollover
    console.log(`   ✓ Renewed entitlement balance: ${renewedEnt.remainingQuantity} (Expected exact base: ${expectedRenewQty})`);
    console.log(`   ✓ Company commercialStatus: ${refreshedCompAfterRenew.commercialStatus} (Expected: ACTIVE)`);

    if (renewedEnt.remainingQuantity !== expectedRenewQty) {
      throw new Error(`Renewal leaked old credits! Got ${renewedEnt.remainingQuantity}, expected ${expectedRenewQty}`);
    }
    if (refreshedCompAfterRenew.commercialStatus !== "ACTIVE") {
      throw new Error("Company status was not restored to ACTIVE after renewal!");
    }
    console.log("   ✅ Q2.7 Renewal Fresh Quota Verified!");

    // ── TEST 5: Scheduled Downgrade Automatic Activation (Q2.5) ──
    console.log("\n🧪 [6/6] TEST 5: Scheduled Downgrade Activation (Q2.5)...");
    const scheduledSub = await Subscription.create({
      companyId: testCompany._id,
      subscriptionType: "PLAN",
      planId: testPlan._id,
      planVersionId: testPlanVersion._id,
      status: "SCHEDULED",
      startDate: yesterday, // Effective start date has arrived
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      commercialSnapshot: { planName: "Scheduled SMB Plan", validityDays: 30 },
    });

    await PurchaseService.checkAndExpireSubscriptions();

    const activatedSub = await Subscription.findById(scheduledSub._id);
    console.log(`   ✓ Scheduled subscription status: ${activatedSub.status} (Expected: ACTIVE)`);
    if (activatedSub.status !== "ACTIVE") {
      throw new Error("Scheduled subscription was not activated!");
    }
    console.log("   ✅ Q2.5 Scheduled Downgrade Activation Verified!");

    // ── TEST 6: Admin-Configured Read-Only Grace Period Control ──
    console.log("\n🧪 [7/7] TEST 6: Admin Custom Read-Only Grace Duration Control...");
    // A: Test Custom 45-day grace period
    const customGracePlan = await PlanService.createPlan({
      name: `Custom Grace Plan ${testSuffix}`,
      code: `CGP_${testSuffix}`,
      planType: "CUSTOM",
      validity: 30,
      gracePeriodDays: 45, // Custom admin-configured 45 days
      basePrice: 1000,
      publishImmediately: true,
      items: [
        {
          productId: testPlanVersion.items[0].productId,
          productCode: testPlanVersion.items[0].productCode,
          quantity: 5,
          unitPrice: 100,
        },
      ],
    }, { id: "admin-test" });

    // Expire activatedSub first so company has no other active plan
    activatedSub.status = "EXPIRED";
    await activatedSub.save();
    renewedSub.status = "EXPIRED";
    await renewedSub.save();

    const customPurchase = await PurchaseService.purchasePlan({
      companyId: testCompany._id,
      userId: testUser._id,
      planId: customGracePlan.plan._id,
      paymentMethod: "SIMULATED",
      transactionId: `TXN_${testSuffix}_CUSTOM`,
    });

    const customSub = customPurchase.subscription;
    console.log(`   ✓ Purchased plan with custom grace: ${customSub.commercialSnapshot?.gracePeriodDays} days`);
    if (customSub.commercialSnapshot?.gracePeriodDays !== 45) {
      throw new Error(`Expected commercialSnapshot.gracePeriodDays to be 45, got ${customSub.commercialSnapshot?.gracePeriodDays}`);
    }

    // Backdate to expire
    customSub.endDate = yesterday;
    await customSub.save();

    await PurchaseService.checkAndExpireSubscriptions();

    const compAfterCustomExpiry = await Company.findById(testCompany._id);
    const expectedGraceEnd = new Date(yesterday.getTime() + 45 * 24 * 60 * 60 * 1000);
    const diffMs = Math.abs(compAfterCustomExpiry.planGraceExpiresAt.getTime() - expectedGraceEnd.getTime());

    console.log(`   ✓ Company commercialStatus: ${compAfterCustomExpiry.commercialStatus} (Expected: EXPIRED_GRACE)`);
    console.log(`   ✓ Grace expires at: ${compAfterCustomExpiry.planGraceExpiresAt.toISOString()}`);
    console.log(`   ✓ Expected 45-day grace window diff: ${diffMs}ms`);

    if (compAfterCustomExpiry.commercialStatus !== "EXPIRED_GRACE" || diffMs > 2000) {
      throw new Error(`Grace period did not match admin configured 45 days!`);
    }

    // B: Test 0-day grace (Immediate lockout)
    const zeroGracePlan = await PlanService.createPlan({
      name: `Zero Grace Plan ${testSuffix}`,
      code: `ZGP_${testSuffix}`,
      planType: "CUSTOM",
      validity: 30,
      gracePeriodDays: 0, // Admin configured 0 days -> immediate lock
      basePrice: 1000,
      publishImmediately: true,
      items: [
        {
          productId: testPlanVersion.items[0].productId,
          productCode: testPlanVersion.items[0].productCode,
          quantity: 5,
          unitPrice: 100,
        },
      ],
    }, { id: "admin-test" });

    const zeroPurchase = await PurchaseService.purchasePlan({
      companyId: testCompany._id,
      userId: testUser._id,
      planId: zeroGracePlan.plan._id,
      paymentMethod: "SIMULATED",
      transactionId: `TXN_${testSuffix}_ZERO`,
    });

    const zeroSub = zeroPurchase.subscription;
    zeroSub.endDate = yesterday;
    await zeroSub.save();

    await PurchaseService.checkAndExpireSubscriptions();

    const compAfterZeroExpiry = await Company.findById(testCompany._id);
    console.log(`   ✓ 0-day grace company status: ${compAfterZeroExpiry.commercialStatus} (Expected: EXPIRED_LOCKED)`);
    if (compAfterZeroExpiry.commercialStatus !== "EXPIRED_LOCKED") {
      throw new Error(`Expected 0-day grace plan to lock company immediately to EXPIRED_LOCKED!`);
    }
    console.log("   ✅ Admin Configurable Grace Period (Custom & Zero) Verified!");

    // Clean up custom plans
    await Plan.deleteMany({ _id: { $in: [customGracePlan.plan._id, zeroGracePlan.plan._id] } });
    await PlanVersion.deleteMany({ planId: { $in: [customGracePlan.plan._id, zeroGracePlan.plan._id] } });

    console.log("\n========================================================");
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! ZERO DEFECTS FOUND.");
    console.log("========================================================\n");
  } catch (err) {
    console.error("\n❌ VERIFICATION TEST FAILED:", err);
  } finally {
    // Cleanup test data
    if (testCompany?._id) {
      await Promise.all([
        Company.deleteOne({ _id: testCompany._id }),
        User.deleteMany({ companyId: testCompany._id }),
        Subscription.deleteMany({ companyId: testCompany._id }),
        Entitlement.deleteMany({ companyId: testCompany._id }),
        CreditLedger.deleteMany({ companyId: testCompany._id }),
      ]);
      console.log("🧹 Cleaned up temporary test records.");
    }
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database.\n");
  }
}

runVerification();
