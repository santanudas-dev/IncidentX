/**
 * Agent Step 6: Gemini AI Agent & Deterministic Fallback
 * Incorporates Gemini 3.8 Flash for intelligent semantic synthesis,
 * with complete deterministic fallback when GEMINI_API_KEY is not configured.
 */

import { GoogleGenAI } from "@google/genai";

export async function runGeminiAnalysis({
  apiKey,
  parsedResult,
  classification,
  correlation,
  severity,
  kbResult
}) {
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;

  if (!effectiveKey || effectiveKey.trim() === "" || effectiveKey === "optional_api_key_here") {
    // Return deterministic fallback
    return buildDeterministicAiOutput(parsedResult, classification, correlation, severity, kbResult, false);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: effectiveKey });

    const prompt = `You are IncidentX, an autonomous SRE and IT incident response specialist.
Analyze the following incident data and generate a structured JSON report.

CRITICAL INSTRUCTIONS:
1. NEVER invent or hallucinate log messages, timestamps, or services that are not in the provided evidence.
2. Provide a clear, actionable remediation plan with immediate mitigation and permanent fixes.
3. Keep the response in valid, strict JSON matching the schema below.

INCIDENT CONTEXT:
- Primary Category: ${classification.primaryCategory}
- Assessed Severity: ${severity.level} (Score: ${severity.score}/100)
- Culprit Service: ${correlation.culpritService}
- Affected Services: ${correlation.affectedServices.map((s) => s.service).join(", ")}
- Matched KB Runbook: ${kbResult.matchedRunbook.title}

VERIFIED LOG EVIDENCE:
${correlation.evidenceEntries
  .map(
    (e) => `[Line ${e.lineNumber}] ${e.timestamp} [${e.level}] ${e.service}: ${e.message}`
  )
  .join("\n")}

Respond ONLY with a JSON object in this exact structure:
{
  "title": "Clear concise incident title",
  "executiveSummary": "2-3 sentences summarizing what broke, why, and business impact.",
  "rootCauseDetailed": "Detailed technical explanation of the failure mechanism and propagation.",
  "propagationAnalysis": "Step-by-step description of how the failure propagated through the architecture.",
  "immediateActions": ["Action 1", "Action 2", "Action 3"],
  "permanentFixes": ["Fix 1", "Fix 2", "Fix 3"],
  "agentConfidence": 95
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (text) {
      try {
        const cleanJson = JSON.parse(text);
        return {
          ...cleanJson,
          engineMode: "gemini-3.8-flash",
          isAiGenerated: true
        };
      } catch {
        // Fallback if model output wasn't clean JSON
      }
    }

    return buildDeterministicAiOutput(parsedResult, classification, correlation, severity, kbResult, true);
  } catch (err) {
    console.warn("[IncidentX] Gemini API call skipped or failed, using deterministic engine:", err.message);
    return buildDeterministicAiOutput(parsedResult, classification, correlation, severity, kbResult, false, err.message);
  }
}

function buildDeterministicAiOutput(
  parsedResult,
  classification,
  correlation,
  severity,
  kbResult,
  hadApiAttempt = false,
  apiError = null
) {
  const culprit = correlation.culpritService || "infrastructure-core";
  const catLabel = classification.patterns[0]?.categoryLabel || classification.primaryCategory || "System";
  const initiatingMsg = correlation.initiatingEvent?.message || "Unknown anomaly";

  let title = `${catLabel} Failure on ${culprit}`;
  if (classification.primaryCategory === "DATABASE_ERROR") {
    title = `Database Connection Pool Saturation on ${culprit} Cascading to API Failures`;
  } else if (classification.primaryCategory === "RESOURCE_EXHAUSTION") {
    title = `Pod OOMKilled & Container CrashLoop in ${culprit}`;
  } else if (classification.primaryCategory === "AUTH_SECURITY") {
    title = `Authentication Outage & Token Verification Spike on ${culprit}`;
  } else if (classification.primaryCategory === "NETWORK_ERROR") {
    title = `Internal DNS Resolution & Service Discovery Partition on ${culprit}`;
  } else if (classification.primaryCategory === "CPU_OVERLOAD") {
    title = `High CPU Saturation & Thread Pool Starvation on ${culprit}`;
  }

  const affectedNames = correlation.affectedServices.map((s) => s.service).join(", ") || culprit;

  const executiveSummary = `A ${severity.level.toLowerCase()} severity incident was detected originating from [${culprit}], which triggered cascading failures across ${affectedNames}. The system identified ${correlation.evidenceEntries.length} verified evidence events indicating ${catLabel.toLowerCase()} degradation. Immediate containment is recommended to prevent further availability impact.`;

  const rootCauseDetailed = correlation.rootCauseSummary + ` Analysis reveals that the primary bottleneck initiated when: "${initiatingMsg}". This prevented worker threads from fulfilling downstream client requests.`;

  const propagationAnalysis = correlation.causalChain
    .map((c) => `Step ${c.step} [${c.service}]: ${c.description}`)
    .join("\n");

  return {
    title,
    executiveSummary,
    rootCauseDetailed,
    propagationAnalysis,
    immediateActions: kbResult.immediateMitigation || [
      "Review active connection states and isolate the affected service",
      "Scale up backup pods or restart affected container replicas",
      "Engage service on-call engineer"
    ],
    permanentFixes: kbResult.permanentFix || [
      "Implement circuit breakers and timeout thresholds",
      "Configure resource limits and auto-scaling policies",
      "Improve alerting thresholds on early warning indicators"
    ],
    agentConfidence: 94,
    engineMode: "deterministic-expert",
    isAiGenerated: false,
    apiNotice: apiError ? `Gemini API fallback active (${apiError})` : "Deterministic Expert Engine (API key not configured)"
  };
}
