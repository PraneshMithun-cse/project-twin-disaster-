# Implementation Plan: Dynamic Flood-Aware Evacuation Planner

## 📌 Goal Overview
Upgrade ResponSync's Evacuation Planner from static mock waypoints to a true **Dynamic Flood-Aware Routing Engine** that dynamically computes safe street-level polyline routes avoiding active flood inundation zones, submerged subways, and citizen hazard reports.

---

## 🎯 Proposed Architecture & Solution (Option C: Gemini AI + Turf.js Spatial Routing)

1. **New Backend Endpoint**: `POST /api/ai/evacuation-route` in [server.ts](file:///x:/Projects/response%20sync%202/server.ts):
   - Ingests `originCoords` [lat, lng], `destinationShelterId`, `activeHazardReports`, and `submergedZones`.
   - **Evacuation Planner Agent** (Gemini 3.6 Flash) generates intermediate safe GPS waypoints avoiding blocked subways (e.g. Guindy Subway) and waterlogged junctions.
   - Calculates real **Safety Score Percentage** ($0-100\%$) and explicit list of **Hazards Avoided**.

2. **Frontend Integration**:
   - Update [CitizenPortal.tsx](file:///x:/Projects/response%20sync%202/src/components/CitizenPortal.tsx): Add **User Origin Selector** (e.g., "Velachery 100ft Road", "Guindy Station", "Taramani Link", or Custom GPS).
   - Update [DigitalTwinMap.tsx](file:///x:/Projects/response%20sync%202/src/components/DigitalTwinMap.tsx): Render dynamic animated green evacuation path polylines with hazard avoidance callouts and turn-by-turn safety direction steps.
   - Update [App.tsx](file:///x:/Projects/response%20sync%202/src/App.tsx): Store dynamic `evacuationRoute` state returned from backend API.

---

## 📋 Task Breakdown

### Phase 1: Backend Dynamic Routing Service ([server.ts](file:///x:/Projects/response%20sync%202/server.ts))
- Add `/api/ai/evacuation-route` endpoint.
- Ingest live hazard points (citizen reports + risk zones).
- Compute dynamic intermediate waypoints detour polylines.
- Return structured route JSON (`waypoints`, `safetyScorePct`, `hazardsAvoided`, `totalDistanceKm`, `estimatedTimeMins`, `turnByTurnInstructions`).

### Phase 2: Citizen Portal Interactive Origin & Route Finder ([CitizenPortal.tsx](file:///x:/Projects/response%20sync%202/src/components/CitizenPortal.tsx))
- Add origin selection dropdown / click-on-map starting point.
- Connect shelter selection to trigger `/api/ai/evacuation-route`.
- Display dynamic safety metrics, distance, estimated travel time, and turn-by-turn safe directions.

### Phase 3: Digital Twin Map Dynamic Path Rendering ([DigitalTwinMap.tsx](file:///x:/Projects/response%20sync%202/src/components/DigitalTwinMap.tsx))
- Draw dynamic animated green polyline route on Leaflet map.
- Highlight avoided red flood zones along the path with alert badges.

---

## 🧪 Verification Plan

### Automated Checks
- `npm run lint` - verify zero TypeScript errors.

### Manual Verification
1. Open **Citizen Emergency Portal**.
2. Change starting location from "Velachery 100ft Road" to "Guindy Railway Station".
3. Select "Velachery Community Center Relief Camp".
4. Verify the routing engine calculates a safe detour path around Guindy Subway, returning $96\%+$ safety score and turn-by-turn hazard avoidance steps.
