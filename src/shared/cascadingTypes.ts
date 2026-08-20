export type AssetCategory = 
  | 'Roads'
  | 'Bridges'
  | 'Hospitals'
  | 'Shelters'
  | 'Fire Stations'
  | 'Police Stations'
  | 'Power Stations'
  | 'Water Supply'
  | 'Communication Towers'
  | 'Emergency Resources'
  | 'Flood Zones'
  | 'Drainage Networks';

export type AssetStatus = 'OPERATIONAL' | 'AT_RISK' | 'DISRUPTED' | 'FAILED' | 'CRITICAL';

export type DependencyType = 
  | 'power_supply'
  | 'access_route'
  | 'flood_inundation'
  | 'traffic_choke'
  | 'telecom_backbone'
  | 'water_drainage'
  | 'resource_dispatch';

export type CascadeLevel = 'PRIMARY' | 'SECONDARY' | 'TERTIARY';

export interface InfrastructureNode {
  id: string;
  name: string;
  category: AssetCategory;
  lat: number;
  lng: number;
  status: AssetStatus;
  healthPct: number; // 0 to 100
  failureProbability: number; // 0 to 100
  criticalityScore: number; // 0 to 100
  capacity: string;
  currentLoad: string;
  zoneName: string;
  timeToFailureMin?: number;
  dependenciesCount: number;
  description: string;
}

export interface DependencyEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  dependencyType: DependencyType;
  impactWeight: number; // 0.1 to 1.0
  description: string;
}

export interface CascadingImpactPrediction {
  id: string;
  sourceAssetId: string;
  sourceAssetName: string;
  targetAssetId: string;
  targetAssetName: string;
  cascadeLevel: CascadeLevel;
  estimatedTimeMin: number;
  impactSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidenceScore: number; // 0-100%
  criticalityScore: number; // 0-100
  geographicArea: string;
  affectedInfrastructure: string[];
  recommendedPriority: 'P1 - Immediate Intervention' | 'P2 - High Watch' | 'P3 - Contingency Standby';
  explanation: string;
  timestamp: string;
}

export interface StrategyMetrics {
  responseTimeMins: number;
  evacuationEfficiencyPct: number;
  resourceUtilizationPct: number;
  populationCoveragePct: number;
  estimatedCasualties: number;
  infrastructureProtectionPct: number;
  operationalCostScore: number; // 0-100 (lower is better)
  overallScore: number; // 0-100
}

export interface ResponseStrategy {
  id: string;
  name: string;
  code: 'strategy_a' | 'strategy_b' | 'strategy_c' | 'strategy_d';
  tagline: string;
  description: string;
  primaryFocus: string;
  metrics: StrategyMetrics;
  actions: { action: string; target: string; resourcesAssigned: string }[];
  tradeoffs: { pros: string[]; cons: string[] };
  rank: number;
  isOptimal: boolean;
}

export interface WhatIfParameters {
  rainfallIncreasePct: number;
  damDischargeRateM3s: number;
  closedBridges: string[];
  disabledHospitals: string[];
  disabledPowerStations: string[];
  populationSurgeFactor: number;
  activeDisasterType: 'flood' | 'cyclone' | 'earthquake' | 'wildfire' | 'landslide' | 'tsunami';
  customNotes?: string;
}

export interface TimeIntervalForecast {
  timeInterval: '0m' | '30m' | '1h' | '3h' | '6h' | '12h' | '24h';
  label: string;
  floodedAreaSqKm: number;
  failedAssetsCount: number;
  hospitalStressPct: number;
  shelterOccupancyPct: number;
  trafficCongestionIndex: number;
  atRiskPopulation: number;
  criticalNodes: { id: string; name: string; status: AssetStatus; healthPct: number }[];
  activeCascadesCount: number;
  summary: string;
}

export interface ExplainableDecisionReport {
  id: string;
  timestamp: string;
  summary: string;
  rootCauses: string[];
  chainReactionDescription: string;
  strategyRecommendationJustification: string;
  keyTradeoffAnalysis: string;
  preventativeActionItems: string[];
  confidenceRatingPct: number;
}
