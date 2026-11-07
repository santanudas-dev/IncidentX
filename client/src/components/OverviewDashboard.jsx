import React from "react";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  Server,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Layers,
  Cpu
} from "lucide-react";

export function OverviewDashboard({
  incidents = [],
  onSelectIncident,
  onQuickRunScenario,
  samples = [],
  engineMode,
  onNavigate
}) {
  const openIncidents = incidents.filter(
    (i) => i.status === "DETECTED" || i.status === "INVESTIGATING"
  );
  const criticalCount = incidents.filter((i) => i.severity === "CRITICAL").length;
  const highCount = incidents.filter((i) => i.severity === "HIGH").length;

  const mockServices = [
    { name: "postgres-primary", type: "Database", status: "degraded", latency: "380ms", uptime: "98.4%" },
    { name: "api-gateway", type: "Edge Gateway", status: "operational", latency: "18ms", uptime: "99.9%" },
    { name: "checkout-service", type: "Microservice", status: "degraded", latency: "4200ms", uptime: "97.1%" },
    { name: "auth-service", type: "Security", status: "operational", latency: "34ms", uptime: "99.8%" },
    { name: "payment-gateway", type: "Microservice", status: "operational", latency: "45ms", uptime: "99.9%" },
    { name: "redis-session-cache", type: "Cache", status: "operational", latency: "2ms", uptime: "99.99%" }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Autonomous IT Incident Response Active
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Incident Operations Command Center
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Real-time telemetry, automated log ingestion, error correlation cascade analysis, and runbook generation powered by autonomous multi-stage SRE pipelines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate("workspace")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Cpu className="w-4 h-4" />
              <span>Launch Agent Workspace</span>
            </button>
            <button
              onClick={() => onNavigate("kb")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
            >
              <span>Explore Runbooks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Total Incidents</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">{incidents.length}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-red-400 font-semibold">{criticalCount} Critical</span>
            <span>•</span>
            <span className="text-amber-400 font-semibold">{highCount} High</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Active Outages</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">{openIncidents.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Requiring immediate remediation
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Mean Time To Detect</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">&lt; 1.2s</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 text-emerald-400">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Autonomous agent pipeline</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Active Engine</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="text-sm font-bold text-white truncate font-mono">
            {engineMode || "Deterministic"}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Zero hallucination guarantee
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Incidents & Monitored Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Incidents */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                Recent Correlated Incidents
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any incident to open full diagnostic report and remediation runbook
              </p>
            </div>
            <button
              onClick={() => onNavigate("history")}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              View All ({incidents.length}) →
            </button>
          </div>

          <div className="space-y-3">
            {incidents.slice(0, 5).map((inc) => (
              <div
                key={inc.id}
                onClick={() => onSelectIncident(inc)}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all hover:bg-slate-950 group"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-400">
                      {inc.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        inc.severity === "CRITICAL"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : inc.severity === "HIGH"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      }`}
                    >
                      {inc.severity}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Culprit: {inc.culpritService}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    {new Date(inc.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                <div className="font-semibold text-xs text-white group-hover:text-indigo-300 transition-colors">
                  {inc.title}
                </div>

                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {inc.executiveSummary || inc.rootCause}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Service Health Matrix */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              Service Health Matrix
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              Live Mesh
            </span>
          </div>

          <div className="space-y-2.5">
            {mockServices.map((svc) => (
              <div
                key={svc.name}
                className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 font-mono font-semibold text-slate-200">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        svc.status === "operational" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                      }`}
                    ></span>
                    <span>{svc.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{svc.type}</div>
                </div>

                <div className="text-right font-mono text-[11px]">
                  <div
                    className={
                      svc.status === "operational" ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"
                    }
                  >
                    {svc.status.toUpperCase()}
                  </div>
                  <div className="text-slate-400 text-[10px]">{svc.latency}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Scenario Launch */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-xs font-semibold text-slate-300 mb-2">
              Quick Test Scenarios
            </div>
            <div className="space-y-1.5">
              {samples.slice(0, 3).map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => onQuickRunScenario(sample)}
                  className="w-full text-left p-2 rounded bg-slate-800/60 hover:bg-indigo-950/40 border border-slate-700/60 hover:border-indigo-500/50 text-xs text-slate-300 flex items-center justify-between transition-colors"
                >
                  <span className="truncate">{sample.name}</span>
                  <ArrowRight className="w-3 h-3 text-indigo-400 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
