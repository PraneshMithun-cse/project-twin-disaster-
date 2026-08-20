# Feature 08: Real-Time Server-Sent Events (SSE) Broadcast Engine

## 📌 Feature Overview
The **Real-Time Server-Sent Events (SSE) Broadcast Engine** enables instant, zero-latency push notifications from the Express server to all connected browser clients. When a citizen submits an SOS report on mobile or IoT sensors detect a rapid water level spike, an SSE event (`citizen_report_created`) is broadcasted, triggering an instant toast banner and map beacon without requiring manual page refresh or interval polling.

---

## 🏗️ Architecture & Component Mapping
- **Backend Service**: [server.ts](file:///x:/Projects/response%20sync%202/server.ts) (`GET /api/events` SSE stream)
- **Frontend Subscriber**: [App.tsx](file:///x:/Projects/response%20sync%202/src/App.tsx) (`EventSource('/api/events')`)
- **Event Payload Schema**:
  ```json
  {
    "type": "citizen_report_created",
    "timestamp": "2026-07-24T14:07:00.000Z",
    "data": {
      "id": "rep-1721829000",
      "reporterName": "Live Citizen",
      "locationName": "Guindy Subway Choke Point",
      "hazardType": "road_submerged",
      "severity": "critical"
    }
  }
  ```

---

## 🧪 Manual Testing Instructions

### Step 1: Open the Application Dashboard
1. Open **http://localhost:3000** in your browser.
2. Open the Browser Developer Console (`F12` $\rightarrow$ *Console* tab).
3. Verify connection: The console shows active `EventSource` connection to `/api/events`.

### Step 2: Submit a Hazard Report in Citizen Portal
1. Click the **Citizen Emergency Portal** tab.
2. Fill out and submit a new hazard report (e.g. *Waterlogging at Guindy Subway*).

### Step 3: Observe Real-Time Live Broadcast
1. Switch immediately to **Digital Twin Map** or **Authority HQ**.
2. Verify:
   - A critical alert toast appears: `🚨 REAL-TIME SOS INTAKE: Guindy Subway`.
   - The Citizen Intelligence Agent emits an instant SSE log entry.
   - The hazard marker flashes live on the Leaflet map without reloading the page (`F5`).

---

## 🎯 Key Benefits
- Zero WebSocket connection setup overhead.
- Instant, multi-device sync across Authority HQ and Citizen views.
- Fully integrated with Supabase persistent storage.
