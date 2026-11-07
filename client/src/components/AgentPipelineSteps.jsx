import React from "react";
import {
  CheckCircle2,
  Clock,
  Loader2,
  FileSearch,
  Filter,
  Network,
  AlertTriangle,
  BookOpen,
  Sparkles
} from "lucide-react";

export function AgentPipelineSteps({ stages = [], isRunning = false, currentStep = 0 }) {
  const stageIcons = [
    FileSearch,
    Filter,
    Network,
    AlertTriangle,
    BookOpen,
    Sparkles
  ];

  const defaultStages = [
    { name: "Log Parser", details: "Extract timestamps, services, levels, and messages" },
    { name: "Error Classifier", details: "Classify domains, pattern signatures, and frequencies" },
    { name: "Correlation Engine", details: "Trace multi-service cascade and isolate root culprit" },
    { name: "Severity Assessor", details: "Calculate criticality score, cascade depth, and SLA" },
    { name: "Knowledge Base Retrieval", details: "Match verified IT incident runbooks & mitigations" },
    { name: "Report Synthesis", details: "Synthesize executive report, verified evidence, and runbook" }
  ];

  const displayStages = stages.length > 0 ? stages : defaultStages;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Modular Agent Response Pipeline
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Sequential multi-stage analysis pipeline executed on ingested log stream
          </p>
        </div>
        {isRunning && (
          <div className="flex items-center gap-2 text-xs text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-3 py-1 rounded-full">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Agent Pipeline Running...</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayStages.map((stg, idx) => {
          const Icon = stageIcons[idx % stageIcons.length];
          const isDone = stages.length > 0 || (isRunning && idx < currentStep);
          const isActive = isRunning && idx === currentStep;

          return (
            <div
              key={stg.name || idx}
              className={`p-3.5 rounded-lg border transition-all ${
                isActive
                  ? "bg-indigo-950/40 border-indigo-500/60 shadow-md shadow-indigo-500/10"
                  : isDone
                  ? "bg-slate-800/50 border-slate-700/60"
                  : "bg-slate-900/60 border-slate-800/60 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center text-xs font-semibold ${
                      isDone
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : isActive
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-xs font-semibold text-slate-200">
                    {stg.name}
                  </span>
                </div>

                <div>
                  {isActive ? (
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                  ) : isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {stg.details}
              </p>

              {stg.durationMs !== undefined && (
                <div className="mt-2 text-[10px] text-indigo-400 font-mono flex items-center gap-1">
                  <span>⏱ {stg.durationMs}ms</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
