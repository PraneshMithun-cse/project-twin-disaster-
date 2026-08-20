export type DisasterType = 'flood' | 'cyclone' | 'earthquake' | 'wildfire' | 'landslide';

export type AgencyRole = 'authority' | 'fire_rescue' | 'police' | 'health_hospitals' | 'citizen';

export interface GeoLocation {
  lat: number;
  lng: number;
  name: string;
}

export interface ZoneRisk {
  id: string;
  name: string;
  coords: [number, number][]; // Polygon coordinates
  center: [number, number];
  riskScore: number; // 0 to 100
  confidenceScore: number; // 0 to 100
  priorityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  currentWaterLevelMeters: number;
  predictedWaterLevel30m: number;
  predictedWaterLevel1h: number;
  predictedWaterLevel2h: number;
  rainfallRateMmHr: number;
  drainageCongestionPct: number;
  populationAtRisk: number;
  estimatedTimeToInundationMin: number;
  status: 'safe' | 'monitoring' | 'warning' | 'evacuating' | 'submerged';
}

export interface IoTSensorNode {
  id: string;
  name: string;
  type: 'water_level' | 'rain_gauge' | 'flow_rate' | 'structural_strain';
  lat: number;
  lng: number;
  currentValue: number; // e.g. meters or mm/hr
  unit: string;
  thresholdWarning: number;
  thresholdCritical: number;
  batteryPct: number;
  signalPct: number;
  status: 'normal' | 'warning' | 'critical';
  lastUpdated: string;
}

export interface EmergencyResource {
  id: string;
  name: string;
  type: 'fire_truck' | 'ambulance' | 'rescue_boat' | 'ndrf_team' | 'police_patrol' | 'medical_unit' | 'relief_truck';
  lat: number;
  lng: number;
  assignedZoneId?: string;
  status: 'available' | 'en_route' | 'deployed' | 'maintenance';
  crewCount: number;
  fuelOrSuppliesPct: number;
  equipment: string[];
  contactNumber: string;
}

export interface EmergencyShelter {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  totalCapacity: number;
  currentOccupancy: number;
  foodSuppliesDays: number;
  medicalStaffPresent: boolean;
  powerBackup: boolean;
  status: 'open' | 'near_capacity' | 'full' | 'closed';
  contactPerson: string;
  phone: string;
}

export interface CitizenReport {
  id: string;
  reporterName: string;
  phone: string;
  timestamp: string;
  lat: number;
  lng: number;
  locationName: string;
  category: 'waterlogging' | 'trapped_citizens' | 'road_block' | 'medical_emergency' | 'power_outage' | 'infrastructure_damage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  imageUrl?: string;
  aiValidationScore: number; // 0 to 100
  aiValidatedCategory: string;
  aiSummary: string;
  status: 'pending' | 'verified' | 'dispatched' | 'resolved';
  assignedResourceId?: string;
}

export interface AgentActivityLog {
  id: string;
  agentName: 'Hydro-Risk Ingestion Agent' | 'Decision & Resource Agent' | 'Command & Dispatch Agent' | 'Weather Agent' | 'Traffic Agent' | 'Infrastructure Agent' | 'Citizen Intelligence Agent' | 'Satellite Agent' | 'Flood Prediction Agent' | 'Resource Planner Agent' | 'Evacuation Agent' | 'Simulation Agent' | 'Decision Agent' | 'Explainability Agent' | 'Coordinator Agent' | string;
  timestamp: string;
  action: string;
  details: string;
  severity: 'info' | 'warning' | 'alert' | 'success';
}

export interface ExplainableAIRecommendation {
  id: string;
  title: string;
  targetZoneId: string;
  targetZoneName: string;
  actionType: 'evacuate' | 'deploy_boats' | 'open_sluice_gate' | 'block_road' | 'setup_relief' | 'medical_dispatch';
  recommendedResources: { resourceType: string; quantity: number }[];
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  timestamp: string;
  reasoning: {
    coreReason: string;
    evidenceData: string[];
    confidencePct: number;
    supportingMetrics: { metric: string; value: string }[];
    riskExplanation: string;
    alternativeRisk: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'executed';
}

export interface SimulationParams {
  rainfallMmHr: number;
  chembarambakkamReleaseM3s: number;
  canalBlockagePct: number;
  bridgeStatus: 'open' | 'restricted' | 'closed';
  durationHours: number;
  highTideOverlap: boolean;
}

export interface SimulationResult {
  simulatedTime: string;
  affectedZonesCount: number;
  predictedSubmergedAreaKm2: number;
  estimatedAffectedPeople: number;
  criticalRoadBlocks: string[];
  recommendedDeployments: { type: string; count: number; zone: string }[];
  riskTimeline: { minute: number; floodedZones: number; maxWaterDepthMeters: number }[];
  aiSummary: string;
}

export interface EvacuationRoute {
  id: string;
  originName: string;
  destinationShelterName: string;
  distanceKm: number;
  estimatedTimeMinutes: number;
  safetyScorePct: number;
  waypoints: [number, number][];
  hazardsAvoided: string[];
  turnByTurnInstructions: string[];
}

export interface AutomatedAlert {
  id: string;
  timestamp: string;
  headline: string;
  zone: string;
  severity: 'info' | 'warning' | 'danger' | 'critical';
  agenciesNotified: string[];
  instructions: string;
  acknowledged: boolean;
}

export interface EmergencyHospital {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  totalCapacity: number; // Bed capacity
  occupiedCapacity: number;
  icuBedsTotal: number;
  icuBedsAvailable: number;
  status: 'normal' | 'near_capacity' | 'full';
  contactPerson: string;
  phone: string;
  hasTraumaCenter: boolean;
}
