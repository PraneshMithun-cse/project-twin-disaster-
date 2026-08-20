# Feature 03: What-If Disaster Simulation Studio

## 📌 Feature Overview
The **Simulation Studio** enables disaster commanders to run parameterized "What-If" flood projections. By adjusting rainfall intensity, Chembarambakkam dam discharge, canal blockage percentage, bridge statuses, and estuarine high-tide overlap, commanders can simulate hydrodynamic flood spread before executing real-world evacuations.

---

## 🏗️ Architecture & Component Mapping
- **Frontend Component**: [SimulationStudio.tsx](file:///x:/Projects/response%20sync%202/src/components/SimulationStudio.tsx)
- **API Endpoint**: `POST /api/ai/simulate`
- **Database Table**: `simulations`

---

## 🧪 Manual Testing Instructions

### Step 1: Open Simulation Studio
1. Click the **Simulation Studio** tab on the top header navigation.
2. Ensure the sub-tab **What-If Sandbox** is selected.

### Step 2: Adjust Disaster Parameters
1. Drag the **Rainfall Intensity** slider to `130 mm/hr`.
2. Drag the **Chembarambakkam Dam Discharge** slider to `2,200 m³/s`.
3. Set **Canal / Silt Blockage** to `85%`.
4. Toggle **High Tide Overlap** to `YES`.

### Step 3: Run Hydrodynamic Simulation
1. Click the purple button **`Run Hydrodynamic Simulation`**.
2. Wait for the simulation engine response (`POST /api/ai/simulate`).

### Step 4: Verify Projected Results
1. Confirm the output panel displays:
   - **Simulated Horizon**: `+3 Hours Scenario`
   - **Submerged Area**: e.g., $5.8\text{ km}^2$
   - **Affected Population**: e.g., $82,000\text{ citizens}$
   - **Submerged Road Corridors**: Guindy Railway Subway ($2.2m$ depth), Velachery 100ft Road Vijaya Nagar Junction.
   - **Recommended Pre-deployments**: 8 Rescue Boat Units, 12 Dewatering Pumps.

### Expected Outcome
Changing parameter sliders dynamically re-runs the simulation model, updating risk projections, submerged road warnings, and recommended fleet pre-positioning.
