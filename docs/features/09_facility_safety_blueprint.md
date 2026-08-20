# Facility Safety Blueprint & WhatsApp Evacuation

Multi-tenant industrial fire-response module. A plant (seeded example: **Sai Fireworks
Manufacturing Unit**, Sivakasi) is modelled as a floor-plan blueprint with zones, fire
detectors, muster hubs and egress routes. When a detector trips, every employee on the
imported roster is WhatsApped with their zone-specific escape route. When the rescue team
physically reaches a hub, everyone is re-directed to that hub.

**Dashboard route:** `http://localhost:3000/facility` (sidebar → *Dispatch & Relief → Facility Blueprint*)

## Flow

| Stage | Trigger | What employees receive |
|---|---|---|
| 1. Detection | Sensor trips (Alert Console button, or double-click a detector on the plan) | 🚨 Fire location, their nearest assembly hub, route name + distance, landmark, safety officer number |
| 2. Rescue on scene | Commander picks the hub the rescue team staged at | 🟢 "Move now to the hub where the rescue team is" + landmark, capacity, rescue contact |
| 3. All clear | Incident resolved | ✅ Contained, do not re-enter until the Safety Officer clears the zone |

Messages are rendered per employee in English or Tamil (`language` column) and carry a
reply token (`SAFE <code>` / `REACHED <code>`) for headcount reconciliation.

## Employee roster import

Upload `.csv`, `.xlsx` or `.xls` on the **Employees** tab. Headers are matched loosely, so a
raw HR export usually drops in unchanged:

- name ← `name`, `employee_name`, `full_name`
- phone ← `phone`, `mobile`, `whatsapp`, `whatsapp_number`, `contact_number`, `cell`
- code ← `employee_code`, `emp_id`, `emp_code`, `staff_id`, `token_no`
- zone ← `zone_id`, `zone`, `work_zone`, `shed`, `area` — accepts a zone id **or** its display name

Bare 10-digit numbers are normalised to E.164 using `DEFAULT_COUNTRY_CODE` (default `+91`).
Unparseable rows are reported back with the row number and reason instead of failing the import.
Template: `GET /api/facility/employee-template.csv`.

## WhatsApp delivery

`src/backend/whatsappService.ts` picks a provider from the environment:

1. **Meta WhatsApp Cloud API** — `WHATSAPP_CLOUD_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID`
2. **Twilio WhatsApp** — `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_WHATSAPP_FROM`
3. **Simulation** (no credentials) — messages are composed, logged and shown in the dispatch
   log exactly as they would be sent, but nothing leaves the machine.

Broadcasts fan out with a concurrency cap of 8.

## API surface

```
GET    /api/facility                                   list facilities
POST   /api/facility                                   create facility
GET    /api/facility/:id                               facility + blueprint
PUT    /api/facility/:id/blueprint                     save blueprint
GET    /api/facility/:id/readiness                     coverage audit
GET    /api/facility/:id/employees                     roster
POST   /api/facility/:id/employees                     add / update one
POST   /api/facility/:id/employees/import              CSV text or base64 XLSX
POST   /api/facility/:id/employees/:empId/test-message send a test WhatsApp
POST   /api/facility/:id/sensors/:sensorId/trigger     STAGE 1 — fire detected
POST   /api/facility/incidents/:id/rescue-arrival      STAGE 2 — redirect to rescue hub
POST   /api/facility/incidents/:id/acknowledge         mark an employee safe
POST   /api/facility/incidents/:id/resolve             STAGE 3 — all clear
GET    /api/facility/:id/dispatches                    WhatsApp dispatch log
GET    /api/facility/provider-status                   live vs simulation
```

Every stage also fans out over the existing SSE stream (`/api/events`) as
`facility_incident_triggered`, `facility_rescue_arrived`, `facility_incident_resolved`.

## Files

- `src/shared/facilityTypes.ts` — shared contracts
- `src/backend/facilityBlueprintSeed.ts` — Sai Fireworks plan + starter roster
- `src/backend/facilityService.ts` — store, CSV/XLSX parsing, incident state machine, message templates
- `src/backend/whatsappService.ts` — provider gateway
- `src/services/facilityApi.ts` — typed client
- `src/dashboard/components/FacilitySafetyStudio.tsx` — container (Blueprint / Employees / Alert Console / Readiness)
- `src/dashboard/components/facility/BlueprintCanvas.tsx` — SVG plan editor and live incident overlay
- `src/dashboard/components/facility/EmployeeRosterPanel.tsx` — roster import + table
- `src/dashboard/components/facility/AlertConsole.tsx` — sensor grid, rescue arrival, headcount, dispatch log

State is in-memory, consistent with the rest of the backend's fallback stores — a server
restart resets facilities to the seeded plan.
