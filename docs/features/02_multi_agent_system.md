# Feature 02: 3-Agent AI System & Authority HQ Dispatch

## 📌 Feature Overview
The **3-Agent AI System** coordinates emergency response operations for Authority HQ. It executes an autonomous reasoning pipeline across 3 specialized agents:
1. **Hydro-Risk Ingestion Agent**: Ingests live Open-Meteo weather radar, river discharge, IoT depth sensors, and citizen SOS calls to calculate inundation probabilities.
2. **Decision & Resource Agent**: Performs vector similarity matching against historical disaster incidents in Supabase, formulates fleet allocation, and plans safe evacuation detours.
3. **Command & Dispatch Agent**: Synthesizes Explainable AI (XAI) confidence scores, formats broadcast alerts, and emits dispatch orders.

---

## 🏗️ Architecture & Component Mapping
- **Frontend Component**: [AuthorityDashboard.tsx](file:///x:/downloads/responsesync/src/dashboard/components/AuthorityDashboard.tsx)
- **Header Component**: [Header.tsx](file:///x:/downloads/responsesync/src/dashboard/components/Header.tsx)
- **API Endpoint**: `POST /api/ai/multiagent-run`
- **AI Model**: Google Gemini (`gemini-2.5-flash`)
- **Telemetry Ingest**: Open-Meteo Weather API + Open-Meteo Flood API + Supabase Reports DB

---

## 🧪 Manual Testing Instructions

### Step 1: Trigger Manual Agent Synchronization
1. On the top header, click the cyan button **`Sync AI Multi-Agent System`**.
2. Observe the spinning loading indicator indicating live telemetry ingestion from Open-Meteo & Supabase.

### Step 2: Verify Agent Activity Logs
1. Click the **Authority HQ** tab.
2. Scroll to the **Live AI Agent Logs & Activity Stream**.
3. Verify new log entries appear from:
   - **Hydro-Risk Ingestion Agent**: Open-Meteo rainfall rate & river discharge ($m^3/s$) evaluation
   - **Decision & Resource Agent**: Historical disaster matching & fleet routing
   - **Command & Dispatch Agent**: XAI justification synthesis & multi-agency alert broadcast

### Step 3: Test Recommendation Approval & Fleet Dispatch
1. Locate the top recommendation card (e.g., *"Deploy 4 NDRF Boat Units to Velachery South"*).
2. Click **`Approve & Dispatch Fleet`**.
3. Verify:
   - Recommendation status updates to **APPROVED** (green checkmark).
   - Decision & Resource Agent emits a success log entry.
   - Available boat fleet count updates automatically.

### Expected Outcome
The 3 agents process live telemetry, update risk predictions, output actionable recommendations, and reflect fleet dispatches instantly across Authority HQ.
