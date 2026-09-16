/**
 * One-time script: Bulk re-indexes all active+approved jobs from MongoDB into OpenSearch.
 *
 * Usage:
 *   node scripts/reindex-opensearch.js
 *
 * Requires .env to be configured with:
 *   OPENSEARCH_NODE, OPENSEARCH_USERNAME, OPENSEARCH_PASSWORD,
 *   OPENSEARCH_ENABLED=true, MONGODB_URI
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const { osAvailable } = require("../src/config/opensearch");
const { createJobsIndex, bulkReindex } = require("../src/services/opensearch.service");

async function run() {
  console.log("═══════════════════════════════════════════");
  console.log("  MavenJobs — OpenSearch Re-index Script   ");
  console.log("═══════════════════════════════════════════");

  // 1. Check OS is available
  const available = await osAvailable();
  if (!available) {
    console.error("✗ OpenSearch is not available. Check OPENSEARCH_NODE and OPENSEARCH_ENABLED.");
    process.exit(1);
  }

  // 2. Connect to MongoDB using central db config (includes DNS SRV fix)
  console.log("→ Connecting to MongoDB...");
  await connectDB();
  console.log("✓ MongoDB connected");

  // 3. Create index (if not exists) + bulk index
  console.log("→ Creating/verifying jobs index...");
  await createJobsIndex();

  console.log("→ Starting bulk re-index...");
  const count = await bulkReindex();

  console.log(`✓ Done. ${count} jobs indexed into OpenSearch.`);

  await mongoose.disconnect();
  const { getClient } = require("../src/config/opensearch");
  try {
    await getClient().close();
  } catch (_) {}
  process.exitCode = 0;
}

run().catch((err) => {
  console.error("✗ Reindex failed:", err);
  process.exit(1);
});
