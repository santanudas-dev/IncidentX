/**
 * IncidentX Backend Server Entrypoint
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { apiRouter } from "./routes/api.js";
import { runAgentPipeline } from "./agent/pipeline.js";
import { SAMPLE_SCENARIOS } from "./data/samples.js";
import { saveIncident } from "./data/storage.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Mount API routes
app.use("/api", apiRouter);

// Pre-seed 2 demo incidents so the dashboard has rich historical context on first launch
async function seedDemoIncidents() {
  try {
    console.log("[IncidentX Server] Seeding initial demo incidents into storage...");
    // Seed DB pool incident
    const dbSample = SAMPLE_SCENARIOS[0];
    const res1 = await runAgentPipeline(dbSample.logs);
    saveIncident(res1.report);

    // Seed K8s OOM incident
    const k8sSample = SAMPLE_SCENARIOS[1];
    const res2 = await runAgentPipeline(k8sSample.logs);
    res2.report.status = "INVESTIGATING";
    saveIncident(res2.report);

    console.log("[IncidentX Server] Demo incidents successfully seeded.");
  } catch (err) {
    console.warn("[IncidentX Server] Seeding warning:", err.message);
  }
}

app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 IncidentX Agent Server running on http://localhost:${PORT}`);
  console.log(`📡 Gemini API Key: ${process.env.GEMINI_API_KEY ? "CONFIGURED (AI Agent Active)" : "NOT SET (Deterministic Fallback Active)"}`);
  console.log(`====================================================`);
  await seedDemoIncidents();
});
