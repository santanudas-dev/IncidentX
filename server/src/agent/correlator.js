/**
 * Agent Step 3: Correlation Engine & Root Cause Analysis
 * Analyzes temporal proximity, causal dependency trees across services,
 * isolates the root initiator event, and connects cascading downstream errors.
 */

export function correlateErrors(parsedResult, classification) {
  const { entries } = parsedResult;
  const { errorEvents, warningEvents, patterns } = classification;

  if (errorEvents.length === 0 && warningEvents.length === 0) {
    return {
      rootCauseSummary: "No errors or anomalies detected across the provided log stream.",
      culpritService: "None",
      initiatingEvent: null,
      causalChain: [],
      evidenceEntries: [],
      affectedServices: [],
      temporalWindow: { start: null, end: null, durationSeconds: 0 }
    };
  }

  // Combine errors & relevant warnings sorted chronologically by line number / timestamp
  const relevantEvents = [...warningEvents, ...errorEvents].sort((a, b) => a.lineNumber - b.lineNumber);

  const firstEvent = relevantEvents[0];
  const lastEvent = relevantEvents[relevantEvents.length - 1];

  // Service impact analysis
  const serviceImpactMap = {};
  errorEvents.forEach((ev) => {
    if (!serviceImpactMap[ev.service]) {
      serviceImpactMap[ev.service] = {
        service: ev.service,
        errorCount: 0,
        firstErrorLine: ev.lineNumber,
        firstErrorTimestamp: ev.timestamp,
        categories: new Set()
      };
    }
    serviceImpactMap[ev.service].errorCount++;
    serviceImpactMap[ev.service].categories.add(ev.categoryLabel);
  });

  const affectedServices = Object.values(serviceImpactMap)
    .map((s) => ({
      ...s,
      categories: Array.from(s.categories)
    }))
    .sort((a, b) => a.firstErrorLine - b.firstErrorLine);

  // Identify root cause initiator
  // Priority: Look for infrastructure root triggers first (DB/OOM/Redis/DNS), then chronological first error
  let initiatingEvent = null;

  // Check for infrastructure/originator events
  const infraPriorities = [
    /out of memory|oomkilled/i,
    /remaining connection slots|connection pool exhausted|too many connections/i,
    /oom command not allowed|session store/i,
    /read udp.*i\/o timeout|lookup.*no such host|eai_again/i,
    /cpu usage exceeds.*9\d%/i
  ];

  for (const regex of infraPriorities) {
    const match = relevantEvents.find((e) => regex.test(e.message) || regex.test(e.raw));
    if (match) {
      initiatingEvent = match;
      break;
    }
  }

  if (!initiatingEvent) {
    // If no explicit infra pattern, pick the earliest ERROR event
    initiatingEvent = errorEvents[0] || warningEvents[0];
  }

  const culpritService = initiatingEvent ? initiatingEvent.service : "unknown";

  // Build causal chain of events
  const causalChain = [];
  const visitedServices = new Set();

  // 1. Root Trigger
  if (initiatingEvent) {
    causalChain.push({
      step: 1,
      role: "ROOT_TRIGGER",
      service: initiatingEvent.service,
      timestamp: initiatingEvent.timestamp,
      lineNumber: initiatingEvent.lineNumber,
      description: `Originating failure detected in [${initiatingEvent.service}]: "${truncate(initiatingEvent.message, 120)}"`,
      evidenceLogId: initiatingEvent.id
    });
    visitedServices.add(initiatingEvent.service);
  }

  // 2. Intermediate Cascades
  let stepIndex = 2;
  errorEvents.forEach((ev) => {
    if (ev.id !== initiatingEvent?.id && !visitedServices.has(ev.service)) {
      causalChain.push({
        step: stepIndex++,
        role: "CASCADING_IMPACT",
        service: ev.service,
        timestamp: ev.timestamp,
        lineNumber: ev.lineNumber,
        description: `Downstream impact on [${ev.service}]: "${truncate(ev.message, 120)}"`,
        evidenceLogId: ev.id
      });
      visitedServices.add(ev.service);
    }
  });

  // Collect strictly verified evidence log entries (no fabricated logs)
  const evidenceEntries = collectStrictEvidence(relevantEvents, initiatingEvent);

  // Synthesize root cause narrative
  const rootCauseSummary = generateDeterministicRootCause(initiatingEvent, affectedServices, classification);

  return {
    rootCauseSummary,
    culpritService,
    initiatingEvent,
    causalChain,
    evidenceEntries,
    affectedServices,
    temporalWindow: {
      start: firstEvent?.timestamp || null,
      end: lastEvent?.timestamp || null,
      totalEvents: relevantEvents.length
    }
  };
}

function collectStrictEvidence(relevantEvents, initiatingEvent) {
  const evidence = [];
  const seenIds = new Set();

  // Always include the initiating event
  if (initiatingEvent) {
    evidence.push({
      id: initiatingEvent.id,
      lineNumber: initiatingEvent.lineNumber,
      timestamp: initiatingEvent.timestamp,
      level: initiatingEvent.level,
      service: initiatingEvent.service,
      message: initiatingEvent.message,
      role: "Originating Fault"
    });
    seenIds.add(initiatingEvent.id);
  }

  // Include top distinct service failures as evidence
  relevantEvents.forEach((ev) => {
    if (!seenIds.has(ev.id) && (ev.level === "ERROR" || ev.level === "CRITICAL")) {
      evidence.push({
        id: ev.id,
        lineNumber: ev.lineNumber,
        timestamp: ev.timestamp,
        level: ev.level,
        service: ev.service,
        message: ev.message,
        role: "Correlated Impact"
      });
      seenIds.add(ev.id);
    }
  });

  // Limit to max 10 key evidence lines to prevent clutter
  return evidence.slice(0, 10);
}

function generateDeterministicRootCause(initiatingEvent, affectedServices, classification) {
  if (!initiatingEvent) {
    return "Insufficient error markers to isolate single root cause.";
  }

  const serviceNames = affectedServices.map((s) => s.service).join(", ");
  const cat = initiatingEvent.categoryLabel || "System";

  return `Incident triggered by ${cat} failure in [${initiatingEvent.service}]. The initial fault "${initiatingEvent.message}" propagated cascading failures across downstream dependencies (${serviceNames}), leading to service degradation and client request rejections.`;
}

function truncate(str, maxLen) {
  if (!str) return "";
  return str.length > maxLen ? str.slice(0, maxLen - 3) + "..." : str;
}
