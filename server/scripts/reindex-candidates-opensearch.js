/**
 * Bulk re-indexes all CandidateProfile documents from MongoDB into OpenSearch.
 *
 * Usage:
 *   node scripts/reindex-candidates-opensearch.js
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const { osAvailable } = require("../src/config/opensearch");
const {
  createCandidatesIndex,
  bulkReindexCandidates,
  CANDIDATES_INDEX,
} = require("../src/services/opensearch.service");

async function run() {
  console.log("═══════════════════════════════════════════");
  console.log(" MavenJobs — Candidate Re-index Script     ");
  console.log("═══════════════════════════════════════════");

  // 1. Check OS is available
  const available = await osAvailable();
  if (!available) {
    console.error("✗ OpenSearch is not available. Check OPENSEARCH_NODE and OPENSEARCH_ENABLED.");
    process.exitCode = 1;
    return;
  }

  // 2. Connect to MongoDB
  console.log("→ Connecting to MongoDB...");
  await connectDB();
  console.log("✓ MongoDB connected");

  // 3. Create index / mappings & bulk reindex
  console.log(`→ Creating/verifying index "${CANDIDATES_INDEX}"...`);
  await createCandidatesIndex();

  console.log("→ Starting bulk re-index of candidate profiles...");
  const count = await bulkReindexCandidates();

  console.log(`✓ Done. ${count} candidates indexed into OpenSearch index "${CANDIDATES_INDEX}".`);

  await mongoose.disconnect();
  const { getClient } = require("../src/config/opensearch");
  try {
    await getClient().close();
  } catch (_) {}
  process.exitCode = 0;
}

run().catch((err) => {
  console.error("✗ Candidate reindex failed:", err);
  process.exitCode = 1;
});
