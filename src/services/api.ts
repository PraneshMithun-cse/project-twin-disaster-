import { ZoneRisk, CitizenReport, EmergencyShelter, EmergencyResource, ExplainableAIRecommendation, SimulationResult } from '../shared/types';

const API_BASE = '/api';

export async function fetchHealthStatus() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchWeather() {
  const res = await fetch(`${API_BASE}/weather`);
  if (!res.ok) throw new Error('Failed to fetch weather data');
  return res.json();
}

export async function fetchRiskZones(): Promise<ZoneRisk[]> {
  const res = await fetch(`${API_BASE}/risk`);
  if (!res.ok) throw new Error('Failed to fetch risk zones');
  return res.json();
}

export async function fetchResources(): Promise<EmergencyResource[]> {
  const res = await fetch(`${API_BASE}/resources`);
  if (!res.ok) throw new Error('Failed to fetch emergency resources');
  return res.json();
}

export async function fetchShelters(): Promise<EmergencyShelter[]> {
  const res = await fetch(`${API_BASE}/shelters`);
  if (!res.ok) throw new Error('Failed to fetch shelters');
  return res.json();
}

export async function fetchCitizenReports(): Promise<CitizenReport[]> {
  const res = await fetch(`${API_BASE}/reports`);
  if (!res.ok) throw new Error('Failed to fetch citizen reports');
  return res.json();
}

export async function fetchRecommendations(): Promise<ExplainableAIRecommendation[]> {
  const res = await fetch(`${API_BASE}/recommendations`);
  if (!res.ok) throw new Error('Failed to fetch AI recommendations');
  return res.json();
}

export async function fetchDecisionKnowledge() {
  const res = await fetch(`${API_BASE}/decision-knowledge`);
  if (!res.ok) throw new Error('Failed to fetch decision knowledge');
  return res.json();
}

export async function fetchSimulations(): Promise<SimulationResult[]> {
  const res = await fetch(`${API_BASE}/simulations`);
  if (!res.ok) throw new Error('Failed to fetch simulations');
  return res.json();
}

export async function submitCitizenReport(report: Partial<CitizenReport>): Promise<CitizenReport> {
  const res = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report)
  });
  if (!res.ok) throw new Error('Failed to submit report');
  return res.json();
}

export async function runMultiAgentPipeline(payload: {
  zones?: ZoneRisk[];
  sensors?: any[];
  reports?: CitizenReport[];
  weatherCondition?: any;
  preset?: 'normal' | 'moderate' | 'flood';
}) {
  const res = await fetch(`${API_BASE}/ai/multiagent-run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to run multiagent pipeline');
  return res.json();
}

export async function runScenarioMatch(payload: {
  currentConditions: {
    rainfallMmHr: number;
    damDischargeM3s: number;
    highTideOverlap: boolean;
  };
}) {
  const res = await fetch(`${API_BASE}/ai/scenario-match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to match historical scenarios');
  return res.json();
}

export async function calculateEvacuationRoute(payload: {
  origin: [number, number];
  destination: [number, number];
  shelterId?: string;
  travelMode?: 'driving' | 'walking';
}) {
  const res = await fetch(`${API_BASE}/ai/evacuation-route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to calculate evacuation route');
  return res.json();
}
