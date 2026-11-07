/**
 * IncidentX Express API Router
 */

import { Router } from "express";
import multer from "multer";
import { runAgentPipeline } from "../agent/pipeline.js";
import { SAMPLE_SCENARIOS } from "../data/samples.js";
import { KNOWLEDGE_BASE } from "../kb/knowledgeBase.js";
import {
  saveIncident,
  getAllIncidents,
  getIncidentById,
  updateIncidentStatus,
  simulateSafeRunbookCommand
} from "../data/storage.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export const apiRouter = Router();

// Ingest and analyze logs (raw text or uploaded file)
apiRouter.post("/analyze", upload.single("file"), async (req, res) => {
  try {
    let logsContent = "";
    const apiKey = req.body?.apiKey || req.headers["x-gemini-api-key"] || "";

    if (req.file) {
      logsContent = req.file.buffer.toString("utf-8");
    } else if (req.body?.logs) {
      logsContent = req.body.logs;
    }

    if (!logsContent || logsContent.trim().length === 0) {
      return res.status(400).json({
        error: "Missing log input. Please provide logs via text body or file upload (TXT, JSON, CSV)."
      });
    }

    const result = await runAgentPipeline(logsContent, { apiKey });

    // Persist incident into history
    saveIncident(result.report);

    res.json({
      success: true,
      report: result.report,
      parsedResult: result.parsedResult,
      classification: result.classification,
      correlation: result.correlation,
      severity: result.severity,
      kbResult: result.kbResult
    });
  } catch (err) {
    console.error("[IncidentX API] Analysis error:", err);
    res.status(500).json({
      error: "Failed to analyze logs: " + err.message
    });
  }
});

// List sample scenarios
apiRouter.get("/samples", (req, res) => {
  res.json({
    samples: SAMPLE_SCENARIOS.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      format: s.format,
      category: s.category,
      severityExpected: s.severityExpected,
      logs: s.logs,
      logLength: s.logs.length,
      samplePreview: s.logs.slice(0, 300) + "..."
    }))
  });
});

// Get a specific sample by id
apiRouter.get("/samples/:id", (req, res) => {
  const sample = SAMPLE_SCENARIOS.find((s) => s.id === req.params.id);
  if (!sample) {
    return res.status(404).json({ error: "Sample not found" });
  }
  res.json(sample);
});

// List all incidents
apiRouter.get("/incidents", (req, res) => {
  const incidents = getAllIncidents();
  res.json({
    incidents,
    total: incidents.length
  });
});

// Get incident details by ID
apiRouter.get("/incidents/:id", (req, res) => {
  const incident = getIncidentById(req.params.id);
  if (!incident) {
    return res.status(404).json({ error: "Incident not found" });
  }
  res.json(incident);
});

// Update incident status
apiRouter.patch("/incidents/:id/status", (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }
  const updated = updateIncidentStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ error: "Incident not found" });
  }
  res.json({ success: true, incident: updated });
});

// Get knowledge base
apiRouter.get("/kb", (req, res) => {
  res.json({
    knowledgeBase: KNOWLEDGE_BASE
  });
});

// Simulate safe non-destructive runbook dry-run
apiRouter.post("/simulate-command", (req, res) => {
  const { commandId, command } = req.body;
  if (!command) {
    return res.status(400).json({ error: "Command is required" });
  }
  const simulation = simulateSafeRunbookCommand(commandId, command);
  res.json(simulation);
});

// Health check
apiRouter.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    agent: "IncidentX Autonomous SRE Agent",
    geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "optional_api_key_here"),
    timestamp: new Date().toISOString()
  });
});
