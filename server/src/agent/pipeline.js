/**
 * IncidentX Autonomous Agent Pipeline Orchestrator
 *
 * Log Parser → Error Classifier → Correlation Engine → Severity Assessor → KB Retrieval → Report Generator
 */

import { parseLogs } from "./parser.js";
import { classifyErrors } from "./classifier.js";
import { correlateErrors } from "./correlator.js";
import { assessSeverity } from "./severity.js";
import { retrieveKnowledgeBase } from "./kbRetrieval.js";
import { runGeminiAnalysis } from "./gemini.js";
import { generateIncidentReport } from "./reporter.js";

export async function runAgentPipeline(rawLogs, options = {}) {
  const startTime = Date.now();
  const stages = [];

  // Stage 1: Log Parser
  const t1 = Date.now();
  const parsedResult = parseLogs(rawLogs);
  const t1End = Date.now();
  stages.push({
    name: "Log Parser",
    status: "COMPLETED",
    durationMs: t1End - t1,
    details: `Parsed ${parsedResult.stats.total} entries (${parsedResult.stats.services.length} services, format: ${parsedResult.format})`
  });

  // Stage 2: Error Classifier
  const t2 = Date.now();
  const classification = classifyErrors(parsedResult);
  const t2End = Date.now();
  stages.push({
    name: "Error Classifier",
    status: "COMPLETED",
    durationMs: t2End - t2,
    details: `Detected ${classification.totalErrors} errors, ${classification.totalWarnings} warnings across ${classification.patterns.length} error pattern(s)`
  });

  // Stage 3: Correlation Engine
  const t3 = Date.now();
  const correlation = correlateErrors(parsedResult, classification);
  const t3End = Date.now();
  stages.push({
    name: "Correlation Engine",
    status: "COMPLETED",
    durationMs: t3End - t3,
    details: `Correlated ${correlation.causalChain.length} cascade step(s). Culprit: [${correlation.culpritService}]. Evidence count: ${correlation.evidenceEntries.length}`
  });

  // Stage 4: Severity Assessor
  const t4 = Date.now();
  const severity = assessSeverity(parsedResult, classification, correlation);
  const t4End = Date.now();
  stages.push({
    name: "Severity Assessor",
    status: "COMPLETED",
    durationMs: t4End - t4,
    details: `Assessed ${severity.level} severity (Score: ${severity.score}/100, Target SLA: ${severity.targetSlaMinutes}m)`
  });

  // Stage 5: Knowledge Base Retrieval
  const t5 = Date.now();
  const kbResult = retrieveKnowledgeBase(classification, correlation);
  const t5End = Date.now();
  stages.push({
    name: "Knowledge Base Retrieval",
    status: "COMPLETED",
    durationMs: t5End - t5,
    details: `Matched runbook "${kbResult.matchedRunbook.title}" (${kbResult.confidence}% confidence)`
  });

  // Stage 6: AI / Deterministic Synthesis
  const t6 = Date.now();
  const aiSynthesis = await runGeminiAnalysis({
    apiKey: options.apiKey,
    parsedResult,
    classification,
    correlation,
    severity,
    kbResult
  });
  const t6End = Date.now();
  stages.push({
    name: "AI Report Synthesis",
    status: "COMPLETED",
    durationMs: t6End - t6,
    details: `Generated via ${aiSynthesis.engineMode} (${aiSynthesis.agentConfidence}% confidence)`
  });

  // Stage 7: Report Generator
  const executionTiming = {
    totalMs: Date.now() - startTime,
    stages
  };

  const report = generateIncidentReport({
    parsedResult,
    classification,
    correlation,
    severity,
    kbResult,
    aiSynthesis,
    executionTiming
  });

  return {
    report,
    parsedResult,
    classification,
    correlation,
    severity,
    kbResult
  };
}
