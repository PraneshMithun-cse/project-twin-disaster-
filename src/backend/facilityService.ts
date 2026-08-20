// ============================================================
// Facility Safety Blueprint Service
//
// Owns the in-memory registry of facilities, their blueprints,
// employee rosters (CSV / XLSX imported) and the fire-incident
// state machine that drives WhatsApp evacuation broadcasts.
// ============================================================

import {
  Facility,
  FacilityBlueprint,
  Employee,
  EmployeeImportResult,
  FacilityIncident,
  IncidentPhase,
  WhatsAppDispatch,
  DispatchStage,
  MusterHub,
  RescueArrival
} from '../shared/facilityTypes.js';
import { SAI_FIREWORKS_FACILITY, SAI_FIREWORKS_EMPLOYEES } from './facilityBlueprintSeed.js';
import { sendWhatsAppBatch, normalisePhone, getActiveProvider } from './whatsappService.js';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const facilities: Map<string, Facility> = new Map();
const employeesByFacility: Map<string, Employee[]> = new Map();
const incidents: Map<string, FacilityIncident> = new Map();
const dispatches: WhatsAppDispatch[] = [];

facilities.set(SAI_FIREWORKS_FACILITY.id, SAI_FIREWORKS_FACILITY);
employeesByFacility.set(SAI_FIREWORKS_FACILITY.id, [...SAI_FIREWORKS_EMPLOYEES]);

// Hydrate from Supabase on boot if connected
if (supabase) {
  (async () => {
    try {
      const { data } = await supabase.from('facilities').select('*');
      if (data && data.length > 0) {
        data.forEach((f: any) => {
          const fac: Facility = {
            id: f.id,
            name: f.name,
            industry: f.industry,
            address: f.address,
            lat: f.coordinates?.[0] || 13.08,
            lng: f.coordinates?.[1] || 80.27,
            licenceNo: f.licence_no,
            safetyOfficer: f.safety_officer,
            safetyOfficerPhone: f.safety_officer_phone,
            blueprint: f.blueprint_data || f.blueprint,
            createdAt: f.created_at
          };
          facilities.set(fac.id, fac);
        });
      }
    } catch (err: any) {
      console.warn('Supabase facilities hydration skipped:', err?.message || err);
    }
  })();
}

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// ------------------------------------------------------------
// Facility CRUD
// ------------------------------------------------------------

export function listFacilities(): Facility[] {
  return Array.from(facilities.values());
}

export function getFacility(id: string): Facility | undefined {
  return facilities.get(id);
}

const EMPTY_BLUEPRINT: FacilityBlueprint = {
  widthM: 240,
  heightM: 150,
  zones: [],
  sensors: [],
  hubs: [],
  routes: []
};

export function createFacility(input: Partial<Facility>): Facility {
  const facility: Facility = {
    id: input.id || uid('fac'),
    name: input.name || 'Untitled Facility',
    industry: input.industry || 'General Manufacturing',
    address: input.address || '',
    lat: typeof input.lat === 'number' ? input.lat : 13.0827,
    lng: typeof input.lng === 'number' ? input.lng : 80.2707,
    licenceNo: input.licenceNo,
    safetyOfficer: input.safetyOfficer,
    safetyOfficerPhone: input.safetyOfficerPhone,
    blueprint: input.blueprint || { ...EMPTY_BLUEPRINT, zones: [], sensors: [], hubs: [], routes: [] },
    createdAt: new Date().toISOString()
  };
  facilities.set(facility.id, facility);
  if (!employeesByFacility.has(facility.id)) employeesByFacility.set(facility.id, []);

  if (supabase) {
    supabase.from('facilities').upsert({
      id: facility.id,
      name: facility.name,
      industry: facility.industry,
      address: facility.address,
      coordinates: [facility.lat, facility.lng],
      licence_no: facility.licenceNo,
      safety_officer: facility.safetyOfficer || 'Safety Desk',
      safety_officer_phone: facility.safetyOfficerPhone || '+91 90000 00000',
      blueprint_width_m: facility.blueprint?.widthM || 240,
      blueprint_height_m: facility.blueprint?.heightM || 150,
      blueprint_data: facility.blueprint
    }).then(({ error }) => {
      if (error) console.warn('Supabase createFacility error:', error.message);
    });
  }

  return facility;
}

export function updateFacility(id: string, patch: Partial<Facility>): Facility | undefined {
  const existing = facilities.get(id);
  if (!existing) return undefined;
  const merged: Facility = { ...existing, ...patch, id: existing.id, createdAt: existing.createdAt };
  facilities.set(id, merged);

  if (supabase) {
    supabase.from('facilities').upsert({
      id: merged.id,
      name: merged.name,
      industry: merged.industry,
      address: merged.address,
      coordinates: [merged.lat, merged.lng],
      licence_no: merged.licenceNo,
      safety_officer: merged.safetyOfficer || 'Safety Desk',
      safety_officer_phone: merged.safetyOfficerPhone || '+91 90000 00000',
      blueprint_width_m: merged.blueprint?.widthM || 240,
      blueprint_height_m: merged.blueprint?.heightM || 150,
      blueprint_data: merged.blueprint
    }).then(({ error }) => {
      if (error) console.warn('Supabase updateFacility error:', error.message);
    });
  }

  return merged;
}

export function saveBlueprint(id: string, blueprint: FacilityBlueprint): Facility | undefined {
  const existing = facilities.get(id);
  if (!existing) return undefined;
  existing.blueprint = blueprint;
  facilities.set(id, existing);

  if (supabase) {
    supabase.from('facilities').update({
      blueprint_width_m: blueprint.widthM || 240,
      blueprint_height_m: blueprint.heightM || 150,
      blueprint_data: blueprint
    }).eq('id', id).then(({ error }) => {
      if (error) console.warn('Supabase saveBlueprint error:', error.message);
    });
  }

  return existing;
}

export function deleteFacility(id: string): boolean {
  employeesByFacility.delete(id);
  return facilities.delete(id);
}

// ------------------------------------------------------------
// Employee roster — CSV / XLSX import
// ------------------------------------------------------------

export function listEmployees(facilityId: string): Employee[] {
  return employeesByFacility.get(facilityId) || [];
}

export const EMPLOYEE_CSV_TEMPLATE = [
  'employee_code,name,phone,department,zone_id,role,shift,language,whatsapp_opt_in,emergency_contact',
  'SF101,K. Petchimuthu,+919443112201,Mixing,z-mixing-a,Mixing Operator,A,ta,yes,+919443119901',
  'SF102,J. Selvi,9443112207,Packing,z-packing,Packing Supervisor,general,ta,yes,',
  'SF103,B. Saravanan,+919443112211,Admin,z-admin,Plant Manager,general,en,yes,'
].join('\n');

/** Header aliases so a real-world HR export drops in without renaming columns. */
const HEADER_ALIASES: Record<string, string> = {
  employee_code: 'employee_code', employeecode: 'employee_code', empcode: 'employee_code',
  emp_code: 'employee_code', emp_no: 'employee_code', staff_id: 'employee_code', token_no: 'employee_code',
  emp_id: 'employee_code', employee_id: 'employee_code', code: 'employee_code', id: 'employee_code',
  name: 'name', employee_name: 'name', full_name: 'name', employeename: 'name',
  phone: 'phone', mobile: 'phone', phone_number: 'phone', mobile_number: 'phone',
  contact: 'phone', whatsapp: 'phone', whatsapp_number: 'phone', number: 'phone',
  contact_number: 'phone', ph_no: 'phone', cell: 'phone', mob: 'phone',
  department: 'department', dept: 'department', section: 'department',
  zone_id: 'zone_id', zone: 'zone_id', zoneid: 'zone_id', area: 'zone_id', location: 'zone_id',
  work_zone: 'zone_id', workarea: 'zone_id', work_area: 'zone_id', shed: 'zone_id',
  role: 'role', designation: 'role', job_title: 'role',
  shift: 'shift',
  language: 'language', lang: 'language', preferred_language: 'language',
  whatsapp_opt_in: 'whatsapp_opt_in', optin: 'whatsapp_opt_in', opt_in: 'whatsapp_opt_in', consent: 'whatsapp_opt_in',
  emergency_contact: 'emergency_contact', emergency: 'emergency_contact', kin_contact: 'emergency_contact'
};

const canonHeader = (raw: string) =>
  HEADER_ALIASES[String(raw).trim().toLowerCase().replace(/[\s.-]+/g, '_')] || '';

/** RFC-4180-ish CSV line splitter that honours quoted fields. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',' || ch === ';' || ch === '\t') {
      out.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map(v => v.trim());
}

function parseCsvToRows(text: string): Record<string, string>[] {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map(canonHeader);
  return lines.slice(1).map(line => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = { __raw: line };
    headers.forEach((h, i) => {
      if (h) row[h] = cells[i] ?? '';
    });
    return row;
  });
}

/** Decode an .xlsx/.xls upload. `xlsx` is loaded lazily so CSV import never pays for it. */
async function parseWorkbookToRows(base64: string): Promise<Record<string, string>[]> {
  const XLSX: any = await import('xlsx');
  const workbook = XLSX.read(Buffer.from(base64, 'base64'), { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });

  return raw.map(record => {
    const row: Record<string, string> = { __raw: JSON.stringify(record) };
    Object.entries(record).forEach(([key, value]) => {
      const canon = canonHeader(key);
      if (canon) row[canon] = String(value ?? '').trim();
    });
    return row;
  });
}

function rowToEmployee(
  row: Record<string, string>,
  facility: Facility,
  index: number
): { employee?: Employee; error?: string } {
  const name = row.name?.trim();
  const phoneRaw = row.phone?.trim();

  if (!name && !phoneRaw) return { error: 'Empty row — no name and no phone number' };
  if (!name) return { error: 'Missing employee name' };
  if (!phoneRaw) return { error: `Missing phone number for "${name}"` };

  const phone = normalisePhone(phoneRaw, process.env.DEFAULT_COUNTRY_CODE || '+91');
  if (!phone) return { error: `Unusable phone number "${phoneRaw}" for "${name}"` };

  // Accept either a zone id or a zone display name from the sheet.
  const zoneHint = (row.zone_id || '').trim().toLowerCase();
  const matchedZone =
    facility.blueprint.zones.find(z => z.id.toLowerCase() === zoneHint) ||
    facility.blueprint.zones.find(z => z.name.toLowerCase() === zoneHint) ||
    facility.blueprint.zones.find(z => zoneHint.length > 2 && z.name.toLowerCase().includes(zoneHint));

  const optInRaw = (row.whatsapp_opt_in || 'yes').trim().toLowerCase();
  const optIn = !['no', 'false', '0', 'n', 'opt-out', 'optout'].includes(optInRaw);

  const shiftRaw = (row.shift || 'general').trim().toUpperCase();
  const shift: Employee['shift'] = ['A', 'B', 'C'].includes(shiftRaw)
    ? (shiftRaw as 'A' | 'B' | 'C')
    : 'general';

  const langRaw = (row.language || 'en').trim().toLowerCase();
  const language: Employee['language'] = langRaw === 'ta' || langRaw === 'hi' ? langRaw : 'en';

  const code = row.employee_code?.trim() || `EMP${String(index + 1).padStart(3, '0')}`;

  return {
    employee: {
      id: `emp-${facility.id}-${code}`.toLowerCase().replace(/[^a-z0-9-]/g, ''),
      employeeCode: code,
      name,
      phone,
      department: row.department?.trim() || 'Unassigned',
      shift,
      zoneId: matchedZone?.id || facility.blueprint.zones[0]?.id || '',
      role: row.role?.trim() || 'Worker',
      language,
      whatsappOptIn: optIn,
      emergencyContact: row.emergency_contact?.trim() || undefined,
      importedAt: new Date().toISOString()
    }
  };
}

export async function importEmployees(
  facilityId: string,
  payload: { format: 'csv' | 'xlsx'; content: string; mode?: 'replace' | 'append' }
): Promise<EmployeeImportResult> {
  const facility = facilities.get(facilityId);
  if (!facility) throw new Error(`Facility ${facilityId} not found`);

  const rows =
    payload.format === 'xlsx'
      ? await parseWorkbookToRows(payload.content)
      : parseCsvToRows(payload.content);

  const errors: EmployeeImportResult['errors'] = [];
  const parsed: Employee[] = [];

  rows.forEach((row, index) => {
    const { employee, error } = rowToEmployee(row, facility, index);
    if (error) {
      errors.push({ row: index + 2, reason: error, raw: (row.__raw || '').slice(0, 160) });
      return;
    }
    if (employee) parsed.push(employee);
  });

  const existing = employeesByFacility.get(facilityId) || [];
  let next: Employee[];

  if (payload.mode === 'append') {
    const byPhone = new Map(existing.map(e => [e.phone, e]));
    parsed.forEach(e => byPhone.set(e.phone, e)); // Re-import of a phone updates that record.
    next = Array.from(byPhone.values());
  } else {
    next = parsed;
  }

  employeesByFacility.set(facilityId, next);

  return {
    imported: parsed.length,
    skipped: errors.length,
    total: rows.length,
    errors: errors.slice(0, 25),
    employees: next
  };
}

export function upsertEmployee(facilityId: string, input: Partial<Employee>): Employee {
  const list = employeesByFacility.get(facilityId) || [];
  const phone = normalisePhone(input.phone || '', process.env.DEFAULT_COUNTRY_CODE || '+91');
  if (!phone) throw new Error('A valid phone number with country code is required');

  const employee: Employee = {
    id: input.id || uid('emp'),
    employeeCode: input.employeeCode || `EMP${String(list.length + 1).padStart(3, '0')}`,
    name: input.name || 'Unnamed Employee',
    phone,
    department: input.department || 'Unassigned',
    shift: input.shift || 'general',
    zoneId: input.zoneId || '',
    role: input.role || 'Worker',
    language: input.language || 'en',
    whatsappOptIn: input.whatsappOptIn !== false,
    emergencyContact: input.emergencyContact,
    importedAt: new Date().toISOString()
  };

  const index = list.findIndex(e => e.id === employee.id || e.phone === employee.phone);
  if (index >= 0) list[index] = employee;
  else list.push(employee);

  employeesByFacility.set(facilityId, list);
  return employee;
}

export function deleteEmployee(facilityId: string, employeeId: string): boolean {
  const list = employeesByFacility.get(facilityId) || [];
  const next = list.filter(e => e.id !== employeeId);
  employeesByFacility.set(facilityId, next);
  return next.length !== list.length;
}

// ------------------------------------------------------------
// Message composition
// ------------------------------------------------------------

function hubFor(facility: Facility, zoneId: string): MusterHub | undefined {
  const route = facility.blueprint.routes.find(r => r.fromZoneId === zoneId && r.isPrimary)
    || facility.blueprint.routes.find(r => r.fromZoneId === zoneId);
  if (route) return facility.blueprint.hubs.find(h => h.id === route.toHubId);
  return facility.blueprint.hubs.find(h => h.isPrimary) || facility.blueprint.hubs[0];
}

function routeFor(facility: Facility, zoneId: string) {
  return facility.blueprint.routes.find(r => r.fromZoneId === zoneId && r.isPrimary)
    || facility.blueprint.routes.find(r => r.fromZoneId === zoneId);
}

const zoneName = (facility: Facility, zoneId: string) =>
  facility.blueprint.zones.find(z => z.id === zoneId)?.name || 'your work area';

export function composeEvacuateMessage(
  facility: Facility,
  incident: FacilityIncident,
  employee: Employee
): string {
  const hub = hubFor(facility, employee.zoneId);
  const route = routeFor(facility, employee.zoneId);
  const inFireZone = employee.zoneId === incident.zoneId;
  const prefix = incident.isDrill ? '🟠 *EVACUATION DRILL*' : '🚨 *FIRE EMERGENCY*';

  if (employee.language === 'ta') {
    return [
      `${prefix} — ${facility.name}`,
      '',
      `இடம்: ${incident.zoneName}`,
      `கண்டறிந்தது: ${incident.sensorName}`,
      inFireZone
        ? '⚠️ நீங்கள் தீ பரவும் பகுதியில் உள்ளீர்கள். உடனே வெளியேறுங்கள்.'
        : 'உடனடியாக வேலையை நிறுத்தி வெளியேறுங்கள்.',
      '',
      `➡️ செல்ல வேண்டிய இடம்: *${hub?.name || 'முதன்மை கூடும் இடம்'}*`,
      hub?.landmark ? `அடையாளம்: ${hub.landmark}` : null,
      route ? `வழி: ${route.name} (${route.distanceM} மீ)` : null,
      '',
      'லிஃப்ட் பயன்படுத்த வேண்டாம். பொருட்களை எடுக்க திரும்பி செல்ல வேண்டாம்.',
      `பாதுகாப்பு அதிகாரி: ${facility.safetyOfficer || '-'} ${facility.safetyOfficerPhone || ''}`,
      '',
      `கூடும் இடத்தை அடைந்ததும் *SAFE ${employee.employeeCode}* என பதில் அனுப்பவும்.`
    ].filter(line => line !== null).join('\n');
  }

  return [
    `${prefix} — ${facility.name}`,
    '',
    `Location: ${incident.zoneName}`,
    `Detected by: ${incident.sensorName} (${incident.triggerValue} above critical threshold)`,
    inFireZone
      ? '⚠️ YOU ARE IN THE AFFECTED ZONE. Leave immediately, do not shut down machines.'
      : 'Stop work and evacuate now.',
    '',
    `➡️ Go to: *${hub?.name || 'the primary assembly point'}*`,
    hub?.landmark ? `Landmark: ${hub.landmark}` : null,
    route ? `Route: ${route.name} — ${route.distanceM} m` : null,
    '',
    'Do not re-enter for belongings. Keep clear of the godown and mixing sheds.',
    `Safety Officer: ${facility.safetyOfficer || '-'} ${facility.safetyOfficerPhone || ''}`,
    '',
    `Reply *SAFE ${employee.employeeCode}* once you reach the assembly point.`
  ].filter(line => line !== null).join('\n');
}

export function composeMusterMessage(
  facility: Facility,
  incident: FacilityIncident,
  employee: Employee,
  rescue: RescueArrival
): string {
  const hub = facility.blueprint.hubs.find(h => h.id === rescue.hubId);
  const currentHub = hubFor(facility, employee.zoneId);
  const alreadyThere = currentHub?.id === rescue.hubId;

  if (employee.language === 'ta') {
    return [
      `🟢 *மீட்புக் குழு வந்துவிட்டது* — ${facility.name}`,
      '',
      `${rescue.teamName} — ${rescue.vehicleCount} வாகனங்கள் — ${hub?.name || ''} இடத்தில் நிலைகொண்டுள்ளது.`,
      '',
      alreadyThere
        ? '✅ நீங்கள் ஏற்கனவே அதே இடத்தில் இருக்கிறீர்கள். அங்கேயே இருங்கள், தலைஎண்ணிக்கைக்கு காத்திருங்கள்.'
        : `➡️ இப்போது *${hub?.name}* க்கு நகருங்கள். மீட்புக் குழு அங்கே உள்ளது.`,
      hub?.landmark ? `அடையாளம்: ${hub.landmark}` : null,
      '',
      `மீட்புக் குழு தொடர்பு: ${rescue.contactNumber}`,
      `அங்கு சென்றதும் *REACHED ${employee.employeeCode}* என பதில் அனுப்பவும்.`
    ].filter(line => line !== null).join('\n');
  }

  return [
    `🟢 *RESCUE TEAM ON SCENE* — ${facility.name}`,
    '',
    `${rescue.teamName} has arrived with ${rescue.vehicleCount} vehicle(s) and is staged at ${hub?.name || 'the assembly hub'}.`,
    '',
    alreadyThere
      ? '✅ You are already at that hub. Stay there and wait for headcount.'
      : `➡️ Move now to the hub where the rescue team is: *${hub?.name}*`,
    hub?.landmark ? `Landmark: ${hub.landmark}` : null,
    hub ? `Hub capacity: ${hub.capacity} persons · safe radius ${hub.safeRadiusM} m` : null,
    '',
    `Rescue contact: ${rescue.contactNumber}`,
    `Reply *REACHED ${employee.employeeCode}* when you are at the hub.`
  ].filter(line => line !== null).join('\n');
}

export function composeAllClearMessage(facility: Facility, incident: FacilityIncident, employee: Employee): string {
  if (employee.language === 'ta') {
    return [
      `✅ *ALL CLEAR* — ${facility.name}`,
      '',
      `${incident.zoneName} பகுதியில் ஏற்பட்ட தீ கட்டுக்குள் வந்துவிட்டது.`,
      'பாதுகாப்பு அதிகாரி அனுமதித்த பிறகே உள்ளே செல்லவும்.',
      'நன்றி — பாதுகாப்பாக இருந்ததற்கு.'
    ].join('\n');
  }
  return [
    `✅ *ALL CLEAR* — ${facility.name}`,
    '',
    `The incident in ${incident.zoneName} has been contained.`,
    'Do not re-enter any shed until the Safety Officer clears your zone in person.',
    'Thank you for following the evacuation plan.'
  ].join('\n');
}

// ------------------------------------------------------------
// Broadcast engine
// ------------------------------------------------------------

async function broadcast(
  facility: Facility,
  incident: FacilityIncident,
  stage: DispatchStage,
  compose: (employee: Employee) => string
) {
  const roster = listEmployees(facility.id).filter(e => e.whatsappOptIn);
  const provider = getActiveProvider();

  const messages = roster.map(employee => ({
    to: employee.phone,
    body: compose(employee),
    ref: employee.id
  }));

  const results = await sendWhatsAppBatch(messages);
  const sentAt = new Date().toISOString();

  const logged: WhatsAppDispatch[] = roster.map((employee, i) => {
    const result = results[employee.id];
    return {
      id: uid('wa'),
      incidentId: incident.id,
      facilityId: facility.id,
      stage,
      employeeId: employee.id,
      employeeName: employee.name,
      phone: employee.phone,
      body: messages[i].body,
      status: !result ? 'failed' : result.ok ? (result.provider === 'simulation' ? 'simulated' : 'sent') : 'failed',
      provider: result?.provider || provider,
      providerMessageId: result?.providerMessageId,
      error: result?.error,
      sentAt
    };
  });

  dispatches.unshift(...logged);
  return logged;
}

// ------------------------------------------------------------
// Incident state machine
// ------------------------------------------------------------

export function listIncidents(facilityId?: string): FacilityIncident[] {
  const all = Array.from(incidents.values()).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  return facilityId ? all.filter(i => i.facilityId === facilityId) : all;
}

export function getIncident(id: string): FacilityIncident | undefined {
  return incidents.get(id);
}

export function getActiveIncident(facilityId: string): FacilityIncident | undefined {
  return listIncidents(facilityId).find(i => i.phase !== 'resolved');
}

export function listDispatches(filter?: { facilityId?: string; incidentId?: string; limit?: number }) {
  let rows = dispatches;
  if (filter?.facilityId) rows = rows.filter(d => d.facilityId === filter.facilityId);
  if (filter?.incidentId) rows = rows.filter(d => d.incidentId === filter.incidentId);
  return rows.slice(0, filter?.limit ?? 300);
}

function pushTimeline(incident: FacilityIncident, phase: IncidentPhase, label: string, detail: string, actor: string) {
  incident.timeline.push({ at: new Date().toISOString(), phase, label, detail, actor });
}

/**
 * Stage 1 — a blueprint sensor fires. Creates the incident, flips the sensor
 * to `triggered`, and WhatsApps the whole roster with zone-specific egress.
 */
export async function triggerSensor(
  facilityId: string,
  sensorId: string,
  options: { isDrill?: boolean; triggerValue?: number; actor?: string } = {}
): Promise<{ incident: FacilityIncident; dispatches: WhatsAppDispatch[] }> {
  const facility = facilities.get(facilityId);
  if (!facility) throw new Error(`Facility ${facilityId} not found`);

  const sensor = facility.blueprint.sensors.find(s => s.id === sensorId);
  if (!sensor) throw new Error(`Sensor ${sensorId} not found on this blueprint`);

  const existing = getActiveIncident(facilityId);
  if (existing) {
    throw new Error(`Incident ${existing.id} is still open on this facility. Resolve it before triggering another.`);
  }

  const zone = facility.blueprint.zones.find(z => z.id === sensor.zoneId);
  const triggerValue = options.triggerValue ?? Math.round(sensor.thresholdCritical * 1.6 * 10) / 10;

  sensor.status = 'triggered';
  sensor.currentValue = triggerValue;
  sensor.lastUpdated = new Date().toISOString();

  const incident: FacilityIncident = {
    id: uid('inc'),
    facilityId,
    facilityName: facility.name,
    sensorId: sensor.id,
    sensorName: sensor.name,
    zoneId: sensor.zoneId,
    zoneName: zone?.name || 'Unknown zone',
    hazardClass: zone?.hazardClass || 'standard',
    type: options.isDrill ? 'drill' : sensor.type === 'gas_leak' ? 'gas_leak' : 'fire',
    severity: zone?.hazardClass === 'explosive' ? 'critical' : zone?.hazardClass === 'flammable' ? 'high' : 'medium',
    phase: 'detected',
    isDrill: !!options.isDrill,
    triggerValue,
    startedAt: new Date().toISOString(),
    timeline: [],
    acknowledgedEmployeeIds: [],
    headcountExpected: listEmployees(facilityId).filter(e => e.whatsappOptIn).length
  };

  pushTimeline(
    incident,
    'detected',
    'Sensor triggered',
    `${sensor.name} read ${triggerValue} ${sensor.unit} against a critical threshold of ${sensor.thresholdCritical} ${sensor.unit}.`,
    options.actor || 'IoT Fire Panel'
  );

  incidents.set(incident.id, incident);

  const sent = await broadcast(facility, incident, 'evacuate', emp =>
    composeEvacuateMessage(facility, incident, emp)
  );

  incident.phase = 'evacuating';
  pushTimeline(
    incident,
    'evacuating',
    'Evacuation broadcast sent',
    `WhatsApp evacuation instructions delivered to ${sent.length} employees with per-zone assembly hubs.`,
    'ResponSync WhatsApp Gateway'
  );

  return { incident, dispatches: sent };
}

/**
 * Stage 2 — rescue team physically reaches a hub on the blueprint. Everyone is
 * re-directed to that hub.
 */
export async function recordRescueArrival(
  incidentId: string,
  payload: { hubId: string; teamName?: string; vehicleCount?: number; contactNumber?: string; actor?: string }
): Promise<{ incident: FacilityIncident; dispatches: WhatsAppDispatch[] }> {
  const incident = incidents.get(incidentId);
  if (!incident) throw new Error(`Incident ${incidentId} not found`);
  if (incident.phase === 'resolved') throw new Error('This incident is already resolved');

  const facility = facilities.get(incident.facilityId);
  if (!facility) throw new Error('Facility for this incident no longer exists');

  const hub = facility.blueprint.hubs.find(h => h.id === payload.hubId);
  if (!hub) throw new Error(`Muster hub ${payload.hubId} not found on this blueprint`);

  const rescue: RescueArrival = {
    teamName: payload.teamName || 'Sivakasi Fire & Rescue Station',
    hubId: hub.id,
    hubName: hub.name,
    vehicleCount: payload.vehicleCount ?? 2,
    contactNumber: payload.contactNumber || '101',
    arrivedAt: new Date().toISOString()
  };

  incident.rescue = rescue;
  incident.phase = 'rescue_on_scene';
  pushTimeline(
    incident,
    'rescue_on_scene',
    'Rescue team on scene',
    `${rescue.teamName} staged at ${hub.name} with ${rescue.vehicleCount} vehicle(s).`,
    payload.actor || 'Incident Commander'
  );

  const sent = await broadcast(facility, incident, 'muster', emp =>
    composeMusterMessage(facility, incident, emp, rescue)
  );

  incident.phase = 'mustering';
  pushTimeline(
    incident,
    'mustering',
    'Consolidation broadcast sent',
    `${sent.length} employees told to move to ${hub.name} where the rescue team is positioned.`,
    'ResponSync WhatsApp Gateway'
  );

  return { incident, dispatches: sent };
}

export function acknowledgeEmployee(incidentId: string, employeeId: string): FacilityIncident {
  const incident = incidents.get(incidentId);
  if (!incident) throw new Error(`Incident ${incidentId} not found`);
  if (!incident.acknowledgedEmployeeIds.includes(employeeId)) {
    incident.acknowledgedEmployeeIds.push(employeeId);
  }
  return incident;
}

export async function resolveIncident(
  incidentId: string,
  options: { sendAllClear?: boolean; actor?: string } = {}
): Promise<{ incident: FacilityIncident; dispatches: WhatsAppDispatch[] }> {
  const incident = incidents.get(incidentId);
  if (!incident) throw new Error(`Incident ${incidentId} not found`);

  const facility = facilities.get(incident.facilityId);
  if (!facility) throw new Error('Facility for this incident no longer exists');

  let sent: WhatsAppDispatch[] = [];
  if (options.sendAllClear !== false) {
    sent = await broadcast(facility, incident, 'all_clear', emp =>
      composeAllClearMessage(facility, incident, emp)
    );
  }

  const sensor = facility.blueprint.sensors.find(s => s.id === incident.sensorId);
  if (sensor) {
    sensor.status = 'normal';
    sensor.currentValue = Math.round(sensor.thresholdCritical * 0.1 * 10) / 10;
    sensor.lastUpdated = new Date().toISOString();
  }

  incident.phase = 'resolved';
  incident.resolvedAt = new Date().toISOString();
  pushTimeline(
    incident,
    'resolved',
    'Incident closed',
    `All-clear ${options.sendAllClear === false ? 'suppressed' : `broadcast to ${sent.length} employees`}. Sensor reset to normal.`,
    options.actor || 'Incident Commander'
  );

  return { incident, dispatches: sent };
}

/** Fire a single test message to one employee so a plant can verify opt-in before a real event. */
export async function sendTestMessage(facilityId: string, employeeId: string) {
  const facility = facilities.get(facilityId);
  if (!facility) throw new Error(`Facility ${facilityId} not found`);

  const employee = listEmployees(facilityId).find(e => e.id === employeeId);
  if (!employee) throw new Error('Employee not found on this roster');

  const hub = hubFor(facility, employee.zoneId);
  const body = [
    `🧪 *ResponSync test message* — ${facility.name}`,
    '',
    `${employee.name}, your emergency WhatsApp number is registered.`,
    `Assigned area: ${zoneName(facility, employee.zoneId)}`,
    `Your assembly hub: ${hub?.name || 'primary assembly point'}`,
    '',
    'This is only a test. No action needed.'
  ].join('\n');

  const results = await sendWhatsAppBatch([{ to: employee.phone, body, ref: employee.id }]);
  const result = results[employee.id];

  const log: WhatsAppDispatch = {
    id: uid('wa'),
    incidentId: 'test',
    facilityId,
    stage: 'test',
    employeeId: employee.id,
    employeeName: employee.name,
    phone: employee.phone,
    body,
    status: result?.ok ? (result.provider === 'simulation' ? 'simulated' : 'sent') : 'failed',
    provider: result?.provider || getActiveProvider(),
    providerMessageId: result?.providerMessageId,
    error: result?.error,
    sentAt: new Date().toISOString()
  };
  dispatches.unshift(log);
  return log;
}

/** Roster coverage roll-up used by the readiness strip in the UI. */
export function getFacilityReadiness(facilityId: string) {
  const facility = facilities.get(facilityId);
  if (!facility) throw new Error(`Facility ${facilityId} not found`);
  const roster = listEmployees(facilityId);

  const zoneCoverage = facility.blueprint.zones
    .filter(z => z.kind !== 'corridor')
    .map(zone => ({
      zoneId: zone.id,
      zoneName: zone.name,
      hazardClass: zone.hazardClass,
      plannedHeadcount: zone.headcount,
      rosterCount: roster.filter(e => e.zoneId === zone.id).length,
      sensorCount: facility.blueprint.sensors.filter(s => s.zoneId === zone.id).length,
      hasEgressRoute: facility.blueprint.routes.some(r => r.fromZoneId === zone.id)
    }));

  return {
    facilityId,
    employeeCount: roster.length,
    reachableCount: roster.filter(e => e.whatsappOptIn).length,
    optedOutCount: roster.filter(e => !e.whatsappOptIn).length,
    zoneCount: facility.blueprint.zones.length,
    sensorCount: facility.blueprint.sensors.length,
    hubCount: facility.blueprint.hubs.length,
    routeCount: facility.blueprint.routes.length,
    zonesWithoutSensor: zoneCoverage.filter(z => z.sensorCount === 0 && z.plannedHeadcount > 0).map(z => z.zoneName),
    zonesWithoutRoute: zoneCoverage.filter(z => !z.hasEgressRoute && z.plannedHeadcount > 0).map(z => z.zoneName),
    zoneCoverage
  };
}
