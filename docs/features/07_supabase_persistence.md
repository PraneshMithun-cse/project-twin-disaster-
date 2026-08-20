# Feature 07: Supabase Cloud Database & Data Persistence

## 📌 Feature Overview
The **Supabase Cloud Database Layer** provides real-time persistent storage across PostgreSQL tables (`reports`, `risk_zones`, `shelters`, `resources`, `decision_knowledge`, `simulations`, `hospitals`). It features automatic in-memory fallback for high availability.

---

## 🏗️ Architecture & Component Mapping
- **Backend Service**: [server.ts](file:///x:/Projects/response%20sync%202/server.ts)
- **Database Script**: [supabase_schema.sql](file:///x:/Projects/response%20sync%202/supabase_schema.sql)
- **Populator Script**: [scripts/populate_db.ts](file:///x:/Projects/response%20sync%202/scripts/populate_db.ts)
- **Inspector Script**: [scripts/check_supabase.ts](file:///x:/Projects/response%20sync%202/scripts/check_supabase.ts)

---

## 🧪 Manual Testing Instructions

### Step 1: Inspect Live Supabase Tables
1. Open a terminal in the project directory.
2. Run the database inspector command:
   ```bash
   npx tsx scripts/check_supabase.ts
   ```
3. Verify output returns active row counts:
   - `reports`: 2 rows
   - `risk_zones`: 4 rows
   - `shelters`: 3 rows
   - `resources`: 4 rows
   - `decision_knowledge`: 3 rows

### Step 2: Test Report Persistence Across Page Reloads
1. Go to **Citizen Emergency Portal** in your browser (`http://localhost:3000`).
2. Submit a new report (e.g. *"Submerged vehicle at Vijaya Nagar"*).
3. Refresh the browser page (`F5`).
4. Switch to **Digital Twin Map** or **Citizen Portal**.
5. Verify the report remains visible after page refresh (retrieved from `GET /api/reports` via Supabase).

### Expected Outcome
Data persists reliably in Supabase PostgreSQL tables and reloads seamlessly across browser sessions and server restarts.
