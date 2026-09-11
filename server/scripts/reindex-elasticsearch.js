/**
 * One-time script: Bulk re-indexes all active+approved jobs from MongoDB into Elasticsearch.
 *
 * Usage:
 *   node scripts/reindex-elasticsearch.js
 *
 * Requires .env to be configured with:
 *   ELASTICSEARCH_NODE, ELASTICSEARCH_USERNAME, ELASTICSEARCH_PASSWORD,
 *   ELASTICSEARCH_ENABLED=true, MONGODB_URI
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const { esAvailable } = require("../src/config/elasticsearch");
const { createJobsIndex, bulkReindex } = require("../src/services/elasticsearch.service");

async function run() {
  console.log("═══════════════════════════════════════════");
  console.log("  MavenJobs — Elasticsearch Re-index Script");
  console.log("═══════════════════════════════════════════");

  // 1. Check ES is available
  const available = await esAvailable();
  if (!available) {
    console.error("✗ Elasticsearch is not available. Check ELASTICSEARCH_NODE and ELASTICSEARCH_ENABLED.");
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

  console.log(`✓ Done. ${count} jobs indexed into Elasticsearch.`);

  await mongoose.disconnect();
  const { getClient } = require("../src/config/elasticsearch");
  try {
    await getClient().close();
  } catch (_) {}
  process.exitCode = 0;
}

run().catch((err) => {
  console.error("✗ Reindex failed:", err);
  process.exit(1);
});
