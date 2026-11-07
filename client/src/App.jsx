import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Navbar } from "./components/Navbar";
import { OverviewDashboard } from "./components/OverviewDashboard";
import { AgentWorkspace } from "./components/AgentWorkspace";
import { IncidentReportView } from "./components/IncidentReportView";
import { IncidentHistory } from "./components/IncidentHistory";
import { LogExplorer } from "./components/LogExplorer";
import { KnowledgeBaseView } from "./components/KnowledgeBaseView";
import { ApiKeyModal } from "./components/ApiKeyModal";
import {
  fetchIncidents,
  fetchSamples,
  fetchKnowledgeBase,
  analyzeLogs,
  uploadLogFile,
  updateStatus,
  checkHealth
} from "./services/api";

export function App() {
  const [currentView, setCurrentView] = useState("overview");
  const [incidents, setIncidents] = useState([]);
  const [samples, setSamples] = useState([]);
  const [knowledgeBase, setKnowledgeBase] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [latestParsedLogs, setLatestParsedLogs] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [geminiActive, setGeminiActive] = useState(false);

  // Local storage for optional API key
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem("incidentx_gemini_key") || "";
  });

  const loadData = async () => {
    try {
      const [incRes, samRes, kbRes, healthRes] = await Promise.all([
        fetchIncidents().catch(() => ({ incidents: [] })),
        fetchSamples().catch(() => ({ samples: [] })),
        fetchKnowledgeBase().catch(() => ({ knowledgeBase: [] })),
        checkHealth().catch(() => ({ geminiConfigured: false }))
      ]);

      if (incRes.incidents) {
        setIncidents(incRes.incidents);
        if (incRes.incidents.length > 0 && !selectedIncident) {
          setSelectedIncident(incRes.incidents[0]);
          if (incRes.incidents[0].errorTimeline) {
            setLatestParsedLogs(
              incRes.incidents[0].errorTimeline.map((item, idx) => ({
                id: `log-${idx}`,
                lineNumber: item.lineNumber,
                timestamp: item.timestamp,
                level: item.level,
                service: item.service,
                message: item.message,
                raw: `[${item.timestamp}] [${item.level}] [${item.service}] ${item.message}`
              }))
            );
          }
        }
      }

      if (samRes.samples) {
        setSamples(samRes.samples);
      }

      if (kbRes.knowledgeBase) {
        setKnowledgeBase(kbRes.knowledgeBase);
      }

      setGeminiActive(Boolean(healthRes.geminiConfigured || apiKey));
    } catch (err) {
      console.error("Failed to load initial data:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, [apiKey]);

  const handleSaveKey = (key) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem("incidentx_gemini_key", key);
    } else {
      localStorage.removeItem("incidentx_gemini_key");
    }
    setGeminiActive(Boolean(key));
  };

  const handleAnalyzeLogs = async (logText) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeLogs(logText, apiKey);
      if (result.report) {
        setSelectedIncident(result.report);
        setIncidents((prev) => [result.report, ...prev]);

        if (result.parsedResult?.entries) {
          setLatestParsedLogs(result.parsedResult.entries);
        }

        setCurrentView("report");
      }
    } catch (err) {
      alert("Error analyzing logs: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUploadFile = async (file) => {
    setIsAnalyzing(true);
    try {
      const result = await uploadLogFile(file, apiKey);
      if (result.report) {
        setSelectedIncident(result.report);
        setIncidents((prev) => [result.report, ...prev]);

        if (result.parsedResult?.entries) {
          setLatestParsedLogs(result.parsedResult.entries);
        }

        setCurrentView("report");
      }
    } catch (err) {
      alert("Error uploading file: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuickRunScenario = async (sample) => {
    setCurrentView("workspace");
    let logsToRun = sample.logs;
    if (!logsToRun) {
      try {
        const fullSample = await fetchSampleById(sample.id);
        logsToRun = fullSample.logs;
      } catch {
        logsToRun = sample.samplePreview || "";
      }
    }
    if (logsToRun) {
      await handleAnalyzeLogs(logsToRun);
    }
  };

  const handleSelectIncident = (incident) => {
    setSelectedIncident(incident);
    if (incident.errorTimeline) {
      setLatestParsedLogs(
        incident.errorTimeline.map((item, idx) => ({
          id: `log-${idx}`,
          lineNumber: item.lineNumber,
          timestamp: item.timestamp,
          level: item.level,
          service: item.service,
          message: item.message,
          raw: `[${item.timestamp}] [${item.level}] [${item.service}] ${item.message}`
        }))
      );
    }
    setCurrentView("report");
  };

  const handleStatusChange = async (incidentId, newStatus) => {
    try {
      const res = await updateStatus(incidentId, newStatus);
      if (res.incident) {
        setIncidents((prev) =>
          prev.map((i) => (i.id === incidentId ? res.incident : i))
        );
        if (selectedIncident?.id === incidentId) {
          setSelectedIncident(res.incident);
        }
      }
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  const openIncidentsCount = incidents.filter(
    (i) => i.status === "DETECTED" || i.status === "INVESTIGATING"
  ).length;

  return (
    <div className="flex min-h-screen bg-[#0b0f17] text-slate-100">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        incidentCount={incidents.length}
        openIncidentsCount={openIncidentsCount}
        onOpenSettings={() => setIsSettingsOpen(true)}
        engineMode={geminiActive ? "Gemini 3.8 Flash (Active)" : "Deterministic Expert Engine"}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar
          currentView={currentView}
          onNewAnalysis={() => setCurrentView("workspace")}
          onOpenSettings={() => setIsSettingsOpen(true)}
          geminiActive={geminiActive}
          onRefresh={loadData}
        />

        <main className="p-6 flex-1">
          {currentView === "overview" && (
            <OverviewDashboard
              incidents={incidents}
              onSelectIncident={handleSelectIncident}
              onQuickRunScenario={handleQuickRunScenario}
              samples={samples}
              engineMode={geminiActive ? "Gemini 3.8 Flash" : "Deterministic Expert"}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === "workspace" && (
            <AgentWorkspace
              samples={samples}
              onAnalyzeLogs={handleAnalyzeLogs}
              onUploadFile={handleUploadFile}
              isAnalyzing={isAnalyzing}
              currentReport={selectedIncident}
              apiKey={apiKey}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          )}

          {currentView === "report" && (
            <IncidentReportView
              report={selectedIncident}
              onStatusChange={handleStatusChange}
              onNavigateToExplorer={() => setCurrentView("explorer")}
            />
          )}

          {currentView === "history" && (
            <IncidentHistory
              incidents={incidents}
              onSelectIncident={handleSelectIncident}
            />
          )}

          {currentView === "explorer" && (
            <LogExplorer entries={latestParsedLogs} />
          )}

          {currentView === "kb" && (
            <KnowledgeBaseView knowledgeBase={knowledgeBase} />
          )}
        </main>
      </div>

      {/* Settings / API Key Modal */}
      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentKey={apiKey}
        onSaveKey={handleSaveKey}
      />
    </div>
  );
}

export default App;
