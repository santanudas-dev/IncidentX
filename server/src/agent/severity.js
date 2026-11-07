/**
 * Agent Step 4: Severity Engine
 * Assesses incident severity (LOW, MEDIUM, HIGH, CRITICAL)
 * based on service criticality, error frequency, cascading breadth, and user impact.
 */

const CRITICAL_SERVICE_KEYWORDS = [
  "gateway",
  "auth",
  "payment",
  "checkout",
  "database",
  "postgres",
  "mysql",
  "redis",
  "billing",
  "core"
];

export function assessSeverity(parsedResult, classification, correlation) {
  const { totalErrors, totalWarnings, categoryCounts } = classification;
  const { affectedServices, initiatingEvent } = correlation;

  let score = 0;
  const scoreBreakdown = [];

  // 1. Cascading breadth (number of distinct impacted services)
  const serviceCount = affectedServices.length;
  if (serviceCount >= 4) {
    score += 35;
    scoreBreakdown.push({
      factor: "Widespread Cascade",
      points: 35,
      detail: `${serviceCount} distinct microservices reporting active errors`
    });
  } else if (serviceCount >= 2) {
    score += 20;
    scoreBreakdown.push({
      factor: "Multi-Service Impact",
      points: 20,
      detail: `${serviceCount} services affected`
    });
  } else if (serviceCount === 1) {
    score += 10;
    scoreBreakdown.push({
      factor: "Isolated Service",
      points: 10,
      detail: "1 service affected"
    });
  }

  // 2. Critical Service involvement
  const criticalServicesHit = affectedServices.filter((s) =>
    CRITICAL_SERVICE_KEYWORDS.some((kw) => s.service.includes(kw))
  );

  if (criticalServicesHit.length >= 2) {
    score += 30;
    scoreBreakdown.push({
      factor: "Core Infrastructure Impact",
      points: 30,
      detail: `Multiple core services affected: ${criticalServicesHit.map((s) => s.service).join(", ")}`
    });
  } else if (criticalServicesHit.length === 1) {
    score += 20;
    scoreBreakdown.push({
      factor: "Core Dependency Affected",
      points: 20,
      detail: `Critical service affected: ${criticalServicesHit[0].service}`
    });
  }

  // 3. High impact error types
  let hasInfraFailure = false;
  const msgToCheck = (initiatingEvent?.message || "") + " " + (initiatingEvent?.raw || "");

  if (
    /oomkilled|out of memory|exit code 137/i.test(msgToCheck) ||
    categoryCounts["RESOURCE_EXHAUSTION"] > 0
  ) {
    score += 25;
    hasInfraFailure = true;
    scoreBreakdown.push({
      factor: "Fatal Memory / OOM Kill",
      points: 25,
      detail: "Kernel OOM killer terminated process"
    });
  } else if (
    /connection slots are reserved|pool exhausted|too many connections/i.test(msgToCheck) ||
    categoryCounts["DATABASE_ERROR"] > 0
  ) {
    score += 25;
    hasInfraFailure = true;
    scoreBreakdown.push({
      factor: "Database Saturation / Outage",
      points: 25,
      detail: "Database connection pool exhausted"
    });
  } else if (/401 unauthorized wave|session store/i.test(msgToCheck) || categoryCounts["AUTH_SECURITY"] > 0) {
    score += 25;
    hasInfraFailure = true;
    scoreBreakdown.push({
      factor: "Authentication Outage",
      points: 25,
      detail: "Widespread authentication / session failures"
    });
  }

  // 4. Volume / Frequency Impact
  if (totalErrors >= 10) {
    score += 15;
    scoreBreakdown.push({
      factor: "High Error Frequency",
      points: 15,
      detail: `${totalErrors} error events logged`
    });
  } else if (totalErrors >= 3) {
    score += 10;
    scoreBreakdown.push({
      factor: "Sustained Error Count",
      points: 10,
      detail: `${totalErrors} error events logged`
    });
  }

  // Determine Level
  let level = "LOW";
  let color = "emerald";
  let slaMinutes = 240;

  if (score >= 75) {
    level = "CRITICAL";
    color = "red";
    slaMinutes = 15;
  } else if (score >= 50) {
    level = "HIGH";
    color = "amber";
    slaMinutes = 30;
  } else if (score >= 25) {
    level = "MEDIUM";
    color = "yellow";
    slaMinutes = 60;
  }

  return {
    level,
    score: Math.min(score, 100),
    color,
    targetSlaMinutes: slaMinutes,
    scoreBreakdown,
    summary: `${level} severity assessed (score: ${score}/100) due to ${
      criticalServicesHit.length > 0 ? "critical services disruption" : "service errors"
    } across ${serviceCount} service(s).`
  };
}
