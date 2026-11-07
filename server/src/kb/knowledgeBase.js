/**
 * IncidentX Local Knowledge Base
 * Catalog of common IT incidents, signatures, root causes, and runbook remediation steps.
 */

export const KNOWLEDGE_BASE = [
  {
    id: "KB-DB-001",
    category: "Database connection failures",
    title: "PostgreSQL / MySQL Connection Pool Exhaustion",
    patterns: [
      /connection pool (exhausted|full|drained|timeout)/i,
      /remaining connection slots are reserved/i,
      /too many connections/i,
      /timeout acquiring connection/i,
      /connection reset by peer.*(?:5432|3306|db|postgres|mysql)/i,
      /can't connect to (?:postgres|mysql|db)/i
    ],
    symptoms: [
      "Microservices fail with 500 or 503 HTTP status",
      "Spike in latency for all DB-dependent API endpoints",
      "Database server max_connections reached",
      "Worker threads waiting indefinitely on connection checkout"
    ],
    rootCauseAnalysis:
      "A surge in concurrent transactions or slow un-indexed queries held connection slots open longer than the pool checkout timeout (typically 30s), causing incoming requests to queue until the connection pool was fully saturated and rejected new checkouts.",
    immediateMitigation: [
      "Temporarily increase connection pool maximum size (e.g. max_connections or pool max: 50 -> 100).",
      "Restart or scale up connection pooling proxy (PgBouncer / AWS RDS Proxy / ProxySQL).",
      "Identify and terminate long-running queries via `pg_terminate_backend` or `KILL QUERY`.",
      "Enable circuit breaker on client applications to stop connection retry storm."
    ],
    permanentFix: [
      "Implement connection pooling middleware (PgBouncer in transaction mode).",
      "Add statement timeouts (`statement_timeout = '15s'`) to abort runaway queries.",
      "Optimize slow database queries and add missing indices on frequently filtered columns.",
      "Tune application connection pool size based on CPU core count (formula: connections = ((core_count * 2) + effective_spindle_count))."
    ],
    safeDryRunCommands: [
      {
        label: "Check active database connections & states",
        command: "SELECT count(*), state FROM pg_stat_activity GROUP BY state;",
        type: "READ_ONLY_QUERY"
      },
      {
        label: "Inspect top 5 longest running active queries",
        command: "SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state FROM pg_stat_activity WHERE state != 'idle' ORDER BY duration DESC LIMIT 5;",
        type: "READ_ONLY_QUERY"
      },
      {
        label: "Verify PgBouncer pool stats",
        command: "SHOW POOLS; SHOW CLIENTS;",
        type: "DIAGNOSTIC"
      }
    ]
  },
  {
    id: "KB-NET-002",
    category: "API timeouts",
    title: "Cascading Microservice Latency & Gateway Gateway Timeout (504)",
    patterns: [
      /upstream (request timeout|connect error|timed out)/i,
      /HTTP (?:504|502|503)/i,
      /Gateway Timeout/i,
      /Request timed out after \d+ms/i,
      /deadline exceeded/i,
      /Client\.Timeout exceeded while awaiting headers/i
    ],
    symptoms: [
      "Edge API gateway returns HTTP 504 Gateway Timeout to external clients",
      "Thread pool exhaustion in upstream services waiting on slow downstream responses",
      "Queue backpressure and high memory consumption in intermediate proxies"
    ],
    rootCauseAnalysis:
      "A downstream dependency experienced severe latency degradation. Upstream services without aggressive timeouts or circuit breakers blocked worker threads awaiting responses, propagating thread exhaustion backwards to the API Gateway.",
    immediateMitigation: [
      "Activate circuit breaker on the API Gateway to fast-fail traffic to degraded downstream service.",
      "Increase gateway read timeout temporarily if downstream is making slow progress, or divert traffic to secondary region.",
      "Scale up replicas of the bottleneck downstream microservice.",
      "Enable degraded mode or return cached fallback data for non-critical payloads."
    ],
    permanentFix: [
      "Configure strict timeouts across all HTTP/gRPC clients (e.g. connect: 1s, read: 3s).",
      "Implement Resilience4j / Polly / Envoy circuit breakers with automatic half-open health checks.",
      "Introduce asynchronous event-driven messaging (Kafka/RabbitMQ) for non-blocking operations.",
      "Establish distributed tracing (OpenTelemetry/Jaeger) with latency alerts per hop."
    ],
    safeDryRunCommands: [
      {
        label: "Test downstream service latency & response headers",
        command: "curl -w '@curl-format.txt' -o /dev/null -s -m 5 https://internal-service/health",
        type: "DIAGNOSTIC"
      },
      {
        label: "Inspect Envoy / NGINX upstream status and response times",
        command: "curl -s http://localhost:15000/stats/prometheus | grep upstream_rq_time",
        type: "METRIC_CHECK"
      }
    ]
  },
  {
    id: "KB-RES-003",
    category: "Memory exhaustion",
    title: "Container / JVM Heap Out-Of-Memory (OOMKilled) & Memory Leak",
    patterns: [
      /java\.lang\.OutOfMemoryError/i,
      /OOMKilled/i,
      /kernel: Out of memory: Kill process/i,
      /JavaScript heap out of memory/i,
      /Memory allocation failed/i,
      /exit code 137/i,
      /cgroup out of memory/i
    ],
    symptoms: [
      "Container terminated abruptly with exit code 137",
      "Kubernetes pod restarts in `CrashLoopBackOff`",
      "Sawtooth memory consumption pattern reaching 99-100% cgroup limit",
      "Prolonged Full GC pauses causing health check timeouts"
    ],
    rootCauseAnalysis:
      "Unbounded object caching, unclosed streams/connections, or large batch payload processing without pagination exceeded the container cgroup memory quota, prompting Linux kernel OOM Killer to SIGKILL the process.",
    immediateMitigation: [
      "Roll back any recent deployment containing memory-intensive batch jobs or leaks.",
      "Temporarily increase container memory limit in deployment spec (`resources.limits.memory`).",
      "Scale horizontal replicas (`kubectl scale deployment <name> --replicas=N`) to distribute load.",
      "Force pod restart to clear accumulated heap memory temporarily while diagnosing."
    ],
    permanentFix: [
      "Capture and analyze heap dump (e.g. Eclipse MAT, jhat, Chrome DevTools memory snapshot).",
      "Enforce chunked streaming and pagination (`LIMIT / OFFSET` or cursor) for large dataset export/import.",
      "Set proper JVM Ergonomics: `-XX:MaxRAMPercentage=75.0` to prevent JVM exceeding container cgroup.",
      "Introduce WeakReference / Guava cache with TTL expiration and bounded maximum size."
    ],
    safeDryRunCommands: [
      {
        label: "Check pod termination reason & memory metrics",
        command: "kubectl describe pod <pod-name> | grep -E '(Last State|OOMKilled|Exit Code)'",
        type: "INSPECTION"
      },
      {
        label: "Inspect top container memory consumers in cluster",
        command: "kubectl top pods --sort-by=memory -A",
        type: "METRIC_CHECK"
      }
    ]
  },
  {
    id: "KB-CPU-004",
    category: "CPU overload",
    title: "CPU Throttling, High Utilization & Event Loop / Thread Starvation",
    patterns: [
      /CPU usage exceeds 9[0-9]%/i,
      /high cpu load/i,
      /CPU throttling/i,
      /event loop lag/i,
      /thread starvation/i,
      /load average: [1-9][0-9]+/i,
      /heavy compute task blocked thread/i
    ],
    symptoms: [
      "Response time degradation from <50ms to >10,000ms",
      "Container CPU throttling metric (`container_cpu_cfs_throttled_seconds_total`) climbing",
      "Node load average exceeds physical CPU core count",
      "Asynchronous tasks timing out"
    ],
    rootCauseAnalysis:
      "Inefficient regular expression catastrophic backtracking, unindexed JSON filtering, cryptographic overhead, or runaway infinite recursion consumed 100% CPU, starving I/O event loops and worker pools.",
    immediateMitigation: [
      "Horizontally auto-scale deployment pods (HPA) to shed load across more CPU cores.",
      "Rate limit or throttle heavy compute endpoints at the API gateway layer.",
      "Offload CPU-intensive background tasks to worker queues (Celery / BullMQ / AWS SQS).",
      "Temporarily increase CPU limits or assign dedicated CPU cores."
    ],
    permanentFix: [
      "Profile CPU execution flamegraph using Node.js `--prof`, Go `pprof`, or async-profiler for Java.",
      "Replace blocking sync operations with async worker threads or worker pools.",
      "Audit regex patterns for polynomial / exponential time complexity (ReDoS prevention).",
      "Cache heavy computation results using Redis with deterministic key hashing."
    ],
    safeDryRunCommands: [
      {
        label: "Check container CPU throttling metrics",
        command: "kubectl get --raw /apis/metrics.k8s.io/v1beta1/pods | jq '.items[].containers[] | {name, cpu: .usage.cpu}'",
        type: "METRIC_CHECK"
      },
      {
        label: "Generate 10s CPU profile without stopping process",
        command: "curl -s http://localhost:8080/debug/pprof/profile?seconds=10 > cpu.pprof",
        type: "PROFILING"
      }
    ]
  },
  {
    id: "KB-AUTH-005",
    category: "Authentication failures",
    title: "Authentication Token Spike, JWKS Fetch Failure & Redis Session Store Outage",
    patterns: [
      /invalid token|token expired|signature verification failed/i,
      /failed to fetch (?:jwks|openid-configuration)/i,
      /redis (?:connection refused|WRONGPASS|NOAUTH|OOM command not allowed)/i,
      /session store unreachable/i,
      /401 Unauthorized wave/i,
      /JWT signature is invalid/i,
      /OAuth2 token introspection failed/i
    ],
    symptoms: [
      "Surge of HTTP 401 Unauthorized errors across all downstream microservices",
      "Users logged out en masse; login requests failing",
      "Session cache / Redis cluster latency spike or unreachable",
      "IdP (Identity Provider) rate limiting or DNS failure"
    ],
    rootCauseAnalysis:
      "Either Redis session store crashed/ran out of memory, or Auth service was unable to reach the Identity Provider's JWKS endpoint (due to expired cert, key rotation without grace period, or Redis connectivity failure), invalidating all token verifications simultaneously.",
    immediateMitigation: [
      "Verify Redis session cache health; failover to read-replica if primary is unresponsive.",
      "Check IdP status page and verify network route to JWKS endpoint.",
      "If JWKS key rotated unexpectedly, purge cached public keys and trigger immediate JWKS refresh.",
      "Enable emergency session bypass or relaxed token grace period if permissible under security policy."
    ],
    permanentFix: [
      "Implement local in-memory fallback cache for JWKS public keys with 24h fallback window.",
      "Configure Redis with `maxmemory-policy allkeys-lru` and automated Redis Sentinel / Cluster failover.",
      "Set up synthetic heartbeat probes monitoring IdP token endpoint availability.",
      "Implement dual-key overlapping rotation protocol for JWT signing keys."
    ],
    safeDryRunCommands: [
      {
        label: "Ping Redis session store and check memory usage",
        command: "redis-cli -h redis-cluster info memory",
        type: "HEALTH_CHECK"
      },
      {
        label: "Verify JWKS endpoint reachability and certificate validity",
        command: "curl -v --connect-timeout 3 https://auth.company.internal/.well-known/jwks.json",
        type: "NETWORK_CHECK"
      }
    ]
  },
  {
    id: "KB-NET-006",
    category: "Network connectivity issues",
    title: "DNS Resolution Timeout, Packet Loss & VPC Security Group / Firewall Partition",
    patterns: [
      /lookup .*: no such host/i,
      /EAI_AGAIN/i,
      /Name or service not known/i,
      /connection refused.*port \d+/i,
      /Network is unreachable/i,
      /no route to host/i,
      /i\/o timeout.*dial tcp/i
    ],
    symptoms: [
      "Services fail to resolve internal service discovery names (e.g. `order-service.default.svc.cluster.local`)",
      "Intermittent 5-second delays on TCP handshakes (DNS lookup retry timeout)",
      "CoreDNS pods running at high CPU or returning SERVFAIL",
      "Cross-VPC / cross-subnet traffic dropping without TCP RST"
    ],
    rootCauseAnalysis:
      "CoreDNS / systemd-resolved overwhelmed with single-request DNS queries due to missing ndots optimization, or cloud VPC security group rule was modified blocking egress traffic to the target port.",
    immediateMitigation: [
      "Scale CoreDNS replicas (`kubectl scale deployment coredns -n kube-system --replicas=6`).",
      "Enable NodeLocal DNSCache in Kubernetes cluster to terminate DNS queries locally on node.",
      "Verify cloud security group egress and ingress rules for the affected subnet.",
      "Flush local DNS resolver caches on affected host machines."
    ],
    permanentFix: [
      "Deploy NodeLocal DNSCache daemonset to avoid UDP connection tracking table exhaustion.",
      "Adjust `ndots:2` in pod `dnsConfig` to eliminate redundant DNS search path lookups.",
      "Manage firewall and security group rules via Terraform/GitOps with automated linting tests.",
      "Implement redundant internal DNS resolvers with health checks."
    ],
    safeDryRunCommands: [
      {
        label: "Perform DNS resolution test with detailed timing",
        command: "dig +trace +stats service-name.internal.domain",
        type: "DNS_TEST"
      },
      {
        label: "Test TCP port connectivity to downstream service",
        command: "nc -zv -w 3 target-service.internal 443",
        type: "CONNECTIVITY_CHECK"
      },
      {
        label: "Check CoreDNS metrics and error logs",
        command: "kubectl logs -n kube-system -l k8s-app=kube-dns --tail=50",
        type: "LOG_INSPECTION"
      }
    ]
  }
];
