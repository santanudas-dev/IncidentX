/**
 * Agent Step 2: Error Classifier
 * Detects ERROR and WARNING events, classifies them into technical domains,
 * extracts error signatures, and aggregates frequency patterns.
 */

const CATEGORY_RULES = [
  {
    category: "DATABASE_ERROR",
    label: "Database & Storage",
    patterns: [
      /connection pool/i,
      /remaining connection slots/i,
      /postgres|mysql|sqlite|mongo|oracle|rds/i,
      /deadlock detected/i,
      /query timeout|slow query/i,
      /foreign key constraint/i,
      /failed to complete transaction/i,
      /ConnectionAcquisitionException/i,
      /duplicate key/i
    ]
  },
  {
    category: "RESOURCE_EXHAUSTION",
    label: "Memory & Resource Exhaustion",
    patterns: [
      /out of memory/i,
      /oomkilled/i,
      /exit code 137/i,
      /heap out of memory/i,
      /memory allocation failed/i,
      /cgroup.*exceeds/i,
      /disk space|no space left on device/i
    ]
  },
  {
    category: "CPU_OVERLOAD",
    label: "CPU & Thread Starvation",
    patterns: [
      /cpu usage exceeds/i,
      /high cpu load/i,
      /event loop lag/i,
      /thread starvation/i,
      /heavy compute task blocked thread/i,
      /load average/i
    ]
  },
  {
    category: "AUTH_SECURITY",
    label: "Authentication & Authorization",
    patterns: [
      /401 unauthorized/i,
      /invalid token/i,
      /token expired/i,
      /jwt signature/i,
      /session store/i,
      /redis.*oom command not allowed/i,
      /permission denied/i,
      /forbidden.*403/i
    ]
  },
  {
    category: "NETWORK_ERROR",
    label: "Network & DNS Resolution",
    patterns: [
      /lookup.*no such host/i,
      /getaddrinfo.*eai_again/i,
      /connection refused/i,
      /network is unreachable/i,
      /no route to host/i,
      /connection reset by peer/i,
      /read udp.*i\/o timeout/i
    ]
  },
  {
    category: "API_TIMEOUT",
    label: "API Gateway & Microservice Timeout",
    patterns: [
      /gateway timeout/i,
      /504 gateway timeout/i,
      /503 service unavailable/i,
      /502 bad gateway/i,
      /upstream.*timed out/i,
      /request timed out/i,
      /circuit breaker tripping/i,
      /deadline exceeded/i
    ]
  }
];

export function classifyErrors(parsedLogResult) {
  const { entries } = parsedLogResult;
  const errorEvents = [];
  const warningEvents = [];
  const categoryCounts = {};
  const serviceErrorCounts = {};
  const signatureMap = new Map();

  entries.forEach((entry) => {
    const isError = entry.level === "ERROR" || entry.level === "CRITICAL";
    const isWarn = entry.level === "WARNING";

    if (!isError && !isWarn) return;

    // Detect category
    let matchedCategory = "APPLICATION_BUG";
    let matchedLabel = "Application Error";

    for (const rule of CATEGORY_RULES) {
      if (rule.patterns.some((p) => p.test(entry.message) || p.test(entry.raw))) {
        matchedCategory = rule.category;
        matchedLabel = rule.label;
        break;
      }
    }

    // Generate error signature (strips IDs, UUIDs, numbers, IP addresses)
    const signature = extractSignature(entry.message);

    const enrichedEvent = {
      ...entry,
      category: matchedCategory,
      categoryLabel: matchedLabel,
      signature
    };

    if (isError) {
      errorEvents.push(enrichedEvent);
    } else {
      warningEvents.push(enrichedEvent);
    }

    // Aggregate category counts
    categoryCounts[matchedCategory] = (categoryCounts[matchedCategory] || 0) + 1;

    // Aggregate service error counts
    if (isError) {
      serviceErrorCounts[entry.service] = (serviceErrorCounts[entry.service] || 0) + 1;
    }

    // Aggregate signature patterns
    if (!signatureMap.has(signature)) {
      signatureMap.set(signature, {
        signature,
        category: matchedCategory,
        categoryLabel: matchedLabel,
        count: 0,
        services: new Set(),
        firstSeen: entry.timestamp,
        lastSeen: entry.timestamp,
        sample: entry.message,
        sampleEntries: []
      });
    }

    const sigData = signatureMap.get(signature);
    sigData.count++;
    sigData.services.add(entry.service);
    sigData.lastSeen = entry.timestamp;
    if (sigData.sampleEntries.length < 3) {
      sigData.sampleEntries.push(entry);
    }
  });

  // Convert signatures map to sorted array
  const patterns = Array.from(signatureMap.values())
    .map((s) => ({
      ...s,
      services: Array.from(s.services)
    }))
    .sort((a, b) => b.count - a.count);

  return {
    errorEvents,
    warningEvents,
    totalErrors: errorEvents.length,
    totalWarnings: warningEvents.length,
    categoryCounts,
    serviceErrorCounts,
    patterns,
    primaryCategory: getTopCategory(categoryCounts)
  };
}

function extractSignature(message) {
  return message
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "<UUID>")
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, "<IP>")
    .replace(/#\w+[-_]?\d+/g, "<ID>")
    .replace(/user_id=[a-zA-Z0-9_-]+/g, "user_id=<USER>")
    .replace(/pid=\d+|process \d+/gi, "pid=<PID>")
    .replace(/after \d+ms/gi, "after <DURATION>ms")
    .replace(/\b\d+\b/g, "<NUM>")
    .replace(/\s+/g, " ")
    .trim();
}

function getTopCategory(counts) {
  const entries = Object.entries(counts);
  if (entries.length === 0) return "UNKNOWN";
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}
