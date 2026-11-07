/**
 * Incident Storage & State Manager
 * Maintains incident history, provides lookup, status updates,
 * and safe dry-run command simulations.
 */

let incidentStore = [];

export function saveIncident(incident) {
  // Prepend so latest incident is first
  incidentStore.unshift(incident);
  return incident;
}

export function getAllIncidents() {
  return incidentStore;
}

export function getIncidentById(id) {
  return incidentStore.find((inc) => inc.id === id) || null;
}

export function updateIncidentStatus(id, newStatus) {
  const incident = incidentStore.find((inc) => inc.id === id);
  if (!incident) return null;

  incident.status = newStatus;
  incident.updatedAt = new Date().toISOString();
  return incident;
}

export function simulateSafeRunbookCommand(commandId, commandStr) {
  // Never execute destructive commands
  // Returns safe diagnostic simulated execution log
  const lower = (commandStr || "").toLowerCase();

  let output = "";
  if (lower.includes("pg_stat_activity") || lower.includes("show pools")) {
    output = `[DIAGNOSTIC DRY-RUN OUTPUT]
Timestamp: ${new Date().toISOString()}
Target: PostgreSQL Cluster (db-cluster-primary.internal:5432)
Active Sessions: 50 / 50 (MAX_CONNECTIONS EXCEEDED)
Waiting Locks: 18 queries blocked on relation 'inventory_locks'
Longest Query PID: 28419 (duration: 00:04:12, state: 'active')
Query: SELECT * FROM inventory_locks WHERE product_id = ANY($1) FOR UPDATE;
Safe Recommendation: Kill blocking PID 28419 or scale pool max_connections to 100 via PgBouncer.`;
  } else if (lower.includes("kubectl") || lower.includes("oomkilled")) {
    output = `[DIAGNOSTIC DRY-RUN OUTPUT]
Timestamp: ${new Date().toISOString()}
Target: Kubernetes Namespace: default
Pod: payment-batch-processor-78d9c
Container: payment-batch-processor
Last State: Terminated
  Reason: OOMKilled
  Exit Code: 137
  Started: 2026-11-07T09:20:00Z
  Finished: 2026-11-07T09:22:02Z
Restart Count: 3
Safe Recommendation: Increase pod memory limit from 2Gi to 4Gi in deployment manifest.`;
  } else if (lower.includes("redis") || lower.includes("info memory")) {
    output = `[DIAGNOSTIC DRY-RUN OUTPUT]
Timestamp: ${new Date().toISOString()}
Target: Redis Cache (redis-session-cache.internal:6379)
used_memory: 8589934592 (8.00G)
used_memory_human: 8.00G
maxmemory: 8589934592 (8.00G)
maxmemory_policy: volatile-lru
mem_fragmentation_ratio: 1.04
Safe Recommendation: Failover to replica or increase maxmemory to 12G; flush non-session transient keys.`;
  } else if (lower.includes("dig") || lower.includes("coredns") || lower.includes("nc -zv")) {
    output = `[DIAGNOSTIC DRY-RUN OUTPUT]
Timestamp: ${new Date().toISOString()}
Target: CoreDNS Service (10.96.0.10:53)
Query: inventory-service.default.svc.cluster.local
;; connection timed out; no servers could be reached
CoreDNS Pod Metric: UDP queue drop count: 1,420 pkts/sec
Safe Recommendation: Scale CoreDNS replicas from 2 to 6; enable NodeLocal DNSCache.`;
  } else {
    output = `[DIAGNOSTIC DRY-RUN OUTPUT]
Timestamp: ${new Date().toISOString()}
Executed check: ${commandStr}
Status: 200 OK (Non-destructive inspection completed)
Observations: High latency detected on target subsystem; no data corruption detected.`;
  }

  return {
    commandId,
    command: commandStr,
    timestamp: new Date().toISOString(),
    status: "SIMULATED_SUCCESS",
    output
  };
}
