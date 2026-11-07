import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileCode,
  FileText,
  Play,
  Trash2,
  Sparkles,
  Info,
  Check,
  AlertCircle
} from "lucide-react";
import { AgentPipelineSteps } from "./AgentPipelineSteps";

export function AgentWorkspace({
  samples = [],
  onAnalyzeLogs,
  onUploadFile,
  isAnalyzing,
  currentReport,
  apiKey,
  onOpenSettings
}) {
  const [selectedSampleId, setSelectedSampleId] = useState("");
  const [logText, setLogText] = useState("");
  const [activeTab, setActiveTab] = useState("paste"); // "paste" | "upload"
  const [uploadedFile, setUploadedFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  const handleSelectSample = (sample) => {
    setSelectedSampleId(sample.id);
    const content = sample.logs || sample.samplePreview || "";
    setLogText(content);
    setErrorMsg("");
  };

  const handleClear = () => {
    setLogText("");
    setSelectedSampleId("");
    setUploadedFile(null);
    setErrorMsg("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setErrorMsg("");
      // Read preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogText(event.target?.result || "");
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    const textToAnalyze = typeof logText === "string" ? logText.trim() : "";
    if (activeTab === "paste") {
      if (!textToAnalyze) {
        setErrorMsg("Please paste log content or select a sample scenario above.");
        return;
      }
      onAnalyzeLogs(textToAnalyze);
    } else {
      if (!uploadedFile && !textToAnalyze) {
        setErrorMsg("Please choose a log file (TXT, JSON, CSV) to upload.");
        return;
      }
      if (uploadedFile) {
        onUploadFile(uploadedFile);
      } else {
        onAnalyzeLogs(textToAnalyze);
      }
    }
  };

  const safeLogText = typeof logText === "string" ? logText : "";
  const lineCount = safeLogText ? safeLogText.split(/\r?\n/).length : 0;
  const charCount = safeLogText.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Log Ingestion & Analysis Workspace
              </span>
              <span className="text-xs text-slate-400">Step 1 of Incident Workflow</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Ingest System Logs for Autonomous Agent Diagnosis
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Paste application traces or upload files (TXT, JSON, CSV). IncidentX will parse, classify errors, trace multi-service correlation cascades, and construct an actionable remediation runbook.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSettings}
              className="text-xs px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-slate-600 text-slate-300 flex items-center gap-2 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{apiKey ? "Gemini Key Configured" : "Configure Gemini API"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preset Scenarios Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Quick Test Scenarios (1-Click Presets)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Click any scenario to populate realistic production incident logs
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {samples.map((sample) => {
            const isSelected = selectedSampleId === sample.id;
            return (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                className={`p-3 rounded-lg border text-left transition-all relative ${
                  isSelected
                    ? "bg-indigo-950/60 border-indigo-500 text-white shadow-md shadow-indigo-500/10"
                    : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-slate-700/60 text-slate-300">
                    {sample.format?.toUpperCase()}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      sample.severityExpected === "CRITICAL"
                        ? "bg-red-500/20 text-red-400"
                        : sample.severityExpected === "HIGH"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {sample.severityExpected}
                  </span>
                </div>
                <div className="font-semibold text-xs line-clamp-1">{sample.name}</div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {sample.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ingestion Workspace Input Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {/* Workspace Toolbar */}
        <div className="border-b border-slate-800 p-3 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("paste")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "paste"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Paste Raw Logs</span>
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "upload"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload File (.txt, .json, .csv)</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            {logText && (
              <span className="font-mono text-[11px] bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
                {lineCount} lines • {(charCount / 1024).toFixed(1)} KB
              </span>
            )}
            {logText && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors"
                title="Clear input"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Input Body */}
        <div className="p-4">
          {activeTab === "paste" ? (
            <div>
              <textarea
                value={logText}
                onChange={(e) => setLogText(e.target.value)}
                placeholder="Paste system or microservice logs here (e.g. 2026-11-07 09:14:02.102 [ERROR] checkout-service: Connection pool exhausted...)"
                rows={14}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all leading-relaxed"
                spellCheck="false"
              />
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-10 text-center cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.json,.csv,.log"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-white">
                {uploadedFile ? uploadedFile.name : "Click to select or drag and drop log file"}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Supports TXT (syslog/logfmt), JSON (array or NDJSON), and CSV formats up to 10MB
              </p>
              {uploadedFile && (
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                  <Check className="w-3.5 h-3.5" />
                  <span>File loaded ({uploadedFile.name}, {(uploadedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-red-950/50 border border-red-800/60 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                Agent will perform automated parsing, error classification, correlation, and runbook retrieval.
              </span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isAnalyzing}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white shadow-lg transition-all ${
                isAnalyzing
                  ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-indigo-600/30 hover:scale-[1.02]"
              }`}
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isAnalyzing ? "Analyzing Log Stream..." : "Run IncidentX Agent"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Pipeline Stepper */}
      <AgentPipelineSteps
        stages={currentReport?.agentMetadata?.pipelineStages || []}
        isRunning={isAnalyzing}
      />
    </div>
  );
}
