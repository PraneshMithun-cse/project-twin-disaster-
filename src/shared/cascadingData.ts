import {
  InfrastructureNode,
  DependencyEdge,
  CascadingImpactPrediction,
  ResponseStrategy,
  WhatIfParameters,
  TimeIntervalForecast,
  ExplainableDecisionReport
} from './cascadingTypes';

export const INITIAL_INFRASTRUCTURE_NODES: InfrastructureNode[] = [
  {
    id: 'node-pwr-1',
    name: 'Velachery 110kV Main Substation',
    category: 'Power Stations',
    lat: 12.9782,
    lng: 80.2215,
    status: 'AT_RISK',
    healthPct: 42,
    failureProbability: 78,
    criticalityScore: 94,
    capacity: '110 kV / 45 MW',
    currentLoad: '88% Capacity',
    zoneName: 'Velachery South',
    timeToFailureMin: 35,
    dependenciesCount: 4,
    description: 'Main power distribution node feeding Velachery hospitals, telecom exchanges, and dewatering pumps.'
  },
  {
    id: 'node-pwr-2',
    name: 'Guindy Grid Substation',
    category: 'Power Stations',
    lat: 13.0075,
    lng: 80.2130,
    status: 'OPERATIONAL',
    healthPct: 88,
    failureProbability: 22,
    criticalityScore: 89,
    capacity: '220 kV / 90 MW',
    currentLoad: '62% Capacity',
    zoneName: 'Guindy Sector',
    timeToFailureMin: 180,
    dependenciesCount: 5,
    description: 'Primary power grid station serving Guindy industrial area and regional hospital complexes.'
  },
  {
    id: 'node-hosp-1',
    name: 'Velachery Apollo Specialty Hospital',
    category: 'Hospitals',
    lat: 12.9765,
    lng: 80.2240,
    status: 'AT_RISK',
    healthPct: 58,
    failureProbability: 64,
    criticalityScore: 98,
    capacity: '320 Beds (48 ICU)',
    currentLoad: '92% Occupied (42 ICU in use)',
    zoneName: 'Velachery South',
    timeToFailureMin: 45,
    dependenciesCount: 3,
    description: 'Tier-1 Trauma Center with ventilator ICU patients dependent on continuous Grid Power & road access.'
  },
  {
    id: 'node-hosp-2',
    name: 'Guindy Multi-Specialty Govt Hospital',
    category: 'Hospitals',
    lat: 13.0085,
    lng: 80.2105,
    status: 'OPERATIONAL',
    healthPct: 91,
    failureProbability: 15,
    criticalityScore: 92,
    capacity: '500 Beds (80 ICU)',
    currentLoad: '68% Occupied',
    zoneName: 'Guindy Sector',
    dependenciesCount: 4,
    description: 'Regional trauma center with high ICU capacity and standby emergency generators.'
  },
  {
    id: 'node-rd-1',
    name: 'Velachery Bypass Flyover Arterial',
    category: 'Bridges',
    lat: 12.9810,
    lng: 80.2225,
    status: 'OPERATIONAL',
    healthPct: 82,
    failureProbability: 25,
    criticalityScore: 86,
    capacity: '4,500 Veh/Hr',
    currentLoad: '3,800 Veh/Hr (Congested)',
    zoneName: 'Velachery Bypass',
    dependenciesCount: 3,
    description: 'Elevated bypass route connecting Velachery to OMR. Vital for high-ground evacuation.'
  },
  {
    id: 'node-rd-2',
    name: 'Guindy Railway Subway Corridor',
    category: 'Roads',
    lat: 13.0067,
    lng: 80.2117,
    status: 'FAILED',
    healthPct: 0,
    failureProbability: 100,
    criticalityScore: 95,
    capacity: 'Submerged (1.8m Water)',
    currentLoad: 'Blocked',
    zoneName: 'Guindy Subway',
    timeToFailureMin: 0,
    dependenciesCount: 4,
    description: 'Critical underground vehicular passage currently flooded under 1.8m water, halting transit.'
  },
  {
    id: 'node-rd-3',
    name: 'Inner Ring Road Grid Junction',
    category: 'Roads',
    lat: 12.9980,
    lng: 80.2160,
    status: 'DISRUPTED',
    healthPct: 35,
    failureProbability: 82,
    criticalityScore: 91,
    capacity: '6,000 Veh/Hr',
    currentLoad: '5,900 Veh/Hr (Gridlock)',
    zoneName: 'Guindy Junction',
    timeToFailureMin: 20,
    dependenciesCount: 5,
    description: 'Major transit intersection clogged due to traffic rerouted from the flooded Guindy Subway.'
  },
  {
    id: 'node-sh-1',
    name: 'Velachery Corp Higher Sec School Shelter',
    category: 'Shelters',
    lat: 12.9805,
    lng: 80.2250,
    status: 'OPERATIONAL',
    healthPct: 85,
    failureProbability: 20,
    criticalityScore: 84,
    capacity: '800 Evacuees',
    currentLoad: '540 Occupied (67%)',
    zoneName: 'Velachery North',
    dependenciesCount: 2,
    description: 'Designated high-ground relief shelter with food stocks, clean water, and medical station.'
  },
  {
    id: 'node-fps-1',
    name: 'Guindy Central Fire & Rescue Station',
    category: 'Fire Stations',
    lat: 13.0040,
    lng: 80.2145,
    status: 'AT_RISK',
    healthPct: 62,
    failureProbability: 55,
    criticalityScore: 88,
    capacity: '8 Fire Tenders / 4 Motorboats',
    currentLoad: '6 Fleet Deployed',
    zoneName: 'Guindy Sector',
    timeToFailureMin: 50,
    dependenciesCount: 3,
    description: 'First-responder command station experiencing road blockage delays during emergency dispatches.'
  },
  {
    id: 'node-wat-1',
    name: 'Velachery Lake Sluice Drainage Outfall',
    category: 'Drainage Networks',
    lat: 12.9740,
    lng: 80.2190,
    status: 'CRITICAL',
    healthPct: 15,
    failureProbability: 95,
    criticalityScore: 97,
    capacity: '120 m³/s Flow Rate',
    currentLoad: '165% Over Capacity (Clogged)',
    zoneName: 'Velachery Lake Basin',
    timeToFailureMin: 10,
    dependenciesCount: 6,
    description: 'Primary stormwater drainage channel overflowing due to plastic debris obstruction and high tide.'
  },
  {
    id: 'node-com-1',
    name: 'Velachery BSNL Fiber Master Exchange',
    category: 'Communication Towers',
    lat: 12.9790,
    lng: 80.2230,
    status: 'AT_RISK',
    healthPct: 48,
    failureProbability: 72,
    criticalityScore: 90,
    capacity: '50,000 Lines / 5G Tower',
    currentLoad: 'Backup Battery Active (2.5 hrs)',
    zoneName: 'Velachery Central',
    timeToFailureMin: 40,
    dependenciesCount: 3,
    description: 'Telecommunication core node powering emergency broadcast networks and citizen 112 dispatching.'
  },
  {
    id: 'node-fz-1',
    name: 'Velachery South Inundation Sector',
    category: 'Flood Zones',
    lat: 12.9785,
    lng: 80.2205,
    status: 'CRITICAL',
    healthPct: 10,
    failureProbability: 98,
    criticalityScore: 99,
    capacity: 'Risk Area 3.2 sq km',
    currentLoad: 'Water Depth 1.45m',
    zoneName: 'Velachery South',
    dependenciesCount: 7,
    description: 'Low-lying residential density area experiencing rapid water rise from sluice overflow.'
  }
];

export const INITIAL_DEPENDENCY_EDGES: DependencyEdge[] = [
  {
    id: 'edge-1',
    sourceNodeId: 'node-wat-1',
    targetNodeId: 'node-fz-1',
    dependencyType: 'water_drainage',
    impactWeight: 0.95,
    description: 'Sluice outfall overflow directly floods Velachery South Inundation Sector.'
  },
  {
    id: 'edge-2',
    sourceNodeId: 'node-fz-1',
    targetNodeId: 'node-rd-2',
    dependencyType: 'flood_inundation',
    impactWeight: 0.90,
    description: 'Floodwaters submerge the low-lying Guindy Railway Subway Road passage.'
  },
  {
    id: 'edge-3',
    sourceNodeId: 'node-fz-1',
    targetNodeId: 'node-pwr-1',
    dependencyType: 'flood_inundation',
    impactWeight: 0.85,
    description: 'Water accumulation encroaches upon the Velachery 110kV Substation basement transformers.'
  },
  {
    id: 'edge-4',
    sourceNodeId: 'node-pwr-1',
    targetNodeId: 'node-hosp-1',
    dependencyType: 'power_supply',
    impactWeight: 0.92,
    description: 'Substation shutdown forces Velachery Apollo Hospital onto diesel generator emergency backups.'
  },
  {
    id: 'edge-5',
    sourceNodeId: 'node-pwr-1',
    targetNodeId: 'node-com-1',
    dependencyType: 'power_supply',
    impactWeight: 0.88,
    description: 'Substation failure triggers BSNL Telecom Exchange onto 2.5-hour battery standby.'
  },
  {
    id: 'edge-6',
    sourceNodeId: 'node-rd-2',
    targetNodeId: 'node-rd-3',
    dependencyType: 'traffic_choke',
    impactWeight: 0.94,
    description: 'Subway closure diverts 3,800 vehicles/hr onto Inner Ring Road Junction causing severe gridlock.'
  },
  {
    id: 'edge-7',
    sourceNodeId: 'node-rd-3',
    targetNodeId: 'node-hosp-2',
    dependencyType: 'access_route',
    impactWeight: 0.80,
    description: 'Inner Ring Road gridlock increases ambulance transit delay to Guindy Govt Hospital by 38 mins.'
  },
  {
    id: 'edge-8',
    sourceNodeId: 'node-rd-3',
    targetNodeId: 'node-fps-1',
    dependencyType: 'resource_dispatch',
    impactWeight: 0.82,
    description: 'Fire tenders and rescue boats delayed from departing Guindy Central Station due to traffic congestion.'
  },
  {
    id: 'edge-9',
    sourceNodeId: 'node-hosp-1',
    targetNodeId: 'node-sh-1',
    dependencyType: 'resource_dispatch',
    impactWeight: 0.70,
    description: 'Medical staff triage overflow from Apollo Hospital redirects non-critical patients to School Shelter.'
  }
];

export const INITIAL_CASCADING_PREDICTIONS: CascadingImpactPrediction[] = [
  {
    id: 'casc-1',
    sourceAssetId: 'node-wat-1',
    sourceAssetName: 'Velachery Lake Sluice Drainage Outfall',
    targetAssetId: 'node-pwr-1',
    targetAssetName: 'Velachery 110kV Main Substation',
    cascadeLevel: 'PRIMARY',
    estimatedTimeMin: 35,
    impactSeverity: 'CRITICAL',
    confidenceScore: 94,
    criticalityScore: 96,
    geographicArea: 'Velachery South',
    affectedInfrastructure: ['Substation Basement', 'Feeder Lines 4 & 7', 'Transformer 2'],
    recommendedPriority: 'P1 - Immediate Intervention',
    explanation: 'Sluice drainage congestion at 165% capacity causes floodwaters to breach Substation bunds within 35 minutes, tripping main switches.',
    timestamp: '11:42 AM'
  },
  {
    id: 'casc-2',
    sourceAssetId: 'node-pwr-1',
    sourceAssetName: 'Velachery 110kV Main Substation',
    targetAssetId: 'node-hosp-1',
    targetAssetName: 'Velachery Apollo Specialty Hospital',
    cascadeLevel: 'SECONDARY',
    estimatedTimeMin: 45,
    impactSeverity: 'CRITICAL',
    confidenceScore: 91,
    criticalityScore: 98,
    geographicArea: 'Velachery Central',
    affectedInfrastructure: ['Hospital Grid Feed', 'ICU Ventilators (42 Active)', 'Central Oxygen Pump'],
    recommendedPriority: 'P1 - Immediate Intervention',
    explanation: 'Tripped substation cuts main power feed. Hospital will shift to generator backup; diesel supply limited to 4 hours under high ICU load.',
    timestamp: '11:43 AM'
  },
  {
    id: 'casc-3',
    sourceAssetId: 'node-rd-2',
    sourceAssetName: 'Guindy Railway Subway Corridor',
    targetAssetId: 'node-rd-3',
    targetAssetName: 'Inner Ring Road Grid Junction',
    cascadeLevel: 'PRIMARY',
    estimatedTimeMin: 15,
    impactSeverity: 'HIGH',
    confidenceScore: 96,
    criticalityScore: 89,
    geographicArea: 'Guindy - Velachery Connector',
    affectedInfrastructure: ['Inner Ring Road Lane 1-4', 'Feeder Flyover Ramp'],
    recommendedPriority: 'P1 - Immediate Intervention',
    explanation: 'Subway submergence under 1.8m water redirects 3,800 vehicles/hr to Inner Ring Road, escalating junction congestion from 70% to 100%.',
    timestamp: '11:40 AM'
  },
  {
    id: 'casc-4',
    sourceAssetId: 'node-rd-3',
    sourceAssetName: 'Inner Ring Road Grid Junction',
    targetAssetId: 'node-fps-1',
    targetAssetName: 'Guindy Central Fire & Rescue Station',
    cascadeLevel: 'TERTIARY',
    estimatedTimeMin: 50,
    impactSeverity: 'HIGH',
    confidenceScore: 88,
    criticalityScore: 85,
    geographicArea: 'Guindy Industrial Sector',
    affectedInfrastructure: ['Emergency Transit Corridor', 'Rescue Boat Fleet Deployment Route'],
    recommendedPriority: 'P2 - High Watch',
    explanation: 'Severe Ring Road gridlock increases dispatch delay for rescue motorboats and NDRF tenders by an estimated 28-35 minutes.',
    timestamp: '11:44 AM'
  },
  {
    id: 'casc-5',
    sourceAssetId: 'node-pwr-1',
    sourceAssetName: 'Velachery 110kV Main Substation',
    targetAssetId: 'node-com-1',
    targetAssetName: 'Velachery BSNL Fiber Master Exchange',
    cascadeLevel: 'SECONDARY',
    estimatedTimeMin: 40,
    impactSeverity: 'MEDIUM',
    confidenceScore: 87,
    criticalityScore: 82,
    geographicArea: 'Velachery Central',
    affectedInfrastructure: ['Cellular 5G Transceivers', 'Emergency Citizen Hotline 112 Node'],
    recommendedPriority: 'P2 - High Watch',
    explanation: 'Substation power loss places BSNL Telecom node on battery reserve. Service drop predicted in +2.5 hours if diesel backup generator is not refueled.',
    timestamp: '11:45 AM'
  }
];

export const INITIAL_RESPONSE_STRATEGIES: ResponseStrategy[] = [
  {
    id: 'strat-opt-a',
    name: 'Strategy Alpha: Substation Dewatering & High-Ground Diversion',
    code: 'strategy_a',
    tagline: 'Prioritizes critical grid protection & rapid rerouting',
    description: 'Deploys 4 high-capacity 500hp dewatering pumps to Velachery Substation while traffic police clear Inner Ring Road emergency lane for ambulances.',
    primaryFocus: 'Power Grid Preservation & Hospital Life Support',
    isOptimal: true,
    rank: 1,
    metrics: {
      responseTimeMins: 18,
      evacuationEfficiencyPct: 92,
      resourceUtilizationPct: 88,
      populationCoveragePct: 94,
      estimatedCasualties: 0,
      infrastructureProtectionPct: 95,
      operationalCostScore: 24,
      overallScore: 94.6
    },
    actions: [
      { action: 'Deploy High-Capacity Dewatering Pumps (x4)', target: 'Velachery Substation', resourcesAssigned: 'PWD Pump Fleet Units 1-4' },
      { action: 'Establish Green Emergency Transit Lane', target: 'Inner Ring Road Junction', resourcesAssigned: 'Traffic Police Brigade (24 Officers)' },
      { action: 'Pre-position Mobile 250kW Diesel Generator', target: 'Velachery Apollo Hospital', resourcesAssigned: 'TNEB Standby Unit' }
    ],
    tradeoffs: {
      pros: [
        'Prevents total blackout of 110kV Substation',
        'Maintains uninterrupted power to Apollo ICU (42 patients)',
        'Cuts ambulance delay to Guindy Govt Hospital from 45m to 14m'
      ],
      cons: [
        'Consumes 60% of municipal high-power dewatering pump inventory',
        'Requires shutting down 2 non-essential traffic lanes on Ring Road'
      ]
    }
  },
  {
    id: 'strat-opt-b',
    name: 'Strategy Beta: Pre-emptive Mass Evacuation & Boat Fleet Surge',
    code: 'strategy_b',
    tagline: 'Focuses on immediate water extraction & rescue operations',
    description: 'Surges 12 NDRF motorboats directly into Velachery South while establishing temporary triage camps at Corporation School Shelter.',
    primaryFocus: 'Citizen Evacuation & Rescue Boat Deployment',
    isOptimal: false,
    rank: 2,
    metrics: {
      responseTimeMins: 32,
      evacuationEfficiencyPct: 84,
      resourceUtilizationPct: 96,
      populationCoveragePct: 86,
      estimatedCasualties: 2,
      infrastructureProtectionPct: 62,
      operationalCostScore: 48,
      overallScore: 81.2
    },
    actions: [
      { action: 'Deploy NDRF Motorboat Battalions (12 Boats)', target: 'Velachery South Inundation Sector', resourcesAssigned: 'NDRF Battalion 4' },
      { action: 'Expand Shelter Triage Beds (+200)', target: 'Velachery Corp Higher Sec School', resourcesAssigned: 'Disaster Relief Staff' }
    ],
    tradeoffs: {
      pros: [
        'Evacuates ~1,200 stranded citizens from ground-floor flooding',
        'Provides immediate medical triage at school shelter'
      ],
      cons: [
        'Substation power grid fails at +35m due to lack of dewatering pumps',
        'Apollo Hospital loses main power, relying solely on limited generator battery',
        'Higher operational wear on rescue boats in heavy currents'
      ]
    }
  },
  {
    id: 'strat-opt-c',
    name: 'Strategy Gamma: Sluice Gate Breach Cleansing & Canal Dredging',
    code: 'strategy_c',
    tagline: 'Targets root-cause drainage clearing & sluice relief',
    description: 'Deploys heavy excavators and suction dredgers to clear clogged plastic debris at Velachery Lake Sluice Drainage Outfall.',
    primaryFocus: 'Hydrodynamic Drainage & Canal Outfall Recovery',
    isOptimal: false,
    rank: 3,
    metrics: {
      responseTimeMins: 55,
      evacuationEfficiencyPct: 71,
      resourceUtilizationPct: 75,
      populationCoveragePct: 78,
      estimatedCasualties: 5,
      infrastructureProtectionPct: 74,
      operationalCostScore: 35,
      overallScore: 72.8
    },
    actions: [
      { action: 'Dispatch Suction Dredger Vehicles', target: 'Velachery Lake Sluice Outfall', resourcesAssigned: 'PWA Engineering Fleet' },
      { action: 'Open Emergency Relief Canal Gates', target: 'Adyar River Channel', resourcesAssigned: 'Water Resources Dept' }
    ],
    tradeoffs: {
      pros: [
        'Addresses root-cause waterlogging by restoring 120 m³/s drainage flow',
        'Long-term water level reduction across entire basin'
      ],
      cons: [
        'Takes 2.5 hours to clear debris, during which substation & road inundation worsens',
        'High short-term risk to low-lying hospital infrastructure'
      ]
    }
  }
];

export const DEFAULT_WHAT_IF_PARAMS: WhatIfParameters = {
  rainfallIncreasePct: 20,
  damDischargeRateM3s: 250,
  closedBridges: [],
  disabledHospitals: [],
  disabledPowerStations: [],
  populationSurgeFactor: 1.0,
  activeDisasterType: 'flood'
};

export const INITIAL_TIME_FORECASTS: TimeIntervalForecast[] = [
  {
    timeInterval: '0m',
    label: 'Current Status (Live)',
    floodedAreaSqKm: 2.1,
    failedAssetsCount: 1,
    hospitalStressPct: 68,
    shelterOccupancyPct: 67,
    trafficCongestionIndex: 72,
    atRiskPopulation: 14500,
    criticalNodes: [
      { id: 'node-rd-2', name: 'Guindy Railway Subway', status: 'FAILED', healthPct: 0 },
      { id: 'node-wat-1', name: 'Velachery Sluice Outfall', status: 'CRITICAL', healthPct: 15 },
      { id: 'node-pwr-1', name: 'Velachery Substation', status: 'AT_RISK', healthPct: 42 }
    ],
    activeCascadesCount: 3,
    summary: 'Guindy Subway flooded (1.8m). Sluice outfall congested. Substation bunds under strain.'
  },
  {
    timeInterval: '30m',
    label: '+30 Minutes',
    floodedAreaSqKm: 3.4,
    failedAssetsCount: 2,
    hospitalStressPct: 82,
    shelterOccupancyPct: 78,
    trafficCongestionIndex: 88,
    atRiskPopulation: 22000,
    criticalNodes: [
      { id: 'node-pwr-1', name: 'Velachery Substation', status: 'FAILED', healthPct: 8 },
      { id: 'node-rd-3', name: 'Inner Ring Road Junction', status: 'CRITICAL', healthPct: 18 },
      { id: 'node-hosp-1', name: 'Apollo Hospital', status: 'AT_RISK', healthPct: 40 }
    ],
    activeCascadesCount: 5,
    summary: 'Velachery Substation trips due to flood ingress. Apollo Hospital shifts to emergency generator.'
  },
  {
    timeInterval: '1h',
    label: '+1 Hour',
    floodedAreaSqKm: 4.8,
    failedAssetsCount: 3,
    hospitalStressPct: 94,
    shelterOccupancyPct: 89,
    trafficCongestionIndex: 96,
    atRiskPopulation: 31500,
    criticalNodes: [
      { id: 'node-hosp-1', name: 'Apollo Hospital', status: 'CRITICAL', healthPct: 25 },
      { id: 'node-com-1', name: 'BSNL Exchange', status: 'CRITICAL', healthPct: 30 },
      { id: 'node-rd-3', name: 'Inner Ring Road', status: 'FAILED', healthPct: 0 }
    ],
    activeCascadesCount: 7,
    summary: 'Gridlock spreads to OMR feeder. Telecom backup battery drains to 50%. Triage overflow to shelters.'
  },
  {
    timeInterval: '3h',
    label: '+3 Hours',
    floodedAreaSqKm: 6.2,
    failedAssetsCount: 4,
    hospitalStressPct: 98,
    shelterOccupancyPct: 98,
    trafficCongestionIndex: 90,
    atRiskPopulation: 42000,
    criticalNodes: [
      { id: 'node-com-1', name: 'BSNL Exchange', status: 'FAILED', healthPct: 0 },
      { id: 'node-fps-1', name: 'Guindy Fire Station', status: 'CRITICAL', healthPct: 22 }
    ],
    activeCascadesCount: 8,
    summary: 'Telecom exchange battery depleted. Emergency cell broadcasts required. Shelters nearing maximum capacity.'
  },
  {
    timeInterval: '6h',
    label: '+6 Hours',
    floodedAreaSqKm: 7.5,
    failedAssetsCount: 5,
    hospitalStressPct: 100,
    shelterOccupancyPct: 100,
    trafficCongestionIndex: 75,
    atRiskPopulation: 58000,
    criticalNodes: [
      { id: 'node-sh-1', name: 'Velachery Shelter', status: 'CRITICAL', healthPct: 30 }
    ],
    activeCascadesCount: 9,
    summary: 'High tide peak pushes backflow into Adyar basin. Secondary shelters at Little Mount activated.'
  },
  {
    timeInterval: '12h',
    label: '+12 Hours',
    floodedAreaSqKm: 6.8,
    failedAssetsCount: 4,
    hospitalStressPct: 88,
    shelterOccupancyPct: 92,
    trafficCongestionIndex: 50,
    atRiskPopulation: 48000,
    criticalNodes: [],
    activeCascadesCount: 6,
    summary: 'Water recedes slowly as dewatering pumps operate. Secondary power restoration begins.'
  },
  {
    timeInterval: '24h',
    label: '+24 Hours',
    floodedAreaSqKm: 3.5,
    failedAssetsCount: 2,
    hospitalStressPct: 60,
    shelterOccupancyPct: 70,
    trafficCongestionIndex: 30,
    atRiskPopulation: 20000,
    criticalNodes: [],
    activeCascadesCount: 2,
    summary: 'Arterial roads reopened. Main power grid undergoing safety testing before re-energization.'
  }
];

export const INITIAL_EXPLAINABLE_REPORT: ExplainableDecisionReport = {
  id: 'report-exp-101',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  summary: 'Cascading failure propagation identified originating from Velachery Lake Sluice Drainage Outfall clogging, threatening 110kV Substation and Apollo Specialty Hospital ICU units within 45 minutes.',
  rootCauses: [
    'Unprecedented 110 mm/hr convective rainfall over Adyar Basin exceeding drainage design by 65%.',
    'Severe plastic debris obstruction at Velachery Sluice Gate preventing gravity outfall discharge.',
    'High-tide backflow at Kovalam estuary impeding stormwater runoff velocity.'
  ],
  chainReactionDescription: 'Sluice Outfall Overflow (T+0m) → Velachery South Inundation (T+15m) → Substation Basement Ingress (T+35m) → 110kV Grid Trip & Apollo Hospital Power Loss (T+45m) → Inner Ring Road Gridlock (T+50m) → Fire Tender Dispatch Delay (T+60m).',
  strategyRecommendationJustification: 'Strategy Alpha is recommended over Strategy Beta because deploying 4 high-capacity pumps to the Substation prevents a catastrophic power outage to Apollo Hospital (42 ICU patients on ventilators). Furthermore, clearing an emergency traffic lane reduces ambulance transit time by 68%.',
  keyTradeoffAnalysis: 'Choosing Strategy Alpha uses 60% of municipal dewatering pumps for power infrastructure rather than residential street pumping. However, this trade-off avoids an estimated 42 ICU patient fatalities caused by ventilator shutdown.',
  preventativeActionItems: [
    'Immediate dispatch of PWD 500hp Dewatering Pumps to Velachery Substation bunds.',
    'Traffic Police deployment to convert Inner Ring Road Lane 1 into a dedicated Emergency Green Corridor.',
    'Pre-stage 250kW Diesel Standby Generator at Apollo Hospital as secondary redundancy.'
  ],
  confidenceRatingPct: 96
};

// What-If Simulation Engine
export function recalculateCascadingSimulation(
  nodes: InfrastructureNode[],
  edges: DependencyEdge[],
  params: WhatIfParameters
): {
  updatedNodes: InfrastructureNode[];
  updatedPredictions: CascadingImpactPrediction[];
  updatedStrategies: ResponseStrategy[];
  updatedForecasts: TimeIntervalForecast[];
  updatedReport: ExplainableDecisionReport;
} {
  const rainFactor = 1 + (params.rainfallIncreasePct / 100);
  const damFactor = params.damDischargeRateM3s / 150;
  const combinedRiskMultiplier = Math.min(2.5, rainFactor * (1 + (damFactor - 1) * 0.3));

  // 1. Update Infrastructure Nodes based on parameters
  const updatedNodes = nodes.map(node => {
    let failureProb = node.failureProbability;
    let health = node.healthPct;
    let status = node.status;

    // Check if explicitly disabled/closed
    if (params.closedBridges.includes(node.id) || params.disabledHospitals.includes(node.id) || params.disabledPowerStations.includes(node.id)) {
      failureProb = 100;
      health = 0;
      status = 'FAILED';
    } else {
      // Scale by disaster parameters
      failureProb = Math.min(100, Math.round(node.failureProbability * combinedRiskMultiplier));
      health = Math.max(0, Math.round(100 - failureProb));

      if (failureProb >= 90) status = 'FAILED';
      else if (failureProb >= 70) status = 'CRITICAL';
      else if (failureProb >= 40) status = 'AT_RISK';
      else if (failureProb >= 20) status = 'DISRUPTED';
      else status = 'OPERATIONAL';
    }

    return {
      ...node,
      failureProbability: failureProb,
      healthPct: health,
      status
    };
  });

  // 2. Dynamic Predictions Generation
  const updatedPredictions: CascadingImpactPrediction[] = INITIAL_CASCADING_PREDICTIONS.map((pred, i) => {
    const adjustedTime = Math.max(5, Math.round(pred.estimatedTimeMin / combinedRiskMultiplier));
    const adjustedConfidence = Math.min(99, Math.round(pred.confidenceScore + (params.rainfallIncreasePct > 30 ? 4 : 0)));
    return {
      ...pred,
      estimatedTimeMin: adjustedTime,
      confidenceScore: adjustedConfidence,
      explanation: `${pred.explanation} [Simulated under +${params.rainfallIncreasePct}% rainfall & ${params.damDischargeRateM3s} m³/s dam release].`
    };
  });

  // 3. Dynamic Strategy Ranking
  const updatedStrategies: ResponseStrategy[] = INITIAL_RESPONSE_STRATEGIES.map(strat => {
    let score = strat.metrics.overallScore;
    if (strat.code === 'strategy_a') {
      score = Math.min(99, Math.round((strat.metrics.overallScore - (params.rainfallIncreasePct * 0.1)) * 10) / 10);
    } else if (strat.code === 'strategy_b') {
      score = Math.min(99, Math.round((strat.metrics.overallScore + (params.rainfallIncreasePct * 0.15)) * 10) / 10);
    }
    return {
      ...strat,
      metrics: {
        ...strat.metrics,
        overallScore: score,
        estimatedCasualties: params.rainfallIncreasePct > 40 ? Math.round(params.rainfallIncreasePct / 15) : 0,
        responseTimeMins: Math.round(strat.metrics.responseTimeMins * (1 + (params.rainfallIncreasePct / 200)))
      }
    };
  }).sort((a, b) => b.metrics.overallScore - a.metrics.overallScore)
    .map((strat, idx) => ({
      ...strat,
      rank: idx + 1,
      isOptimal: idx === 0
    }));

  // 4. Forecast Timeline Scaling
  const updatedForecasts: TimeIntervalForecast[] = INITIAL_TIME_FORECASTS.map(f => {
    const area = Math.round((f.floodedAreaSqKm * combinedRiskMultiplier) * 10) / 10;
    const pop = Math.round(f.atRiskPopulation * combinedRiskMultiplier * params.populationSurgeFactor);
    const failedCount = Math.min(12, Math.round(f.failedAssetsCount * Math.max(1, combinedRiskMultiplier * 0.8)));
    return {
      ...f,
      floodedAreaSqKm: area,
      atRiskPopulation: pop,
      failedAssetsCount: failedCount,
      hospitalStressPct: Math.min(100, Math.round(f.hospitalStressPct * Math.min(1.3, combinedRiskMultiplier))),
      summary: `${f.summary} Projected flooded area: ${area} sq km, affecting ~${pop.toLocaleString()} citizens.`
    };
  });

  // 5. Updated Explainable Report
  const updatedReport: ExplainableDecisionReport = {
    ...INITIAL_EXPLAINABLE_REPORT,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    summary: `What-If Scenario Recalculated (+${params.rainfallIncreasePct}% Rainfall, ${params.damDischargeRateM3s} m³/s Dam Discharge). Cascading risk index escalated by Math.round((combinedRiskMultiplier - 1) * 100)%.`,
    rootCauses: [
      `Rainfall intensity modeled at +${params.rainfallIncreasePct}% over baseline.`,
      `Chembarambakkam dam discharge active at ${params.damDischargeRateM3s} m³/s.`,
      `Closed/Disabled Critical Assets: ${[...params.closedBridges, ...params.disabledHospitals, ...params.disabledPowerStations].join(', ') || 'None'}.`
    ],
    confidenceRatingPct: Math.min(98, 92 + Math.round(combinedRiskMultiplier * 2))
  };

  return {
    updatedNodes,
    updatedPredictions,
    updatedStrategies,
    updatedForecasts,
    updatedReport
  };
}
