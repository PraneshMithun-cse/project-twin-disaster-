# Feature 04: Scenario Matching Engine & Decision Knowledge Base

## 📌 Feature Overview
The **Scenario Matching Engine** compares live disaster telemetry against a Decision Knowledge Base of historical Chennai flood events (December 2015 Cloudburst, November 2021 Cyclone Nivar, December 2023 Cyclone Michaung). It retrieves Top-K effective strategies and applies Gemini AI refinements for today's emergency.

---

## 🏗️ Architecture & Component Mapping
- **Frontend Component**: [SimulationStudio.tsx](file:///x:/Projects/response%20sync%202/src/components/SimulationStudio.tsx) (Sub-tab: *Knowledge Base Matcher*)
- **API Endpoint**: `POST /api/ai/scenario-match`, `GET /api/decision-knowledge`
- **Database Table**: `decision_knowledge`

---

## 🧪 Manual Testing Instructions

### Step 1: Open Knowledge Base Matcher
1. Navigate to **Simulation Studio**.
2. Click the sub-tab **Decision Knowledge Base**.

### Step 2: Run Scenario Similarity Search
1. Click the button **`Search Historical Knowledge Base`**.
2. Wait for the Scenario Matching Engine (`POST /api/ai/scenario-match`).

### Step 3: Verify Matched Scenarios & AI Refinements
1. Inspect the retrieved historical match cards:
   - **December 2015 Cloudburst & Chembarambakkam Release**: Similarity $94\%$. Key matches: 85mm/hr rain, High tide backwater.
   - **November 2021 Cyclone Nivar Waterlogging**: Similarity $86\%$. Key matches: Adyar catchment rain, 80% silt blockage.
2. Verify **AI Refinement Summary**:
   - *"Apply 2015 pre-evacuation protocol to Vijaya Nagar, but add automated subway barricading at Guindy to avoid vehicular stalling."*

### Expected Outcome
The engine correctly matches current conditions against past historical flood vectors stored in Supabase, displaying similarity percentages and actionable AI refinements.
