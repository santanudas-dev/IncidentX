import React, { useState } from "react";
import {
  Search,
  Filter,
  FileText,
  Download,
  Check,
  RotateCcw
} from "lucide-react";

export function LogExplorer({ entries = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("ALL");
  const [selectedService, setSelectedService] = useState("ALL");

  const services = Array.from(new Set(entries.map((e) => e.service).filter(Boolean)));

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      !searchTerm ||
      entry.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.service?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.raw?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel =
      selectedLevel === "ALL" || entry.level === selectedLevel;

    const matchesService =
      selectedService === "ALL" || entry.service === selectedService;

    return matchesSearch && matchesLevel && matchesService;
  });

  const handleDownload = () => {
    const text = filteredEntries.map((e) => e.raw || `[${e.timestamp}] [${e.level}] ${e.service}: ${e.message}`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `incidentx-filtered-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Distributed Log Explorer
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time inspection of ingested log entries with level filtering, keyword search, and service grouping.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
            Showing {filteredEntries.length} of {entries.length} lines
          </span>
          <button
            onClick={handleDownload}
            disabled={filteredEntries.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export View</span>
          </button>
        </div>
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
            placeholder="Search log messages, services, exceptions, or trace IDs..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        {/* Level Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Levels</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="ERROR">ERROR</option>
            <option value="WARNING">WARNING</option>
            <option value="INFO">INFO</option>
            <option value="DEBUG">DEBUG</option>
          </select>

          {/* Service Dropdown */}
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Services ({services.length})</option>
            {services.map((svc) => (
              <option key={svc} value={svc}>
                {svc}
              </option>
            ))}
          </select>

          {(searchTerm || selectedLevel !== "ALL" || selectedService !== "ALL") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedLevel("ALL");
                setSelectedService("ALL");
              }}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Log Table / Stream Viewer */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden font-mono text-xs shadow-xl">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto divide-y divide-slate-800/80">
          {filteredEntries.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No log entries match the current search filters.
            </div>
          ) : (
            filteredEntries.map((entry, idx) => (
              <div
                key={entry.id || idx}
                className={`p-3 flex items-start gap-3 hover:bg-slate-900/60 transition-colors ${
                  entry.level === "ERROR" || entry.level === "CRITICAL"
                    ? "bg-red-950/10"
                    : entry.level === "WARNING"
                    ? "bg-amber-950/10"
                    : ""
                }`}
              >
                <span className="text-slate-400 select-none text-[11px] w-12 shrink-0 text-right">
                  {entry.lineNumber}
                </span>

                <span className="text-slate-400 text-[11px] shrink-0 w-36">
                  {entry.timestamp}
                </span>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                    entry.level === "CRITICAL" || entry.level === "ERROR"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : entry.level === "WARNING"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-slate-800 text-slate-300 border border-slate-700"
                  }`}
                >
                  {entry.level}
                </span>

                <span className="text-indigo-400 font-semibold shrink-0 w-32 truncate">
                  {entry.service}
                </span>

                <span className="text-slate-200 select-all break-all leading-relaxed flex-1">
                  {entry.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
