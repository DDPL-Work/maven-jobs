const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8"]);
const dotenv = require("dotenv");
dotenv.config();

const Product = require("../models/Product");
const ProductOffer = require("../models/ProductOffer");
const Plan = require("../models/Plan");
const PlanVersion = require("../models/PlanVersion");

async function seedCommercial() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("Missing MONGO_URI");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB for commercial seeding...");

  // 1. Products
  const productsData = [
    {
      name: "SMB Job",
      code: "SMB_JOB",
      category: "JOB_POSTING",
      productType: "CREDIT_BASED",
      unit: "Job",
      allowStandalone: true,
      defaultPrice: 500,
      currency: "INR",
      validity: 30,
      validityUnit: "DAYS",
      features: [
        { key: "basicPosting", name: "Basic Job Posting", enabled: true },
        { key: "companyLogo", name: "Company Logo", enabled: false },
        { key: "candidateAlerts", name: "Candidate Alerts", enabled: false },
        { key: "topSearchPlacement", name: "Top Search Placement", enabled: false },
      ],
      description: "Standard cost-effective job posting for small and medium businesses.",
    },
    {
      name: "Hot Vacancy Job",
      code: "HOT_VACANCY",
      category: "JOB_POSTING",
      productType: "CREDIT_BASED",
      unit: "Job",
      allowStandalone: true,
      defaultPrice: 1200,
      currency: "INR",
      validity: 30,
      validityUnit: "DAYS",
      features: [
        { key: "companyLogo", name: "Company Logo", enabled: true },
        { key: "candidateAlerts", name: "Candidate Alerts", enabled: true },
        { key: "topSearchPlacement", name: "Top Search Placement", enabled: true },
        { key: "multipleCities", name: "Up to 3 Cities", enabled: true, value: 3 },
        { key: "extendedDescription", name: "Long Job Description", enabled: true },
      ],
      description: "High-visibility premium job posting with branding and top placement.",
    },
    {
      name: "Internship Job",
      code: "INTERNSHIP_JOB",
      category: "JOB_POSTING",
      productType: "CREDIT_BASED",
      unit: "Job",
      allowStandalone: true,
      defaultPrice: 400,
      currency: "INR",
      validity: 30,
      validityUnit: "DAYS",
      features: [
        { key: "stipendField", name: "Stipend Configuration", enabled: true },
        { key: "durationField", name: "Duration Configuration", enabled: true },
        { key: "startDateField", name: "Start Date Configuration", enabled: true },
      ],
      description: "Targeted job posting specifically for internships and college students.",
    },
    {
      name: "ResDex Resume Search",
      code: "RESDEX",
      category: "RESUME_SEARCH",
      productType: "CREDIT_BASED",
      unit: "Resume View",
      allowStandalone: true,
      defaultPrice: 20,
      currency: "INR",
      validity: 30,
      validityUnit: "DAYS",
      features: [
        { key: "advanceFilters", name: "Advanced Filters", enabled: true },
        { key: "downloadCv", name: "Download PDF CV", enabled: true },
        { key: "contactDetails", name: "View Direct Contact Info", enabled: true },
      ],
      description: "Access Naukri-grade resume database to view and contact verified candidates.",
    },
    {
      name: "AI Credits",
      code: "AI_CREDIT",
      category: "AI",
      productType: "CREDIT_BASED",
      unit: "AI Use",
      allowStandalone: true,
      defaultPrice: 10,
      currency: "INR",
      validity: 30,
      validityUnit: "DAYS",
      features: [
        { key: "generateJd", name: "Generate Job Description", enabled: true },
        { key: "improveJd", name: "Improve Job Description", enabled: true },
        { key: "screeningQuestions", name: "Generate Screening Questions", enabled: true },
      ],
      description: "Company-level AI credits for automated JD writing and screening.",
    },
    {
      name: "Job Booster",
      code: "JOB_BOOSTER",
      category: "ADD_ONS",
      productType: "USAGE_BASED",
      unit: "Booster",
      allowStandalone: true,
      defaultPrice: 800,
      currency: "INR",
      validity: 15,
      validityUnit: "DAYS",
      features: [
        { key: "emailBlast", name: "Direct Candidate Email Blast", enabled: true },
        { key: "socialBoost", name: "Social Media Highlight", enabled: true },
      ],
      description: "Boost existing job post to 10x more relevant candidates.",
    },
    {
      name: "ResDex User Seat",
      code: "RESDEX_SEAT",
      category: "USER_SEATS",
      productType: "SEAT_BASED",
      unit: "Seat",
      allowStandalone: true,
      defaultPrice: 1500,
      currency: "INR",
      validity: 90,
      validityUnit: "DAYS",
      features: [{ key: "subuserLogin", name: "Dedicated Sub-User Login", enabled: true }],
      description: "Independent recruiter user seat with personal search history.",
    },
    {
      name: "Job Posting User Seat",
      code: "JOB_POSTING_SEAT",
      category: "USER_SEATS",
      productType: "SEAT_BASED",
      unit: "Seat",
      allowStandalone: true,
      defaultPrice: 1000,
      currency: "INR",
      validity: 90,
      validityUnit: "DAYS",
      features: [{ key: "postingRights", name: "Independent Job Posting Rights", enabled: true }],
      description: "Seat for team members to manage jobs and review applications.",
    },
  ];

  const productMap = {};
  for (const item of productsData) {
    const p = await Product.findOneAndUpdate({ code: item.code }, { $set: item }, { upsert: true, new: true });
    productMap[item.code] = p;
    console.log(`✓ Product upserted: ${p.name} (${p.code})`);
  }

  // 2. Standalone Offers (SKUs)
  const offersData = [
    {
      productId: productMap["SMB_JOB"]._id,
      sku: "SMB_JOB_5",
      name: "5 SMB Jobs Pack",
      quantity: 5,
      price: 2000,
      validity: 30,
      discountPercent: 20,
      isPopular: false,
      description: "5 SMB Job Postings valid for 30 days",
    },
    {
      productId: productMap["SMB_JOB"]._id,
      sku: "SMB_JOB_10",
      name: "10 SMB Jobs Pack",
      quantity: 10,
      price: 3500,
      validity: 30,
      discountPercent: 30,
      isPopular: true,
      description: "10 SMB Job Postings valid for 30 days",
    },
    {
      productId: productMap["SMB_JOB"]._id,
      sku: "SMB_JOB_25",
      name: "25 SMB Jobs Pack",
      quantity: 25,
      price: 7500,
      validity: 60,
      discountPercent: 40,
      isPopular: false,
      description: "25 SMB Job Postings valid for 60 days",
    },
    {
      productId: productMap["HOT_VACANCY"]._id,
      sku: "HOT_JOB_5",
      name: "5 Hot Vacancy Jobs Pack",
      quantity: 5,
      price: 4500,
      validity: 30,
      discountPercent: 25,
      isPopular: false,
      description: "5 Hot Vacancies with Top Placement",
    },
    {
      productId: productMap["HOT_VACANCY"]._id,
      sku: "HOT_JOB_10",
      name: "10 Hot Vacancy Jobs Pack",
      quantity: 10,
      price: 8000,
      validity: 30,
      discountPercent: 33,
      isPopular: true,
      description: "10 Hot Vacancies with Top Placement",
    },
    {
      productId: productMap["RESDEX"]._id,
      sku: "RESDEX_100",
      name: "100 Resume Views",
      quantity: 100,
      price: 1500,
      validity: 30,
      discountPercent: 25,
      isPopular: true,
      description: "100 Direct Candidate Contact & Resume Views",
    },
    {
      productId: productMap["RESDEX"]._id,
      sku: "RESDEX_500",
      name: "500 Resume Views",
      quantity: 500,
      price: 6000,
      validity: 60,
      discountPercent: 40,
      isPopular: false,
      description: "500 Direct Candidate Contact & Resume Views",
    },
    {
      productId: productMap["AI_CREDIT"]._id,
      sku: "AI_100",
      name: "100 AI Credits",
      quantity: 100,
      price: 500,
      validity: 30,
      discountPercent: 50,
      isPopular: true,
      description: "100 AI Operations for JD Writing and Screening",
    },
    {
      productId: productMap["AI_CREDIT"]._id,
      sku: "AI_500",
      name: "500 AI Credits",
      quantity: 500,
      price: 2000,
      validity: 60,
      discountPercent: 60,
      isPopular: false,
      description: "500 AI Operations for JD Writing and Screening",
    },
  ];

  for (const o of offersData) {
    const offer = await ProductOffer.findOneAndUpdate({ sku: o.sku }, { $set: o }, { upsert: true, new: true });
    console.log(`✓ Offer upserted: ${offer.name} (${offer.sku})`);
  }

  // 3. Plans
  // 3.1 Free Plan
  let freePlan = await Plan.findOneAndUpdate(
    { code: "FREE" },
    {
      $set: {
        name: "Free Plan",
        code: "FREE",
        planType: "FREE",
        description: "Trial plan for new recruiters to explore the platform.",
        currentVersion: 1,
        status: "ACTIVE",
        isDefault: true,
        displayOrder: 1,
      },
    },
    { upsert: true, new: true }
  );

  await PlanVersion.findOneAndUpdate(
    { planId: freePlan._id, version: 1 },
    {
      $set: {
        name: "Free Plan v1",
        description: "1 Job + 10 AI Uses",
        billingCycle: "CUSTOM",
        validity: 30,
        validityUnit: "DAYS",
        basePrice: 0,
        discount: 0,
        taxPercent: 0,
        taxAmount: 0,
        finalPrice: 0,
        currency: "INR",
        status: "PUBLISHED",
        publishedAt: new Date(),
        items: [
          {
            productId: productMap["SMB_JOB"]._id,
            productCode: "SMB_JOB",
            productName: "SMB Job",
            quantity: 1,
            unit: "Job",
            validity: 30,
            userLimit: 1,
          },
          {
            productId: productMap["AI_CREDIT"]._id,
            productCode: "AI_CREDIT",
            productName: "AI Credits",
            quantity: 10,
            unit: "AI Use",
            validity: 30,
            userLimit: 1,
          },
        ],
      },
    },
    { upsert: true }
  );
  console.log(`✓ Plan & Version: Free Plan v1`);

  // 3.2 SMB Starter Plan
  let smbPlan = await Plan.findOneAndUpdate(
    { code: "SMB_STARTER" },
    {
      $set: {
        name: "SMB Starter Plan",
        code: "SMB_STARTER",
        planType: "SMB",
        description: "10 SMB Jobs, 500 Resume Views, 3 ResDex Users, 50 AI Credits",
        currentVersion: 1,
        status: "ACTIVE",
        featured: false,
        displayOrder: 2,
      },
    },
    { upsert: true, new: true }
  );

  await PlanVersion.findOneAndUpdate(
    { planId: smbPlan._id, version: 1 },
    {
      $set: {
        name: "SMB Starter Plan v1",
        description: "Foundational recruitment bundle for high-growth SMBs.",
        billingCycle: "QUARTERLY",
        validity: 90,
        validityUnit: "DAYS",
        basePrice: 5000,
        discount: 0,
        taxPercent: 18,
        taxAmount: 900,
        finalPrice: 5900,
        currency: "INR",
        status: "PUBLISHED",
        publishedAt: new Date(),
        items: [
          {
            productId: productMap["SMB_JOB"]._id,
            productCode: "SMB_JOB",
            productName: "SMB Job",
            quantity: 10,
            unit: "Job",
            validity: 30,
            userLimit: 3,
          },
          {
            productId: productMap["RESDEX"]._id,
            productCode: "RESDEX",
            productName: "ResDex Resume Search",
            quantity: 500,
            unit: "Resume View",
            validity: 90,
            userLimit: 3,
          },
          {
            productId: productMap["RESDEX_SEAT"]._id,
            productCode: "RESDEX_SEAT",
            productName: "ResDex User Seat",
            quantity: 3,
            unit: "Seat",
            validity: 90,
            userLimit: 3,
          },
          {
            productId: productMap["AI_CREDIT"]._id,
            productCode: "AI_CREDIT",
            productName: "AI Credits",
            quantity: 50,
            unit: "AI Use",
            validity: 90,
            userLimit: 3,
          },
        ],
      },
    },
    { upsert: true }
  );
  console.log(`✓ Plan & Version: SMB Starter Plan v1`);

  // 3.3 Corporate Plan
  let corpPlan = await Plan.findOneAndUpdate(
    { code: "CORPORATE" },
    {
      $set: {
        name: "Corporate Plan",
        code: "CORPORATE",
        planType: "CORPORATE",
        description: "Comprehensive corporate hiring package with Hot Vacancies and multi-seat access.",
        currentVersion: 1,
        status: "ACTIVE",
        featured: true,
        displayOrder: 3,
      },
    },
    { upsert: true, new: true }
  );

  await PlanVersion.findOneAndUpdate(
    { planId: corpPlan._id, version: 1 },
    {
      $set: {
        name: "Corporate Plan v1",
        description: "20 Hot Vacancy, 20 SMB Jobs, 2000 Resume Views, 8 ResDex Users, 3 Job Posting Users, 200 AI Credits",
        billingCycle: "QUARTERLY",
        validity: 90,
        validityUnit: "DAYS",
        basePrice: 25000,
        discount: 2000,
        taxPercent: 18,
        taxAmount: 4140,
        finalPrice: 27140,
        currency: "INR",
        status: "PUBLISHED",
        publishedAt: new Date(),
        items: [
          {
            productId: productMap["HOT_VACANCY"]._id,
            productCode: "HOT_VACANCY",
            productName: "Hot Vacancy Job",
            quantity: 20,
            unit: "Job",
            validity: 30,
            userLimit: 8,
            features: productMap["HOT_VACANCY"].features,
          },
          {
            productId: productMap["SMB_JOB"]._id,
            productCode: "SMB_JOB",
            productName: "SMB Job",
            quantity: 20,
            unit: "Job",
            validity: 30,
            userLimit: 8,
          },
          {
            productId: productMap["RESDEX"]._id,
            productCode: "RESDEX",
            productName: "ResDex Resume Search",
            quantity: 2000,
            unit: "Resume View",
            validity: 90,
            userLimit: 8,
          },
          {
            productId: productMap["RESDEX_SEAT"]._id,
            productCode: "RESDEX_SEAT",
            productName: "ResDex User Seat",
            quantity: 8,
            unit: "Seat",
            validity: 90,
            userLimit: 8,
          },
          {
            productId: productMap["JOB_POSTING_SEAT"]._id,
            productCode: "JOB_POSTING_SEAT",
            productName: "Job Posting User Seat",
            quantity: 3,
            unit: "Seat",
            validity: 90,
            userLimit: 3,
          },
          {
            productId: productMap["AI_CREDIT"]._id,
            productCode: "AI_CREDIT",
            productName: "AI Credits",
            quantity: 200,
            unit: "AI Use",
            validity: 90,
            userLimit: 8,
          },
        ],
      },
    },
    { upsert: true }
  );
  console.log(`✓ Plan & Version: Corporate Plan v1`);

  console.log("\n Commercial database seeded successfully!");
  process.exit(0);
}

seedCommercial().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
