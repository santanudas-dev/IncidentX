import React, { useState } from "react";
import {
  History,
  Search,
  Filter,
  ShieldAlert,
  Clock,
  ArrowRight,
  Server,
  Sparkles
} from "lucide-react";

export function IncidentHistory({ incidents = [], onSelectIncident }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const filtered = incidents.filter((inc) => {
    const matchesSearch =
      !searchTerm ||
      inc.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.culpritService?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity =
      selectedSeverity === "ALL" || inc.severity === selectedSeverity;

    const matchesStatus =
      selectedStatus === "ALL" || inc.status === selectedStatus;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            Incident Audit History
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Historical repository of all detected outages, correlated root causes, and remediation records.
          </p>
        </div>

        <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
          {filtered.length} of {incidents.length} recorded incidents
        </span>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by incident ID (e.g. INC-2026-1001), service, or title..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Severity Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="DETECTED">DETECTED</option>
            <option value="INVESTIGATING">INVESTIGATING</option>
            <option value="MITIGATING">MITIGATING</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>
      </div>

      {/* Incident List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl p-8">
            <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-white">No Incidents Found</h4>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your filter criteria or ingest new logs in the Workspace.
            </p>
          </div>
        ) : (
          filtered.map((inc) => (
            <div
              key={inc.id}
              onClick={() => onSelectIncident(inc)}
              className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/60 cursor-pointer transition-all hover:bg-slate-850 shadow-md group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-indigo-400">
                    {inc.id}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded ${
                      inc.severity === "CRITICAL"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : inc.severity === "HIGH"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    }`}
                  >
                    {inc.severity}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {inc.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(inc.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors mb-1.5">
                {inc.title}
              </h3>

              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                {inc.executiveSummary || inc.rootCause}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
                <div className="flex items-center gap-3 text-slate-400">
                  <span className="flex items-center gap-1">
                    <Server className="w-3.5 h-3.5 text-red-400" />
                    Culprit: <strong className="text-slate-300 font-mono">{inc.culpritService}</strong>
                  </span>
                  <span>•</span>
                  <span>{inc.affectedServices?.length || 1} Services Affected</span>
                </div>

                <span className="text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  <span>View Incident Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
