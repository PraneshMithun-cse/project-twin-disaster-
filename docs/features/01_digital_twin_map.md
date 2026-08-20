# Feature 01: Digital Twin GIS Map & Live Telemetry

## 📌 Feature Overview
The **Digital Twin GIS Map** provides a real-time, interactive spatial representation of Chennai's flood-prone Velachery-Adyar corridor. It renders live atmospheric telemetry, estuarine water level gauges, active risk zones, emergency shelters, hospital trauma units, and dynamic hazard polylines.

---

## 🏗️ Architecture & Component Mapping
- **Frontend Component**: [DigitalTwinMap.tsx](file:///x:/Projects/response%20sync%202/src/components/DigitalTwinMap.tsx)
- **Map Renderer**: Leaflet + CartoDB Dark Matter tiles (High contrast GIS theme)
- **API Endpoints**: `GET /api/weather`, `GET /api/reports`, `GET /api/shelters`, `GET /api/resources`
- **Database Tables**: `risk_zones`, `shelters`, `hospitals`, `reports`

---

## 🧪 Manual Testing Instructions

### Step 1: Open the Digital Twin Map
1. Navigate to **http://localhost:3000** in your browser.
2. Click the **Digital Twin Map** tab on the top header navigation.

### Step 2: Test Weather Telemetry Card
1. Observe the **Live Atmospheric Telemetry** card on the top left.
2. Confirm live metrics display:
   - **Rainfall Rate**: $mm/hr$ (e.g. 85.0 mm/hr)
   - **Description**: Convective Heavy Cloudburst / Rainy
   - **High Tide Status**: Estuarine High Tide Active (Adyar River Mouth)

### Step 3: Test Interactive Map Markers & Layers
1. **Risk Zone Overlays**: Hover over the red/amber shaded polygons (Velachery South, Guindy Subway, Kotturpuram). Verify risk score badges ($88.5\%$, $94.0\%$) and status tags (`evacuating`, `submerged`).
2. **IoT Sensor Nodes**: Click any blue sensor node icon (e.g. *Velachery Lake Sluice Gauge*). Verify water depth reading (e.g. $+2.85m$) and trend arrow.
3. **Emergency Shelters**: Click any green building icon (e.g. *Velachery Community Center Relief Camp*). Verify capacity ($1,200$) and current occupancy ($480$).
4. **Citizen Reports**: Click any orange alert marker (e.g. *Ramesh Kumar's report*). Verify the uploaded image preview, AI validation credibility score ($96\%$), and description.

### Expected Outcome
The map renders smoothly with zero blank tiles, active hover tooltips, and real-time telemetry matching the backend REST APIs.
