// ============================================================
// Facility Safety Blueprint — Industrial Fire Response Module
// Shared type contracts used by both the Express backend and
// the React dashboard.
// ============================================================

export type FacilityZoneKind =
  | 'production'
  | 'storage'
  | 'chemical'
  | 'office'
  | 'utility'
  | 'open_yard'
  | 'corridor';

export type HazardClass = 'explosive' | 'flammable' | 'toxic' | 'standard';

export type BlueprintSensorType =
  | 'smoke'
  | 'heat'
  | 'flame'
  | 'gas_leak'
  | 'spark_detector'
  | 'manual_call_point';

export type SensorStatus = 'normal' | 'warning' | 'triggered' | 'offline';

/** A room / shed / yard drawn as an axis-aligned rectangle on the blueprint. */
export interface FacilityZone {
  id: string;
  name: string;
  kind: FacilityZoneKind;
  hazardClass: HazardClass;
  /** Blueprint-space rectangle. Units are metres from the plan origin (top-left). */
  x: number;
  y: number;
  w: number;
  h: number;
  headcount: number;
  notes?: string;
}

export interface BlueprintSensor {
  id: string;
  name: string;
  type: BlueprintSensorType;
  zoneId: string;
  x: number;
  y: number;
  status: SensorStatus;
  currentValue: number;
  unit: string;
  thresholdCritical: number;
  batteryPct: number;
  lastUpdated: string;
}

/** Safe assembly point. Rescue teams arrive at one of these. */
export interface MusterHub {
  id: string;
  name: string;
  x: number;
  y: number;
  capacity: number;
  safeRadiusM: number;
  isPrimary: boolean;
  landmark?: string;
}

/** Pre-computed egress path from a zone to a hub, drawn as a polyline. */
export interface ExitRoute {
  id: string;
  name: string;
  fromZoneId: string;
  toHubId: string;
  waypoints: { x: number; y: number }[];
  widthM: number;
  distanceM: number;
  isPrimary: boolean;
}

export interface FacilityBlueprint {
  /** Plan extents in metres — also the SVG viewBox size. */
  widthM: number;
  heightM: number;
  zones: FacilityZone[];
  sensors: BlueprintSensor[];
  hubs: MusterHub[];
  routes: ExitRoute[];
}

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  /** E.164 with country code, e.g. +919876543210 */
  phone: string;
  department: string;
  shift: 'A' | 'B' | 'C' | 'general';
  /** Zone the employee normally works in — drives per-zone headcount. */
  zoneId: string;
  role: string;
  language: 'en' | 'ta' | 'hi';
  whatsappOptIn: boolean;
  emergencyContact?: string;
  importedAt: string;
}

export interface Facility {
  id: string;
  name: string;
  industry: string;
  address: string;
  lat: number;
  lng: number;
  licenceNo?: string;
  safetyOfficer?: string;
  safetyOfficerPhone?: string;
  blueprint: FacilityBlueprint;
  createdAt: string;
}

export type IncidentPhase =
  | 'detected'
  | 'evacuating'
  | 'rescue_on_scene'
  | 'mustering'
  | 'resolved';

export interface IncidentTimelineEntry {
  at: string;
  phase: IncidentPhase;
  label: string;
  detail: string;
  actor: string;
}

export interface RescueArrival {
  teamName: string;
  hubId: string;
  hubName: string;
  vehicleCount: number;
  contactNumber: string;
  arrivedAt: string;
}

export interface FacilityIncident {
  id: string;
  facilityId: string;
  facilityName: string;
  sensorId: string;
  sensorName: string;
  zoneId: string;
  zoneName: string;
  hazardClass: HazardClass;
  type: 'fire' | 'explosion' | 'gas_leak' | 'drill';
  severity: 'critical' | 'high' | 'medium';
  phase: IncidentPhase;
  isDrill: boolean;
  triggerValue: number;
  startedAt: string;
  resolvedAt?: string;
  rescue?: RescueArrival;
  timeline: IncidentTimelineEntry[];
  /** Employee ids that confirmed they reached the assembly point. */
  acknowledgedEmployeeIds: string[];
  headcountExpected: number;
}

export type DispatchStage = 'evacuate' | 'muster' | 'all_clear' | 'test';

export type DispatchStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'simulated';

export interface WhatsAppDispatch {
  id: string;
  incidentId: string;
  facilityId: string;
  stage: DispatchStage;
  employeeId: string;
  employeeName: string;
  phone: string;
  body: string;
  status: DispatchStatus;
  provider: 'meta_cloud' | 'twilio' | 'simulation';
  providerMessageId?: string;
  error?: string;
  sentAt: string;
}

export interface EmployeeImportResult {
  imported: number;
  skipped: number;
  total: number;
  errors: { row: number; reason: string; raw: string }[];
  employees: Employee[];
}
