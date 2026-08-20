---
type: project
created: 2026-07-24
updated: 2026-07-24
---

# ResponSync: Feature Set & System Architecture Guide

> **MANDATORY MAINTENANCE PROTOCOL:**
> Whenever a new feature is added, modified, or refactored in ResponSync, the AI agent MUST update this document to reflect the new feature's specifications, data flows, API endpoints, data models, and operation rules.

---

## Executive Overview

ResponSync is an AI-powered Decision Digital Twin for predictive disaster response. It combines continuous environmental data ingestion, parameterized disaster simulation, a Decision Knowledge Base, vector/scenario similarity matching, and multi-agent AI recommendations to transform emergency management from reactive to predictive.

---

## Core Feature Modules & How They Work

### 1. Digital Twin Engine (City State & Geospatial Mapping)
* **Goal**: Maintain real-time spatial state of critical urban infrastructure in the pilot area (Velachery, Chennai).
* **Tracked Entities**:
  * **Risk Zones**: Polygons defining flood/disaster risk areas (`RiskZone` model & schema).
  * **Shelters**: Emergency shelter locations, capacity, and current occupancy (`Shelter` model & schema).
  * **Hospitals**: Medical facility locations, bed capacity, ICU availability (`Hospital` model & schema).
  * **Evacuation Routes**: LineString geometries with risk levels and road status (`EvacuationRoute` model & schema).
* **Data Flow**:
  1. Base GIS layers (OpenStreetMap, PostGIS spatial tables) store static geometry.
  2. Scheduled polling & crowdsourced reports dynamically update shelter occupancy, hospital beds, and road blockages.
  3. GeoJSON endpoints expose feature collections to Mapbox GL on the frontend.

---

### 2. Weather & Hydrology Service
* **Goal**: Ingest, cache, and analyze real-time meteorological and hydrological data.
* **Inputs**: Rainfall, wind speed, humidity, river levels, dam storage, and discharge rates.
* **Integrations**: OpenWeatherMap API, IMD, Government GIS.
* **Data Flow**:
  1. Background service periodically polls weather APIs and caches readings in `weather_cache`.
  2. Weather service calculates flood threat metrics based on cumulative rainfall & dam discharge rates.
  3. Provides live environmental context to the Risk Engine and Simulation Engine.

---

### 3. Citizen Reporting & Crowdsourced Intelligence
* **Goal**: Enable citizens to submit localized disaster incidents with geo-coordinates, photos, and severity ratings.
* **Models**: `CitizenReport` (Category, Severity, GeoJSON Point location, Media URLs, Verification Status).
* **Data Flow**:
  1. Citizen submits report via Citizen Dashboard (`POST /reports`).
  2. API validates data with Pydantic v2 `ReportCreate` schema.
  3. Event pushed to WebSockets / Supabase Realtime for live rendering on Authority Dashboard.
  4. Citizen Intelligence AI Agent verifies and correlates report cluster with weather/hydrology data.

---

### 4. Disaster Simulation Engine
* **Goal**: Run parameterized disaster scenarios to model disaster progression and evaluate response strategies prior to or during emergencies.
* **Parameters**: Rainfall rate, dam release volume, river level, population density, shelter capacity, traffic congestion.
* **Outputs**: Flood spread contour, resource bottleneck warnings, evacuation route safety ratings, effectiveness score.
* **Models**: `Simulation` and `SimulationResult`.
* **Data Flow**:
  1. User triggers simulation (`POST /simulate`) with custom parameters.
  2. Simulation Engine runs flood dispersion models and resource utilization math.
  3. Results are saved to `simulation_results` and fed into the Decision Knowledge Base.

---

### 5. Decision Knowledge Base
* **Goal**: Build institutional disaster response memory by storing every simulated scenario alongside evaluated actions and outcomes.
* **Models**: `DecisionKnowledge` (Scenario hash, input vector, chosen actions, effectiveness score, AI confidence, lessons learned).
* **How It Works**:
  1. Every simulation result is normalized and archived as a historical decision vector.
  2. Maintains a library of response strategies (e.g., "Open Shelter B when River Level exceeds 4.2m").
  3. Serves as the ground truth training set for scenario matching.

---

### 6. Scenario Matching Engine
* **Goal**: During a live disaster, match current environmental conditions with past simulations to recommend the best pre-validated strategy.
* **Process**:
  1. **Input Normalization**: Ingest live weather, dam status, traffic, and citizen reports into a normalized feature vector.
  2. **Similarity Search**: Compute cosine/vector similarity between live state and Decision Knowledge Base scenarios.
  3. **Top-K Retrieval**: Retrieve top K (e.g., K=3) most similar historical scenarios with highest effectiveness scores.
  4. **AI Refinement**: Pass matched scenarios to the Recommendation Engine for live adaptation.

---

### 7. AI Recommendation & Multi-Agent Intelligence
* **Goal**: Generate actionable, explainable emergency response plans and advisories using Gemini 2.5 Flash and LangGraph.
* **Agent Architecture**:
  * **Coordinator Agent**: Manages agent workflow and synthesizes final recommendations.
  * **Weather & Hydrology Agents**: Analyze current & forecast environmental threats.
  * **Citizen Intelligence Agent**: Filters and verifies report clusters.
  * **Risk Assessment Agent**: Evaluates flood propagation.
  * **Resource & Evacuation Planners**: Optimize resource dispatch and routing.
  * **Explainability Agent**: Generates clear, human-readable rationale for authorities.
* **How It Works**:
  1. LangGraph graph orchestrates agent execution.
  2. Gemini 2.5 Flash processes top-matched scenarios + live context.
  3. Produces situation summary, prioritized action items, resource allocations, and public advisories with confidence scores.

---

### 8. Dynamic Evacuation & Resource Optimization
* **Goal**: Route citizens to safety and dispatch emergency assets (boats, ambulances, food supplies) efficiently.
* **Models**: `Resource`, `Shelter`, `EvacuationRoute`.
* **How It Works**:
  1. Spatial algorithms calculate shortest safe path avoiding high-risk flood polygons.
  2. Resource Planner balances shelter occupancies against proximity and incoming evacuees.
  3. Route statuses are updated dynamically on map overlays.

---

### 9. Authority & Citizen Dashboards
* **Goal**: User interfaces for command center decisions and public alerts.
* **Authority Dashboard**: Live Digital Twin map, simulation controls, AI recommendation feeds, resource dispatch panel.
* **Citizen Dashboard**: Live flood risk heatmap, safe evacuation routes, nearest shelter locator, citizen report submission.
* **Tech**: React, TypeScript, Mapbox GL, Tailwind CSS.

---

## Feature Creation & Update Standard Operating Procedure (SOP)

When developing a new feature or extending an existing one:

1. **Schema & Model Definition**:
   * Add SQLAlchemy model in `backend/app/models/`.
   * Add Pydantic schema in `backend/app/schemas/`.
   * Export in respective `__init__.py`.

2. **API Endpoint Implementation**:
   * Implement router in `backend/app/api/v1/endpoints/`.
   * Register router in `backend/app/api/v1/router.py`.

3. **Service Logic**:
   * Implement business logic in `backend/app/services/`.

4. **Documentation Sync (MANDATORY)**:
   * **Update this file** (`.agents/memory/feature-set.md`) with the new module description, inputs/outputs, model relations, and workflow.
   * Update `ResponSync_PRD.md` or `ResponSync_TDD.md` if high-level scope changes.
