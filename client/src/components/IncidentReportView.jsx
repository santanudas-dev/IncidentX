import React, { useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Share2,
  Copy,
  Download,
  Terminal,
  ShieldAlert,
  Server,
  Layers,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Play,
  RotateCcw,
  Check,
  ChevronDown
} from "lucide-react";
import { simulateCommand, updateStatus } from "../services/api";

export function IncidentReportView({
  report,
  onStatusChange,
  onNavigateToExplorer
}) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview | causal | evidence | timeline | runbook
  const [dryRunOutputs, setDryRunOutputs] = useState({});
  const [simulatingCmdId, setSimulatingCmdId] = useState(null);
  const [timelineFilter, setTimelineFilter] = useState("ALL");

  if (!report) {
    return (
      <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-xl p-8">
        <ShieldAlert className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-white">No Incident Selected</h3>
        <p className="text-xs text-slate-400 mt-1">
          Select an incident from History or run a new log analysis in the Workspace.
        </p>
      </div>
    );
  }

  const {
    id,
    title,
    severity,
    severityDetails,
    status,
    createdAt,
    culpritService,
    affectedServices = [],
    executiveSummary,
    rootCause,
    propagationAnalysis,
    causalChain = [],
    evidence = [],
    errorTimeline = [],
    remediation = {},
    knowledgeBaseRunbook,
    agentMetadata = {}
  } = report;

  const severityColorMap = {
    CRITICAL: {
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      text: "text-red-400",
      badge: "bg-red-500 text-white shadow-red-500/20"
    },
    HIGH: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      text: "text-amber-400",
      badge: "bg-amber-500 text-slate-950 font-bold"
    },
    MEDIUM: {
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
      text: "text-yellow-400",
      badge: "bg-yellow-500 text-slate-950 font-bold"
    },
    LOW: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      badge: "bg-emerald-500 text-white"
    }
  };

  const currentSev = severityColorMap[severity] || severityColorMap.MEDIUM;

  const handleCopyMarkdown = () => {
    const md = `# Incident Response Report: ${id}
**Title:** ${title}
**Severity:** ${severity} (Score: ${severityDetails?.score || "N/A"}/100)
**Status:** ${status}
**Culprit Service:** ${culpritService}
**Affected Services:** ${affectedServices.map((s) => s.service).join(", ")}
**Created:** ${createdAt}

## Executive Summary
${executiveSummary}

## Root Cause Analysis
${rootCause}

## Causal Propagation Chain
${causalChain.map((c) => `- Step ${c.step} [${c.service}]: ${c.description}`).join("\n")}

## Verified Log Evidence
${evidence.map((e) => `- [Line ${e.lineNumber}] ${e.timestamp} [${e.level}] ${e.service}: ${e.message}`).join("\n")}

## Immediate Remediation
${(remediation.immediateActions || []).map((a) => `- [ ] ${a}`).join("\n")}

## Permanent Architectural Fixes
${(remediation.permanentFixes || []).map((f) => `- [ ] ${f}`).join("\n")}

---
*Generated autonomously by IncidentX Agent*
`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${id}-incident-report.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDryRunCommand = async (cmd) => {
    setSimulatingCmdId(cmd.id);
    try {
      const res = await simulateCommand(cmd.id, cmd.command);
      setDryRunOutputs((prev) => ({
        ...prev,
        [cmd.id]: res.output
      }));
    } catch (err) {
      setDryRunOutputs((prev) => ({
        ...prev,
        [cmd.id]: "Failed to execute diagnostic check: " + err.message
      }));
    } finally {
      setSimulatingCmdId(null);
    }
  };

  const handleStatusChangeInternal = async (newStatus) => {
    if (onStatusChange) {
      onStatusChange(id, newStatus);
    }
  };

  const filteredTimeline = errorTimeline.filter((item) => {
    if (timelineFilter === "ALL") return true;
    return item.level === timelineFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner / Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-indigo-400">
                {id}
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${currentSev.badge}`}>
                {severity} SEVERITY
              </span>
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Target SLA: {severityDetails?.targetSlaMinutes || 30} mins</span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{agentMetadata?.engineMode || "Deterministic Expert"}</span>
              </span>
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight leading-snug">
              {title}
            </h2>

            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span>Detected: {new Date(createdAt).toLocaleString()}</span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-red-400" />
                Culprit: <strong className="text-slate-200">{culpritService}</strong>
              </span>
              <span>•</span>
              <span>{affectedServices.length} Service(s) Impacted</span>
            </div>
          </div>

          {/* Right Action Controls: Status & Export */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Status Selector */}
            <div className="relative">
              <select
                value={status}
                onChange={(e) => handleStatusChangeInternal(e.target.value)}
                className="bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg px-3 py-2 pr-8 appearance-none focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="DETECTED">Status: DETECTED</option>
                <option value="INVESTIGATING">Status: INVESTIGATING</option>
                <option value="MITIGATING">Status: MITIGATING</option>
                <option value="RESOLVED">Status: RESOLVED</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>

            {/* Copy Markdown */}
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
              title="Copy formatted markdown report"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Report"}</span>
            </button>

            {/* Export JSON */}
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
              title="Download full incident JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-t border-slate-800 mt-6 pt-3 overflow-x-auto">
          {[
            { id: "overview", label: "Executive Summary & Root Cause" },
            { id: "causal", label: `Causal Chain (${causalChain.length} steps)` },
            { id: "evidence", label: `Strict Evidence (${evidence.length} logs)` },
            { id: "timeline", label: `Chronological Timeline (${errorTimeline.length})` },
            { id: "runbook", label: "Remediation & Safe Runbooks" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW & ROOT CAUSE */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Executive Summary Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Executive Summary
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-lg border border-slate-800/80 font-sans">
                {executiveSummary}
              </p>
            </div>

            {/* Root Cause Analysis Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-red-400" />
                  Probable Root Cause Analysis
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-950/60 border border-red-800/60 text-red-400">
                  Origin: {culpritService}
                </span>
              </div>
              <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
                {rootCause}
              </div>
            </div>

            {/* Propagation Narrative */}
            {propagationAnalysis && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Propagation Mechanism
                </h3>
                <div className="text-xs font-mono text-slate-300 whitespace-pre-line bg-slate-950/60 p-4 rounded-lg border border-slate-800/80 leading-relaxed">
                  {propagationAnalysis}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Affected Services & Severity Breakdown */}
          <div className="space-y-6">
            {/* Severity Scoring Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Severity Engine Breakdown</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Criticality Score</span>
                <span className="text-sm font-bold text-white font-mono">
                  {severityDetails?.score || 85} / 100
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full ${
                    severity === "CRITICAL"
                      ? "bg-red-500"
                      : severity === "HIGH"
                      ? "bg-amber-500"
                      : "bg-yellow-500"
                  }`}
                  style={{ width: `${severityDetails?.score || 85}%` }}
                ></div>
              </div>

              <div className="space-y-2">
                {(severityDetails?.scoreBreakdown || []).map((factor, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded bg-slate-950/50 border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{factor.factor}</div>
                      <div className="text-[11px] text-slate-400">{factor.detail}</div>
                    </div>
                    <span className="font-mono text-xs font-bold text-indigo-400">
                      +{factor.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Affected Services Impact List */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Affected Services Cascade</h3>
              <div className="space-y-2">
                {affectedServices.map((svc, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border flex items-center justify-between ${
                      svc.service === culpritService
                        ? "bg-red-950/30 border-red-800/50 text-red-300"
                        : "bg-slate-950/40 border-slate-800 text-slate-300"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs flex items-center gap-2">
                        <span>{svc.service}</span>
                        {svc.service === culpritService && (
                          <span className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.2 rounded">
                            Culprit
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {svc.categories?.join(", ") || "Active errors"}
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                      {svc.errorCount} errors
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Matched Knowledge Base Runbook */}
            {knowledgeBaseRunbook && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Matched Runbook
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {knowledgeBaseRunbook.confidence}% Match
                  </span>
                </div>
                <div className="text-xs font-semibold text-white mb-1">
                  {knowledgeBaseRunbook.title}
                </div>
                <div className="text-[11px] text-slate-400 mb-3">
                  Category: {knowledgeBaseRunbook.category}
                </div>
                <button
                  onClick={() => setActiveTab("runbook")}
                  className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 font-semibold py-1.5 rounded bg-indigo-950/40 border border-indigo-800/40 transition-colors"
                >
                  View Runbook Remediations →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CAUSAL CHAIN CASCADE GRAPH */}
      {activeTab === "causal" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Service Dependency Propagation Chain
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Correlated causal sequence showing how the initial fault propagated across interconnected microservices.
            </p>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
            {causalChain.map((step, idx) => {
              const isRoot = step.role === "ROOT_TRIGGER";
              return (
                <div key={idx} className="relative group">
                  {/* Step Dot */}
                  <div
                    className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isRoot
                        ? "bg-red-500 text-white ring-4 ring-red-500/20 animate-pulse"
                        : "bg-indigo-600 text-white ring-4 ring-indigo-500/20"
                    }`}
                  >
                    {step.step}
                  </div>

                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      isRoot
                        ? "bg-red-950/20 border-red-500/30"
                        : "bg-slate-950/50 border-slate-800 group-hover:border-slate-700"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                            isRoot
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                          }`}
                        >
                          {isRoot ? "ROOT TRIGGER" : "CASCADING IMPACT"}
                        </span>
                        <strong className="text-xs text-white font-mono">{step.service}</strong>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Line #{step.lineNumber} • {step.timestamp}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-mono">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: STRICT VERIFIED EVIDENCE */}
      {activeTab === "evidence" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Strict Verified Log Evidence
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Zero hallucination: Every evidence item maps directly to exact line numbers and messages in the ingested logs.
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {evidence.length} evidence lines
            </span>
          </div>

          <div className="space-y-2.5">
            {evidence.map((entry, idx) => (
              <div
                key={entry.id || idx}
                className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors font-mono text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                      Line #{entry.lineNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        entry.level === "CRITICAL" || entry.level === "ERROR"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {entry.level}
                    </span>
                    <span className="text-indigo-400 font-semibold">{entry.service}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">{entry.timestamp}</span>
                    {entry.role && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {entry.role}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-slate-200 bg-slate-900/60 p-2.5 rounded border border-slate-800/80 leading-relaxed select-all">
                  {entry.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CHRONOLOGICAL ERROR TIMELINE */}
      {activeTab === "timeline" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                Chronological Incident Timeline
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Full chronological sequence of events leading up to and during the incident.
              </p>
            </div>

            {/* Level Filter */}
            <div className="flex items-center gap-1.5">
              {["ALL", "CRITICAL", "ERROR", "WARNING"].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setTimelineFilter(lvl)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    timelineFilter === lvl
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {filteredTimeline.map((item, idx) => (
              <div
                key={item.id || idx}
                className={`p-3 rounded-lg border font-mono text-xs flex flex-col md:flex-row md:items-center justify-between gap-2 ${
                  item.isRootCulprit
                    ? "bg-red-950/20 border-red-500/40"
                    : "bg-slate-950/40 border-slate-800"
                }`}
              >
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-400 text-[11px] w-12">#{item.lineNumber}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.level === "ERROR" || item.level === "CRITICAL"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-amber-500/20 text-amber-400"
                    }`}
                  >
                    {item.level}
                  </span>
                  <span className="text-indigo-300 font-semibold">{item.service}</span>
                  {item.isRootCulprit && (
                    <span className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.2 rounded">
                      ROOT CULPRIT
                    </span>
                  )}
                </div>

                <div className="text-slate-200 flex-1 truncate">{item.message}</div>

                <div className="text-slate-400 text-[11px] shrink-0">{item.timestamp}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: REMEDIATION & SAFE RUNBOOKS */}
      {activeTab === "runbook" && (
        <div className="space-y-6">
          {/* Actionable Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Immediate Mitigation */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Immediate Containment (Step 1)
              </h3>
              <ul className="space-y-2.5">
                {(remediation.immediateActions || []).map((action, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5 leading-relaxed"
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Permanent Architectural Fixes */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Permanent Architectural Fixes (Step 2)
              </h3>
              <ul className="space-y-2.5">
                {(remediation.permanentFixes || []).map((fix, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5 leading-relaxed"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{fix}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Interactive Safe Diagnostic Dry-Runs */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  Interactive Non-Destructive Dry-Run Diagnostics
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Safety policy: Never execute destructive modifications. Safely execute read-only diagnostic checks to verify system state.
                </p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Safety Guardrail Active
              </span>
            </div>

            <div className="space-y-4">
              {(remediation.safeDryRunCommands || []).map((cmd) => {
                const output = dryRunOutputs[cmd.id];
                const isExecuting = simulatingCmdId === cmd.id;

                return (
                  <div
                    key={cmd.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-slate-200 font-sans font-semibold text-xs">
                          {cmd.label}
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                          Type: {cmd.type}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDryRunCommand(cmd)}
                        disabled={isExecuting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-semibold shadow-sm transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>{isExecuting ? "Executing..." : "Execute Safe Check"}</span>
                      </button>
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-indigo-300 select-all overflow-x-auto">
                      $ {cmd.command}
                    </div>

                    {output && (
                      <div className="mt-2 bg-slate-900 border border-slate-700/80 rounded-lg p-3 text-slate-300 whitespace-pre-wrap leading-relaxed animate-in fade-in duration-200">
                        {output}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
