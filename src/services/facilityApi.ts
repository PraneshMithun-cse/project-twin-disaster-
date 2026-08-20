import {
  Facility,
  FacilityBlueprint,
  Employee,
  EmployeeImportResult,
  FacilityIncident,
  WhatsAppDispatch
} from '../shared/facilityTypes';

const API_BASE = '/api/facility';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail?.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export interface WhatsAppProviderStatus {
  provider: 'meta_cloud' | 'twilio' | 'simulation';
  live: boolean;
  metaConfigured: boolean;
  twilioConfigured: boolean;
  note: string;
}

export interface FacilityReadiness {
  facilityId: string;
  employeeCount: number;
  reachableCount: number;
  optedOutCount: number;
  zoneCount: number;
  sensorCount: number;
  hubCount: number;
  routeCount: number;
  zonesWithoutSensor: string[];
  zonesWithoutRoute: string[];
  zoneCoverage: {
    zoneId: string;
    zoneName: string;
    hazardClass: string;
    plannedHeadcount: number;
    rosterCount: number;
    sensorCount: number;
    hasEgressRoute: boolean;
  }[];
}

export const fetchProviderStatus = () => request<WhatsAppProviderStatus>('/provider-status');

export const fetchFacilities = () => request<Facility[]>('');

export const fetchFacility = (id: string) => request<Facility>(`/${id}`);

export const createFacility = (payload: Partial<Facility>) =>
  request<Facility>('', { method: 'POST', body: JSON.stringify(payload) });

export const updateFacility = (id: string, payload: Partial<Facility>) =>
  request<Facility>(`/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });

export const deleteFacility = (id: string) =>
  request<{ success: boolean }>(`/${id}`, { method: 'DELETE' });

export const saveBlueprint = (id: string, blueprint: FacilityBlueprint) =>
  request<Facility>(`/${id}/blueprint`, { method: 'PUT', body: JSON.stringify(blueprint) });

export const fetchReadiness = (id: string) => request<FacilityReadiness>(`/${id}/readiness`);

export const fetchEmployees = (id: string) => request<Employee[]>(`/${id}/employees`);

export const saveEmployee = (id: string, payload: Partial<Employee>) =>
  request<Employee>(`/${id}/employees`, { method: 'POST', body: JSON.stringify(payload) });

export const removeEmployee = (id: string, employeeId: string) =>
  request<{ success: boolean }>(`/${id}/employees/${employeeId}`, { method: 'DELETE' });

export const importEmployees = (
  id: string,
  payload: { format: 'csv' | 'xlsx'; content: string; mode: 'replace' | 'append' }
) => request<EmployeeImportResult>(`/${id}/employees/import`, { method: 'POST', body: JSON.stringify(payload) });

export const sendTestMessage = (id: string, employeeId: string) =>
  request<WhatsAppDispatch>(`/${id}/employees/${employeeId}/test-message`, { method: 'POST', body: '{}' });

export const fetchIncidents = (id: string) => request<FacilityIncident[]>(`/${id}/incidents`);

export const fetchActiveIncident = (id: string) =>
  request<FacilityIncident | null>(`/${id}/incidents/active`);

export const fetchDispatches = (id: string, limit = 300) =>
  request<WhatsAppDispatch[]>(`/${id}/dispatches?limit=${limit}`);

export const triggerSensor = (
  id: string,
  sensorId: string,
  payload: { isDrill?: boolean; triggerValue?: number; actor?: string } = {}
) =>
  request<{ incident: FacilityIncident; dispatches: WhatsAppDispatch[]; notified: number }>(
    `/${id}/sensors/${sensorId}/trigger`,
    { method: 'POST', body: JSON.stringify(payload) }
  );

export const recordRescueArrival = (
  incidentId: string,
  payload: { hubId: string; teamName?: string; vehicleCount?: number; contactNumber?: string; actor?: string }
) =>
  request<{ incident: FacilityIncident; dispatches: WhatsAppDispatch[]; notified: number }>(
    `/incidents/${incidentId}/rescue-arrival`,
    { method: 'POST', body: JSON.stringify(payload) }
  );

export const acknowledgeEmployee = (incidentId: string, employeeId: string) =>
  request<FacilityIncident>(`/incidents/${incidentId}/acknowledge`, {
    method: 'POST',
    body: JSON.stringify({ employeeId })
  });

export const resolveIncident = (incidentId: string, sendAllClear = true) =>
  request<{ incident: FacilityIncident; dispatches: WhatsAppDispatch[] }>(
    `/incidents/${incidentId}/resolve`,
    { method: 'POST', body: JSON.stringify({ sendAllClear }) }
  );

export const employeeTemplateUrl = `${API_BASE}/employee-template.csv`;
