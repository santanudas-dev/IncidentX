/**
 * Realistic Sample Scenarios for IncidentX
 * Provides diverse log formats (TXT, JSON, CSV) representing real production incidents.
 */

export const SAMPLE_SCENARIOS = [
  {
    id: "scenario-db-pool-exhaustion",
    name: "E-Commerce Checkout Failure (PostgreSQL Pool Exhaustion)",
    description: "Database connection pool exhaustion on postgres-primary leading to 503 service unavailable on checkout-service and cascading timeouts on api-gateway.",
    format: "txt",
    category: "Database & Microservices",
    severityExpected: "CRITICAL",
    logs: `2026-11-07 09:14:02.102 [INFO] api-gateway: Incoming POST /api/v2/checkout/process from ip=198.51.100.44
2026-11-07 09:14:03.450 [INFO] checkout-service: Processing order #ord-99214 for user_id=usr_88312
2026-11-07 09:14:05.120 [WARN] postgres-primary: Connection pool utilization reached 92% (46/50 connections active)
2026-11-07 09:14:08.831 [WARN] postgres-primary: Slow query detected (duration: 3712ms) - SELECT * FROM inventory_locks WHERE product_id = ANY($1) FOR UPDATE
2026-11-07 09:14:12.301 [ERROR] postgres-primary: FATAL: remaining connection slots are reserved for non-replication superuser connections (max_connections=50 reached)
2026-11-07 09:14:12.912 [ERROR] checkout-service: ConnectionAcquisitionException: Timeout acquiring connection from pool after 10000ms. Active: 50, Idle: 0, Pending: 87
2026-11-07 09:14:13.104 [ERROR] checkout-service: Failed to complete transaction for order #ord-99214: could not execute query against database pool
2026-11-07 09:14:13.450 [ERROR] api-gateway: Upstream service checkout-service returned HTTP 503 Service Unavailable for request id=req-55829a
2026-11-07 09:14:14.020 [ERROR] order-notification-service: Aborting email trigger for order #ord-99214: order record missing in database
2026-11-07 09:14:16.890 [ERROR] checkout-service: Connection pool exhausted. Circuit breaker tripping to OPEN state for db-cluster-primary
2026-11-07 09:14:18.210 [ERROR] api-gateway: 503 Service Unavailable spike detected: 142 requests failed in the last 10 seconds on /api/v2/checkout/*`
  },
  {
    id: "scenario-k8s-oom-kill",
    name: "Kubernetes Payment Service OOMKilled & CrashLoop",
    description: "Payment processing pod runs out of container memory during batch settlement, triggering Linux kernel OOM killer and pod restarts.",
    format: "json",
    category: "Memory & Container Orchestration",
    severityExpected: "HIGH",
    logs: JSON.stringify(
      [
        {
          timestamp: "2026-11-07T09:20:00Z",
          level: "INFO",
          service: "payment-batch-processor",
          message: "Starting daily merchant settlement batch job #batch-7718 with 45,000 records"
        },
        {
          timestamp: "2026-11-07T09:21:15Z",
          level: "WARN",
          service: "payment-batch-processor",
          message: "Memory utilization warning: Heap usage at 84% (1.68GB / 2.0GB limit)"
        },
        {
          timestamp: "2026-11-07T09:21:45Z",
          level: "WARN",
          service: "k8s-kubelet-node-4",
          message: "cgroup memory usage in pod payment-batch-processor-78d9c exceeds 95% threshold"
        },
        {
          timestamp: "2026-11-07T09:22:02Z",
          level: "ERROR",
          service: "kernel",
          message: "Out of memory: Kill process 38192 (node) score 982 or sacrifice child. OOMKilled container payment-batch-processor"
        },
        {
          timestamp: "2026-11-07T09:22:04Z",
          level: "ERROR",
          service: "k8s-kubelet-node-4",
          message: "Container payment-batch-processor in pod payment-batch-processor-78d9c failed with exit code 137"
        },
        {
          timestamp: "2026-11-07T09:22:15Z",
          level: "ERROR",
          service: "payment-gateway",
          message: "Payment batch processor unreachable: dial tcp 10.244.3.44:8080: connect: connection refused"
        },
        {
          timestamp: "2026-11-07T09:22:45Z",
          level: "WARN",
          service: "k8s-pod-controller",
          message: "Pod payment-batch-processor-78d9c entered CrashLoopBackOff: back-off 40s restarting failed container"
        },
        {
          timestamp: "2026-11-07T09:23:10Z",
          level: "ERROR",
          service: "merchant-dashboard-api",
          message: "Failed to fetch settlement status: upstream payment-batch-processor timed out after 30000ms"
        }
      ],
      null,
      2
    )
  },
  {
    id: "scenario-auth-redis-failure",
    name: "Global Auth Blackout (Redis Session Store OOM & Token Failures)",
    description: "Redis session cache fills up memory, rejecting write commands and causing auth-service to fail token validation with 401s across the platform.",
    format: "txt",
    category: "Authentication & Cache",
    severityExpected: "CRITICAL",
    logs: `2026-11-07 09:30:00.012 [INFO] auth-service: Starting JWT verification for user token bearer-eyJhbGciOi...
2026-11-07 09:30:04.180 [WARN] redis-session-cache: Memory usage 98.4% (maxmemory: 8192mb reached). Eviction policy volatile-lru active.
2026-11-07 09:30:05.421 [ERROR] redis-session-cache: OOM command not allowed when used memory > 'maxmemory'. Failed write command SET session:usr_99812
2026-11-07 09:30:05.932 [ERROR] auth-service: Failed to persist session metadata: Redis connection error OOM command not allowed
2026-11-07 09:30:06.120 [ERROR] auth-service: Session store unreachable or rejecting commands. Falling back to strict rejection.
2026-11-07 09:30:06.780 [ERROR] customer-api: 401 Unauthorized wave detected - 310 requests rejected in 5s: signature verification failed or session expired
2026-11-07 09:30:07.110 [ERROR] billing-service: Rejecting payment capture: Auth token verification failed with 401 Unauthorized
2026-11-07 09:30:08.540 [ERROR] inventory-service: Rejecting stock check: Auth token verification failed with 401 Unauthorized
2026-11-07 09:30:10.200 [ERROR] api-gateway: User session validation failure rate exceeds 95% on edge router`
  },
  {
    id: "scenario-dns-network-partition",
    name: "Internal DNS Resolution Failure (CoreDNS Timeout)",
    description: "CoreDNS UDP connection queue drops queries, causing inter-service communication to fail with EAI_AGAIN across internal service discovery.",
    format: "txt",
    category: "Networking & DNS",
    severityExpected: "HIGH",
    logs: `2026-11-07 09:40:01.000 [INFO] order-service: Initiating call to inventory-service.default.svc.cluster.local:443
2026-11-07 09:40:06.012 [WARN] order-service: DNS query to CoreDNS 10.96.0.10:53 took longer than 5000ms
2026-11-07 09:40:06.050 [ERROR] order-service: getaddrinfo EAI_AGAIN inventory-service.default.svc.cluster.local: lookup failed
2026-11-07 09:40:07.120 [ERROR] order-service: dial tcp: lookup inventory-service.default.svc.cluster.local: no such host
2026-11-07 09:40:08.450 [ERROR] coredns-pod-1: [ERROR] plugin/errors: 2 inventory-service.default.svc.cluster.local. A: read udp 10.244.0.5:41822->10.96.0.10:53: i/o timeout
2026-11-07 09:40:09.112 [ERROR] shipping-service: Failed to connect to warehouse-service.default.svc.cluster.local: Network is unreachable (DNS resolution failed)
2026-11-07 09:40:11.890 [ERROR] api-gateway: Downstream dispatch failed: multiple internal hostnames unresolvable`
  },
  {
    id: "scenario-cpu-eventloop-lag",
    name: "High CPU Overload & Event Loop Lag (Search ReDoS)",
    description: "Catastrophic regex backtracking in catalog search causes 99% CPU utilization, locking the Node.js event loop and starving API traffic.",
    format: "csv",
    category: "Compute & Performance",
    severityExpected: "MEDIUM",
    logs: `timestamp,level,service,message
2026-11-07 09:50:01.100,INFO,search-service,"Incoming regex query: /^(a+)+$/ with input len 450"
2026-11-07 09:50:02.300,WARN,search-service,"CPU usage exceeds 98.6% on worker thread 3"
2026-11-07 09:50:04.500,WARN,search-service,"Event loop lag reached 12450ms (threshold: 200ms)"
2026-11-07 09:50:07.200,ERROR,search-service,"Thread starvation: heavy compute task blocked thread for 6100ms"
2026-11-07 09:50:08.800,ERROR,api-gateway,"Gateway Timeout: Request timed out after 10000ms for /api/search"
2026-11-07 09:50:11.200,ERROR,health-monitor,"Health probe failed for search-service-pod-2: HTTP 504 Gateway Timeout"`
  }
];
