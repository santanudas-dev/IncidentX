import React from "react";
import {
  LayoutDashboard,
  Cpu,
  FileText,
  History,
  BookOpen,
  ShieldAlert,
  Settings,
  Sparkles,
  Server
} from "lucide-react";

export function Sidebar({
  currentView,
  setCurrentView,
  incidentCount,
  openIncidentsCount,
  onOpenSettings,
  engineMode
}) {
  const navItems = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: "workspace",
      label: "Agent Workspace",
      icon: Cpu,
      badge: "AI Agent"
    },
    {
      id: "history",
      label: "Incident History",
      icon: History,
      badge: incidentCount > 0 ? incidentCount : null
    },
    {
      id: "explorer",
      label: "Log Explorer",
      icon: FileText,
      badge: null
    },
    {
      id: "kb",
      label: "Knowledge Base",
      icon: BookOpen,
      badge: "Runbooks"
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-white">IncidentX</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Agent
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Autonomous SRE Response</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Platform
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-indigo-400" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      isActive
                        ? "bg-indigo-500/30 text-indigo-200"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Engine & System Status */}
      <div className="p-3 border-t border-slate-800 space-y-3">
        {/* Engine Status Card */}
        <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Engine Mode
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-200 truncate">
            {engineMode || "Deterministic Expert"}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Zero-hallucination correlation
          </p>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-2 pt-1 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">Backend Connected</span>
          </div>
          <button
            onClick={onOpenSettings}
            className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
            title="Configure Gemini API Key"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
