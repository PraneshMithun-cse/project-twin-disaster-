# Feature 06: Citizen Emergency & Evacuation Portal

## 📌 Feature Overview
The **Citizen Emergency Portal** empowers residents in the Velachery/Adyar disaster zone. It features one-click SOS hazard reporting with photo uploads, automated AI credibility scoring, public safety alert broadcasts, and dynamic safe evacuation routing to the nearest relief camp.

---

## 🏗️ Architecture & Component Mapping
- **Frontend Component**: [CitizenPortal.tsx](file:///x:/Projects/response%20sync%202/src/components/CitizenPortal.tsx)
- **API Endpoint**: `POST /api/reports`, `GET /api/reports`, `GET /api/evacuation`
- **Database Table**: `reports`, `shelters`, `evacuation_routes`

---

## 🧪 Manual Testing Instructions

### Step 1: Open Citizen Portal
1. Click the **Citizen Emergency Portal** tab on the top header navigation.

### Step 2: Test SOS Hazard Report Submission
1. Fill in the **Report Hazard** form:
   - **Your Name**: `Siddharth Roy`
   - **Phone**: `+91 98765 43210`
   - **Location**: `Velachery 100ft Road near Vijaya Nagar Junction`
   - **Hazard Category**: `Waterlogging`
   - **Severity**: `CRITICAL`
   - **Description**: `Water level reached 3ft on ground floor. Multiple vehicles submerged.`
2. Click **`Submit Emergency Report`**.
3. Verify:
   - Form submits to `POST /api/reports`.
   - Feedback card displays AI Credibility Score (e.g. $94\%$).
   - Report instantly appears under **Recent Community Reports** list.

### Step 3: Test Dynamic Evacuation Routing
1. Scroll to the **Find Nearest Safe Relief Shelter** section.
2. Select a shelter (e.g., *Velachery Community Center Relief Camp*).
3. Verify:
   - **Safety Score**: $98\%$
   - **Hazards Avoided**: `Guindy Railway Subway`, `Velachery Lake Sluice Breach Zone`
   - **Waypoints**: Rerouted around submerged subway low points.

### Expected Outcome
Citizen reports are posted to Supabase, verified with AI credibility scores, and evacuation routing directs citizens around active flood hazards.
