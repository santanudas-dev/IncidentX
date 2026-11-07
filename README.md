# 🛡️ IncidentX – Autonomous IT Incident Response Agent

> **Autonomous AI agent that ingests distributed system logs, detects outages, correlates multi-service error cascades, isolates probable root causes, assigns severity, and generates actionable SRE runbooks.**

Built for high-stakes site reliability engineering (SRE) and devops triage during critical production outages.

---

## ⚡ Key Highlights

- **Multi-Format Ingestion**: Ingests unstructured logs, logfmt, Syslog, JSON (Array/NDJSON), and CSV formats via raw text or drag-and-drop file upload.
- **Modular 6-Stage Agent Pipeline**:
  1. **Log Parser**: Normalizes timestamps, log levels (CRITICAL, ERROR, WARN, INFO), service tags, and line numbers.
  2. **Error Classifier**: Identifies signatures and categorizes errors into Database, Memory/OOM, CPU/Thread, Auth/Security, Network/DNS, and API Timeouts.
  3. **Correlation Engine**: Reconstructs dependency graphs and traces the multi-service propagation chain back to the originating root trigger.
  4. **Severity Assessor**: Scores criticality (0–100) based on core service disruption, cascading breadth, and frequency.
  5. **Knowledge Base Retrieval**: Matches curated production runbooks with confidence scoring.
  6. **Report Synthesis**: Powered by **Gemini 3.8 Flash** with a transparent, fully functional **Deterministic Expert Engine fallback** (works 100% offline without an API key).
- **Zero-Hallucination Evidence Guarantee**: Strictly maps all report evidence directly to actual ingested log entries and exact line numbers. Never fabricates evidence.
- **Safe Runbook Diagnostics**: Executes non-destructive, read-only diagnostic dry-runs (e.g. active DB connection inspection, container memory stats) rather than executing dangerous destructive commands automatically.
- **Premium Dark Developer UI**: React + Vite + Tailwind CSS dashboard with sidebar navigation, live pipeline visualizer, interactive timeline, service health matrix, and log explorer.

---

## 🏗️ Architecture & Agent Workflow

```
       [Raw Logs (TXT / JSON / CSV)]
                    │
                    ▼
          ┌───────────────────┐
          │  1. Log Parser    │ ➔ Standardizes schema & assigns line indices
          └─────────┬─────────┘
                    ▼
          ┌───────────────────┐
          │2. Error Classifier│ ➔ Groups signatures & error domains
          └─────────┬─────────┘
                    ▼
          ┌───────────────────┐
          │  3. Correlation   │ ➔ Reconstructs multi-service cascade &
          │      Engine       │   isolates originating culprit service
          └─────────┬─────────┘
                    ▼
          ┌───────────────────┐
          │4. Severity Engine │ ➔ Computes criticality score & target SLA
          └─────────┬─────────┘
                    ▼
          ┌───────────────────┐
          │  5. KB Retrieval  │ ➔ Matches local SRE runbooks & playbooks
          └─────────┬─────────┘
                    ▼
     ┌─────────────────────────────┐
     │ 6. AI Synthesis (Gemini /   │ ➔ Validates evidence & generates
     │    Deterministic Fallback)  │   actionable remediation steps
     └──────────────┬──────────────┘
                    ▼
      [Standardized Incident Report & Runbook]
```

---

## 📦 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React
- **Backend**: Node.js, Express, Multer, Cors, Dotenv
- **AI Engine**: Google GenAI SDK (`@google/genai` with model `gemini-3.8-flash`) + Built-in Deterministic SRE Expert Engine
- **Storage**: In-memory + persistent store with pre-seeded demo incidents

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js >= 18 (Tested on Node v24)
- npm >= 9

### 1. Installation
Install all dependencies for root, server, and client:
```bash
npm run install:all
```
*(Or install inside `server` and `client` individually)*

### 2. Configure Environment (Optional)
Gemini is completely optional. The demo works out of the box using our deterministic engine.
If you have a Gemini API key:
```bash
# In server/.env
GEMINI_API_KEY=your_gemini_api_key_here
```
*(You can also set the API key directly in the UI via the "Configure Gemini" button in the navigation bar!)*

### 3. Run the Application
Start both the backend server (port 3001) and frontend dev server (port 5173) with a single command:
```bash
npm run dev
```

Open your browser at:
👉 **`http://localhost:5173`**

---

## 🧪 Built-in Test Scenarios (1-Click Presets)

The application includes 5 pre-configured production incident scenarios ready to test in the Agent Workspace:

1. **E-Commerce Checkout Failure (PostgreSQL Pool Exhaustion)**
   - *Format:* Text logs
   - *Flow:* `postgres-primary` pool reaches 100% -> `checkout-service` timeout acquiring connection -> `api-gateway` 503 HTTP spike -> Order drop.
2. **Kubernetes Payment Service OOMKilled & CrashLoop**
   - *Format:* JSON logs
   - *Flow:* `payment-batch-processor` heap memory exceeds 95% -> Linux kernel OOM killer SIGKILL (exit 137) -> Pod enters CrashLoopBackOff -> Gateway connection refused.
3. **Global Auth Blackout (Redis Session Cache OOM)**
   - *Format:* Text logs
   - *Flow:* `redis-session-cache` memory exhausted (`OOM command not allowed`) -> `auth-service` token validation failures -> 401 Unauthorized wave across all microservices.
4. **Internal DNS Resolution Failure (CoreDNS Timeout)**
   - *Format:* Syslog / Multi-service
   - *Flow:* CoreDNS UDP queue drops queries -> `order-service` and `shipping-service` fail with `EAI_AGAIN` -> Inter-service mesh partition.
5. **High CPU Overload & Event Loop Lag (Search ReDoS)**
   - *Format:* CSV logs
   - *Flow:* Catastrophic regex backtracking in search -> CPU 98.6% -> Event loop lag 12,450ms -> Gateway HTTP 504 Gateway Timeout.

---

## 🛡️ Safety & Reliability Principles

1. **No Invented Evidence**: The agent will never hallucinate or invent log lines, stack traces, or services that were not present in the ingested input.
2. **Safe Diagnostics Only**: In incident response, automatic destructive operations (like automated pod deletion or table dropping) can worsen an outage. IncidentX provides **interactive non-destructive dry-run checks** (e.g., connection status queries, pod inspection) that SREs can execute safely.
3. **Full Offline Fallback**: If network fails or no Gemini API key is configured, the deterministic expert rule engine executes seamlessly without crashing.

---

## 📜 License
MIT License. Built for the Hackathon.
