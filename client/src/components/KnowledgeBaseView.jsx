import React, { useState } from "react";
import {
  BookOpen,
  Search,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  Layers
} from "lucide-react";

export function KnowledgeBaseView({ knowledgeBase = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKbId, setSelectedKbId] = useState(knowledgeBase[0]?.id || "KB-DB-001");

  const filtered = knowledgeBase.filter((kb) => {
    const term = searchTerm.toLowerCase();
    return (
      !term ||
      kb.title?.toLowerCase().includes(term) ||
      kb.category?.toLowerCase().includes(term) ||
      kb.rootCauseAnalysis?.toLowerCase().includes(term) ||
      kb.symptoms?.some((s) => s.toLowerCase().includes(term))
    );
  });

  const selectedKb = knowledgeBase.find((kb) => kb.id === selectedKbId) || filtered[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            IT Incident Knowledge Base & Runbooks
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pre-compiled domain playbooks, symptoms, root cause models, and safe mitigation procedures for production failures.
          </p>
        </div>

        <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
          {knowledgeBase.length} Curated SRE Runbooks
        </span>
      </div>

      {/* Search Input */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search runbooks by symptom, technology, or failure mode (e.g. OOM, connection pool, Redis, timeout)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>
      </div>

      {/* Two Column Layout: Runbook List + Runbook Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List */}
        <div className="space-y-2.5">
          {filtered.map((kb) => {
            const isSelected = selectedKb?.id === kb.id;
            return (
              <div
                key={kb.id}
                onClick={() => setSelectedKbId(kb.id)}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? "bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10 text-white"
                    : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-indigo-400 border border-slate-700">
                    {kb.id}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">
                    {kb.category}
                  </span>
                </div>
                <h4 className="text-xs font-bold line-clamp-1 mb-1">{kb.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {kb.rootCauseAnalysis}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right Column: Active Runbook Viewer */}
        <div className="lg:col-span-2 space-y-6">
          {selectedKb ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {selectedKb.id}
                  </span>
                  <span className="text-xs text-slate-400">
                    Category: {selectedKb.category}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {selectedKb.title}
                </h3>
              </div>

              {/* Symptoms */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Observed Symptoms
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedKb.symptoms?.map((sym, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></span>
                      <span>{sym}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Root Cause Mechanism */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Root Cause Mechanics
                </h4>
                <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  {selectedKb.rootCauseAnalysis}
                </div>
              </div>

              {/* Immediate Containment */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Immediate Containment Steps
                </h4>
                <ul className="space-y-2">
                  {selectedKb.immediateMitigation?.map((step, idx) => (
                    <li
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800 text-xs text-slate-300 flex items-start gap-2 leading-relaxed"
                    >
                      <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Permanent Architectural Fixes */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Permanent Architectural Fixes
                </h4>
                <ul className="space-y-2">
                  {selectedKb.permanentFix?.map((fix, idx) => (
                    <li
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800 text-xs text-slate-300 flex items-start gap-2 leading-relaxed"
                    >
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{fix}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Safe Dry-Run Commands */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 mb-2">
                  <Terminal className="w-3.5 h-3.5" />
                  Recommended Diagnostic Commands
                </h4>
                <div className="space-y-2.5">
                  {selectedKb.safeDryRunCommands?.map((cmd, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs"
                    >
                      <div className="text-slate-400 text-[11px] mb-1 font-sans">
                        {cmd.label} ({cmd.type})
                      </div>
                      <div className="text-indigo-300 bg-slate-900 p-2 rounded select-all overflow-x-auto">
                        $ {cmd.command}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
              Select a runbook from the left column to view full playbook.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
