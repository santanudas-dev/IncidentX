/**
 * IncidentX Frontend API Client
 */

const API_BASE = "/api";

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchSamples() {
  const res = await fetch(`${API_BASE}/samples`);
  return res.json();
}

export async function fetchSampleById(id) {
  const res = await fetch(`${API_BASE}/samples/${id}`);
  return res.json();
}

export async function analyzeLogs(logs, apiKey = "") {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "x-gemini-api-key": apiKey } : {})
    },
    body: JSON.stringify({ logs, apiKey })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Analysis failed" }));
    throw new Error(err.error || "Analysis failed");
  }

  return res.json();
}

export async function uploadLogFile(file, apiKey = "") {
  const formData = new FormData();
  formData.append("file", file);
  if (apiKey) formData.append("apiKey", apiKey);

  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: {
      ...(apiKey ? { "x-gemini-api-key": apiKey } : {})
    },
    body: formData
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "File upload analysis failed" }));
    throw new Error(err.error || "File upload analysis failed");
  }

  return res.json();
}

export async function fetchIncidents() {
  const res = await fetch(`${API_BASE}/incidents`);
  return res.json();
}

export async function fetchIncidentById(id) {
  const res = await fetch(`${API_BASE}/incidents/${id}`);
  return res.json();
}

export async function updateStatus(id, status) {
  const res = await fetch(`${API_BASE}/incidents/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
  return res.json();
}

export async function fetchKnowledgeBase() {
  const res = await fetch(`${API_BASE}/kb`);
  return res.json();
}

export async function simulateCommand(commandId, command) {
  const res = await fetch(`${API_BASE}/simulate-command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commandId, command })
  });
  return res.json();
}
