/**
 * Agent Step 7: Incident Report Generator
 * Assembles all analytical artifacts into a standardized, production-grade
 * Incident Response Report with actionable runbooks and verified evidence.
 */

let counter = 1000;

export function generateIncidentReport({
  parsedResult,
  classification,
  correlation,
  severity,
  kbResult,
  aiSynthesis,
  executionTiming
}) {
  const incidentNumber = ++counter;
  const year = new Date().getFullYear();
  const incidentId = `INC-${year}-${incidentNumber}`;

  // Assemble chronological error timeline
  const errorTimeline = [...classification.warningEvents, ...classification.errorEvents]
    .sort((a, b) => a.lineNumber - b.lineNumber)
    .map((event, index) => ({
      step: index + 1,
      id: event.id,
      lineNumber: event.lineNumber,
      timestamp: event.timestamp,
      level: event.level,
      service: event.service,
      category: event.categoryLabel || event.category,
      message: event.message,
      isRootCulprit: correlation.initiatingEvent?.id === event.id
    }));

  return {
    id: incidentId,
    title: aiSynthesis.title,
    severity: severity.level,
    severityDetails: {
      score: severity.score,
      color: severity.color,
      targetSlaMinutes: severity.targetSlaMinutes,
      scoreBreakdown: severity.scoreBreakdown
    },
    status: "DETECTED",
    createdAt: new Date().toISOString(),
    primaryCategory: classification.primaryCategory,
    primaryCategoryLabel: classification.patterns[0]?.categoryLabel || classification.primaryCategory,
    culpritService: correlation.culpritService,
    affectedServices: correlation.affectedServices,
    executiveSummary: aiSynthesis.executiveSummary,
    rootCause: aiSynthesis.rootCauseDetailed,
    propagationAnalysis: aiSynthesis.propagationAnalysis,
    causalChain: correlation.causalChain,
    evidence: correlation.evidenceEntries,
    errorTimeline,
    remediation: {
      immediateActions: aiSynthesis.immediateActions || kbResult.immediateMitigation,
      permanentFixes: aiSynthesis.permanentFixes || kbResult.permanentFix,
      safeDryRunCommands: (kbResult.safeDryRunCommands || []).map((cmd, idx) => ({
        id: `cmd-${idx + 1}`,
        label: cmd.label,
        command: cmd.command,
        type: cmd.type,
        status: "READY" // READY, EXECUTING, SIMULATED
      }))
    },
    knowledgeBaseRunbook: {
      id: kbResult.matchedRunbook.id,
      title: kbResult.matchedRunbook.title,
      category: kbResult.matchedRunbook.category,
      confidence: kbResult.confidence,
      symptoms: kbResult.matchedRunbook.symptoms
    },
    stats: {
      totalLogsParsed: parsedResult.stats.total,
      errorCount: classification.totalErrors,
      warningCount: classification.totalWarnings,
      servicesCount: parsedResult.stats.services.length
    },
    agentMetadata: {
      engineMode: aiSynthesis.engineMode,
      isAiGenerated: aiSynthesis.isAiGenerated,
      apiNotice: aiSynthesis.apiNotice || null,
      confidenceScore: aiSynthesis.agentConfidence || 95,
      pipelineExecutionTimeMs: executionTiming.totalMs,
      pipelineStages: executionTiming.stages
    }
  };
}
