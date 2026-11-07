import React from "react";
import {
  Sparkles,
  PlusCircle,
  Key,
  HelpCircle,
  RefreshCw
} from "lucide-react";

export function Navbar({
  currentView,
  onNewAnalysis,
  onOpenSettings,
  geminiActive,
  onRefresh
}) {
  const titles = {
    overview: "Incident Operations Center",
    workspace: "Autonomous Agent Workspace",
    report: "Incident Response Report",
    history: "Incident Audit History",
    explorer: "Distributed Log Explorer",
    kb: "IT Incident Knowledge Base & Runbooks"
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-white tracking-tight">
          {titles[currentView] || "IncidentX"}
        </h1>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
          v1.0 Hackathon MVP
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Gemini Engine Toggle / Badge */}
        <button
          onClick={onOpenSettings}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            geminiActive
              ? "bg-indigo-950/60 text-indigo-300 border-indigo-700/60 hover:bg-indigo-900/60"
              : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800"
          }`}
        >
          <Sparkles
            className={`w-3.5 h-3.5 ${
              geminiActive ? "text-indigo-400" : "text-amber-400"
            }`}
          />
          <span>{geminiActive ? "Gemini 3.8 Flash Active" : "Deterministic Engine (Click for Gemini)"}</span>
        </button>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Refresh Incidents"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Quick New Analysis CTA */}
        <button
          onClick={onNewAnalysis}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm shadow-indigo-600/30 transition-all hover:scale-[1.02]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Ingest & Analyze</span>
        </button>
      </div>
    </header>
  );
}
