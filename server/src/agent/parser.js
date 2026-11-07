/**
 * Agent Step 1: Log Parser
 * Ingests raw input (TXT, JSON, CSV), handles diverse log layouts,
 * and extracts normalized structured log records.
 */

export function parseLogs(input) {
  if (!input || typeof input !== "string" || input.trim().length === 0) {
    return {
      entries: [],
      stats: { total: 0, errors: 0, warnings: 0, info: 0, services: [] },
      format: "unknown"
    };
  }

  const trimmed = input.trim();

  // 1. Check if JSON (Array or NDJSON)
  if (trimmed.startsWith("[") || (trimmed.startsWith("{") && trimmed.includes("}"))) {
    try {
      if (trimmed.startsWith("[")) {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return normalizeJsonEntries(parsed, "json-array");
        }
      }
    } catch {
      // Might be NDJSON (Newline Delimited JSON)
    }

    // Try NDJSON
    const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const ndjsonEntries = [];
    let isNdjson = true;
    for (let i = 0; i < lines.length; i++) {
      try {
        const obj = JSON.parse(lines[i]);
        ndjsonEntries.push(obj);
      } catch {
        isNdjson = false;
        break;
      }
    }
    if (isNdjson && ndjsonEntries.length > 0) {
      return normalizeJsonEntries(ndjsonEntries, "ndjson");
    }
  }

  // 2. Check if CSV
  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length > 1 && lines[0].includes(",") && (lines[0].toLowerCase().includes("level") || lines[0].toLowerCase().includes("message") || lines[0].toLowerCase().includes("service"))) {
    const csvResult = parseCsvEntries(lines);
    if (csvResult.entries.length > 0) {
      return csvResult;
    }
  }

  // 3. Fallback: Line-by-line Text Parser
  return parseTextEntries(lines);
}

function normalizeJsonEntries(jsonList, format) {
  const entries = jsonList.map((item, idx) => {
    const levelRaw = item.level || item.severity || item.loglevel || item.type || (item.message && item.message.toLowerCase().includes("error") ? "ERROR" : "INFO");
    const level = normalizeLogLevel(String(levelRaw));
    const timestamp = item.timestamp || item.time || item["@timestamp"] || item.ts || new Date().toISOString();
    const service = item.service || item.app || item.component || item.source || item.logger || "system";
    const message = item.message || item.msg || item.log || JSON.stringify(item);

    return {
      id: `log-${idx + 1}`,
      lineNumber: idx + 1,
      timestamp: String(timestamp),
      level,
      service: String(service).toLowerCase().trim(),
      message: String(message).trim(),
      raw: JSON.stringify(item)
    };
  });

  return buildParseResult(entries, format);
}

function parseCsvEntries(lines) {
  const headerLine = lines[0];
  const headers = parseCsvRow(headerLine).map((h) => h.toLowerCase().trim());
  
  const tsIdx = headers.findIndex((h) => h.includes("time") || h.includes("date") || h === "ts");
  const lvlIdx = headers.findIndex((h) => h.includes("level") || h.includes("sev"));
  const srvIdx = headers.findIndex((h) => h.includes("service") || h.includes("app") || h.includes("comp"));
  const msgIdx = headers.findIndex((h) => h.includes("message") || h.includes("msg") || h.includes("log") || h.includes("text"));

  const entries = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvRow(lines[i]);
    if (row.length === 0) continue;

    const timestamp = tsIdx !== -1 && row[tsIdx] ? row[tsIdx] : new Date().toISOString();
    const level = normalizeLogLevel(lvlIdx !== -1 && row[lvlIdx] ? row[lvlIdx] : "INFO");
    const service = srvIdx !== -1 && row[srvIdx] ? row[srvIdx].toLowerCase().trim() : "application";
    const message = msgIdx !== -1 && row[msgIdx] ? row[msgIdx].trim() : row.join(" ");

    entries.push({
      id: `log-${i}`,
      lineNumber: i + 1,
      timestamp,
      level,
      service,
      message,
      raw: lines[i]
    });
  }

  return buildParseResult(entries, "csv");
}

function parseCsvRow(row) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseTextEntries(lines) {
  // Regex patterns for standard log lines
  // Example 1: 2026-11-07 09:14:02.102 [INFO] api-gateway: Incoming POST ...
  const regexPattern1 = /^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\s+\[?([A-Z]+)\]?\s+([a-zA-Z0-9_\-\.]+):?\s+(.*)$/;

  // Example 2: [2026-11-07 09:14:02] [checkout-service] ERROR - Could not connect...
  const regexPattern2 = /^\[([^\]]+)\]\s+\[([a-zA-Z0-9_\-\.]+)\]\s+([A-Z]+)\s*[-:]?\s*(.*)$/;

  // Example 3: Nov 07 09:14:02 host checkout-service[1234]: [ERROR] message
  const regexPattern3 = /^([A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2})\s+[\w\.\-]+\s+([a-zA-Z0-9_\-\.]+)(?:\[\d+\])?:\s*(?:\[?([A-Z]+)\]?)?\s*(.*)$/;

  const entries = lines.map((line, idx) => {
    const lineNum = idx + 1;
    let match;

    if ((match = line.match(regexPattern1))) {
      return {
        id: `log-${lineNum}`,
        lineNumber: lineNum,
        timestamp: match[1],
        level: normalizeLogLevel(match[2]),
        service: match[3].toLowerCase().trim(),
        message: match[4].trim(),
        raw: line
      };
    }

    if ((match = line.match(regexPattern2))) {
      return {
        id: `log-${lineNum}`,
        lineNumber: lineNum,
        timestamp: match[1],
        level: normalizeLogLevel(match[3]),
        service: match[2].toLowerCase().trim(),
        message: match[4].trim(),
        raw: line
      };
    }

    if ((match = line.match(regexPattern3))) {
      return {
        id: `log-${lineNum}`,
        lineNumber: lineNum,
        timestamp: match[1],
        level: normalizeLogLevel(match[3] || "INFO"),
        service: match[2].toLowerCase().trim(),
        message: match[4].trim(),
        raw: line
      };
    }

    // Generic heuristic fallback for unstructured lines
    const levelMatch = line.match(/\b(FATAL|CRITICAL|ERROR|WARN|WARNING|INFO|DEBUG|TRACE)\b/i);
    const level = levelMatch ? normalizeLogLevel(levelMatch[1]) : inferLevelFromText(line);

    const serviceMatch = line.match(/\b([a-zA-Z0-9_\-]{3,25}(?:service|api|server|gateway|db|daemon|pod|worker|controller|processor|cluster|node))\b/i);
    const service = serviceMatch ? serviceMatch[1].toLowerCase() : "application";

    const tsMatch = line.match(/(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?|\d{2}:\d{2}:\d{2})/);
    const timestamp = tsMatch ? tsMatch[1] : new Date().toISOString();

    return {
      id: `log-${lineNum}`,
      lineNumber: lineNum,
      timestamp,
      level,
      service,
      message: line.trim(),
      raw: line
    };
  });

  return buildParseResult(entries, "txt");
}

function normalizeLogLevel(lvl) {
  const upper = String(lvl).toUpperCase();
  if (upper.includes("FATAL") || upper.includes("CRIT")) return "CRITICAL";
  if (upper.includes("ERR")) return "ERROR";
  if (upper.includes("WARN")) return "WARNING";
  if (upper.includes("DEBUG") || upper.includes("TRACE")) return "DEBUG";
  return "INFO";
}

function inferLevelFromText(text) {
  const lower = text.toLowerCase();
  if (lower.includes("failed") || lower.includes("exception") || lower.includes("timeout") || lower.includes("fatal") || lower.includes("refused") || lower.includes("oomkilled")) {
    return "ERROR";
  }
  if (lower.includes("warn") || lower.includes("slow") || lower.includes("high memory") || lower.includes("retry")) {
    return "WARNING";
  }
  return "INFO";
}

function buildParseResult(entries, format) {
  let errors = 0;
  let warnings = 0;
  let info = 0;
  const serviceSet = new Set();

  entries.forEach((e) => {
    if (e.level === "ERROR" || e.level === "CRITICAL") errors++;
    else if (e.level === "WARNING") warnings++;
    else info++;

    if (e.service) serviceSet.add(e.service);
  });

  return {
    entries,
    stats: {
      total: entries.length,
      errors,
      warnings,
      info,
      services: Array.from(serviceSet)
    },
    format
  };
}
