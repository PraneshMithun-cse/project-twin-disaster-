export interface DbRiskZone {
  id: string;
  name: string;
  risk_score: number;
  priority_level: string;
  population_at_risk: number;
  predicted_water_level_30m: number;
  predicted_water_level_1h: number;
  status: string;
  center_coordinates: [number, number];
}

export interface DbHospital {
  id: string;
  name: string;
  address: string;
  total_beds: number;
  available_icu_beds: number;
  trauma_center_active: boolean;
  status: string;
  coordinates: [number, number];
  contact_phone: string;
}

export interface DbShelter {
  id: string;
  name: string;
  address: string;
  capacity: number;
  current_occupancy: number;
  food_supplies_days: number;
  has_medical_unit: boolean;
  has_food_supply: boolean;
  power_backup: boolean;
  status: string;
  contact_phone: string;
  contact_person: string;
  coordinates: [number, number];
}

export interface DbResource {
  id: string;
  name: string;
  type: string;
  status: string;
  assigned_zone_id?: string;
  coordinates: [number, number];
  crew_count: number;
  fuel_supplies_pct: number;
  contact_number: string;
  equipment: string[];
}

export interface DbIoTSensor {
  id: string;
  name: string;
  type: string;
  current_value: number;
  unit: string;
  threshold_warning: number;
  threshold_critical: number;
  battery_pct: number;
  signal_pct: number;
  status: string;
  coordinates: [number, number];
  last_updated: string;
}

export interface DbCitizenReport {
  id: string;
  reporter_name: string;
  phone: string;
  location_name: string;
  coordinates: [number, number];
  hazard_type: string;
  severity: string;
  description: string;
  image_url: string;
  ai_validation_score: number;
  ai_validated_category: string;
  ai_summary: string;
  status: string;
  created_at: string;
}

export interface DbDecisionKnowledge {
  id: string;
  title: string;
  rainfall_rate_mm_hr: number;
  dam_discharge_m3s: number;
  effectiveness_score: number;
  outcome: string;
  lessons_learned: string;
  created_at: string;
}

// 1. RISK ZONES DATASET
export const POPULATED_RISK_ZONES: DbRiskZone[] = [
  {
    id: 'zone-velachery-south',
    name: 'Velachery South & Lake View Colony',
    risk_score: 88,
    priority_level: 'CRITICAL',
    population_at_risk: 34200,
    predicted_water_level_30m: 1.8,
    predicted_water_level_1h: 2.3,
    status: 'evacuating',
    center_coordinates: [12.976, 80.222]
  },
  {
    id: 'zone-adyar-riverbank',
    name: 'Adyar River Bank - Kotturpuram',
    risk_score: 78,
    priority_level: 'HIGH',
    population_at_risk: 21500,
    predicted_water_level_30m: 1.4,
    predicted_water_level_1h: 1.9,
    status: 'warning',
    center_coordinates: [13.010, 80.239]
  },
  {
    id: 'zone-taramani-omr',
    name: 'Taramani Canal & OMR IT Junction',
    risk_score: 62,
    priority_level: 'MEDIUM',
    population_at_risk: 18400,
    predicted_water_level_30m: 0.8,
    predicted_water_level_1h: 1.2,
    status: 'monitoring',
    center_coordinates: [12.986, 80.248]
  },
  {
    id: 'zone-guindy-underpass',
    name: 'Guindy Industrial & Railway Underpass',
    risk_score: 82,
    priority_level: 'CRITICAL',
    population_at_risk: 12800,
    predicted_water_level_30m: 1.6,
    predicted_water_level_1h: 2.1,
    status: 'warning',
    center_coordinates: [12.998, 80.211]
  },
  {
    id: 'zone-perungudi-marsh',
    name: 'Perungudi Marshland Outfall Corridor',
    risk_score: 45,
    priority_level: 'LOW',
    population_at_risk: 8200,
    predicted_water_level_30m: 0.5,
    predicted_water_level_1h: 0.8,
    status: 'safe',
    center_coordinates: [12.963, 80.240]
  },
  {
    id: 'zone-madipakkam-lake',
    name: 'Madipakkam Lake Overflow Sector',
    risk_score: 75,
    priority_level: 'HIGH',
    population_at_risk: 19300,
    predicted_water_level_30m: 1.2,
    predicted_water_level_1h: 1.7,
    status: 'warning',
    center_coordinates: [12.968, 80.201]
  },
  {
    id: 'zone-saidapet-bridge',
    name: 'Saidapet Bridge & Adyar Basin',
    risk_score: 84,
    priority_level: 'CRITICAL',
    population_at_risk: 27600,
    predicted_water_level_30m: 1.7,
    predicted_water_level_1h: 2.2,
    status: 'evacuating',
    center_coordinates: [13.021, 80.223]
  }
];

// 2. HOSPITALS DATASET
export const POPULATED_HOSPITALS: DbHospital[] = [
  {
    id: 'node-hosp-1',
    name: 'Velachery Apollo Specialty Hospital',
    address: 'Velachery 100ft Road, near Vijaya Nagar Junction',
    total_beds: 320,
    available_icu_beds: 48,
    trauma_center_active: true,
    status: 'near_capacity',
    coordinates: [12.9765, 80.2240],
    contact_phone: '+91 44 2243 4000'
  },
  {
    id: 'hosp-01',
    name: 'Chennai General Trauma Hospital & Medical Center',
    address: 'Velachery 100ft Road, near Vijaya Nagar',
    total_beds: 120,
    available_icu_beds: 15,
    trauma_center_active: true,
    status: 'near_capacity',
    coordinates: [12.980, 80.220],
    contact_phone: '+91 94441 55660'
  },
  {
    id: 'hosp-02',
    name: 'Fortis Emergency Specialty Clinic - Adyar',
    address: 'LB Road, Adyar, Chennai',
    total_beds: 180,
    available_icu_beds: 24,
    trauma_center_active: true,
    status: 'normal',
    coordinates: [13.003, 80.245],
    contact_phone: '+91 94441 77880'
  },
  {
    id: 'hosp-03',
    name: 'MIOT International Emergency Response Unit',
    address: 'Mount-Poonamallee Road, Manapakkam / Guindy',
    total_beds: 500,
    available_icu_beds: 75,
    trauma_center_active: true,
    status: 'full',
    coordinates: [13.012, 80.215],
    contact_phone: '+91 44 2249 2288'
  },
  {
    id: 'hosp-04',
    name: 'KMC Disaster Support Clinic - Taramani',
    address: 'Taramani Link Road, Chennai',
    total_beds: 60,
    available_icu_beds: 5,
    trauma_center_active: false,
    status: 'normal',
    coordinates: [12.989, 80.246],
    contact_phone: '+91 94441 99000'
  }
];

// 3. SHELTERS DATASET
export const POPULATED_SHELTERS: DbShelter[] = [
  {
    id: 'shelter-velachery-comm',
    name: 'Velachery Community Center Relief Camp',
    address: 'Near MRTS Station, Velachery Main Road',
    capacity: 1200,
    current_occupancy: 840,
    food_supplies_days: 4,
    has_medical_unit: true,
    has_food_supply: true,
    power_backup: true,
    status: 'open',
    contact_phone: '+91 94451 10001',
    contact_person: 'Officer S. Ramesh',
    coordinates: [12.983, 80.218]
  },
  {
    id: 'shelter-adyar-govt-school',
    name: 'Adyar Govt Higher Secondary School Relief Hub',
    address: 'Lattice Bridge Road, Adyar',
    capacity: 2000,
    current_occupancy: 1150,
    food_supplies_days: 6,
    has_medical_unit: true,
    has_food_supply: true,
    power_backup: true,
    status: 'open',
    contact_phone: '+91 94451 10002',
    contact_person: 'Dr. M. Deepa',
    coordinates: [13.005, 80.252]
  },
  {
    id: 'shelter-guindy-sports-complex',
    name: 'Guindy Indoor Stadium Emergency Center',
    address: 'GST Road, Guindy',
    capacity: 3500,
    current_occupancy: 1200,
    food_supplies_days: 7,
    has_medical_unit: true,
    has_food_supply: true,
    power_backup: true,
    status: 'open',
    contact_phone: '+91 94451 10003',
    contact_person: 'Captain V. Kumar',
    coordinates: [13.009, 80.212]
  },
  {
    id: 'shelter-perungudi-school',
    name: 'Perungudi Primary School Relief Camp',
    address: 'Corporation School Rd, Perungudi',
    capacity: 800,
    current_occupancy: 310,
    food_supplies_days: 5,
    has_medical_unit: true,
    has_food_supply: true,
    power_backup: true,
    status: 'open',
    contact_phone: '+91 94451 10004',
    contact_person: 'Officer P. Selvam',
    coordinates: [12.965, 80.242]
  },
  {
    id: 'shelter-taramani-hall',
    name: 'Taramani Multipurpose Welfare Hall',
    address: 'CSIR Road, Taramani',
    capacity: 1500,
    current_occupancy: 620,
    food_supplies_days: 4,
    has_medical_unit: true,
    has_food_supply: true,
    power_backup: true,
    status: 'open',
    contact_phone: '+91 94451 10005',
    contact_person: 'Officer K. Sundaram',
    coordinates: [12.988, 80.245]
  }
];

// 4. EMERGENCY RESOURCES DATASET
export const POPULATED_RESOURCES: DbResource[] = [
  {
    id: 'res-ndrf-01',
    name: 'NDRF Battalion 04 - Rescue Boats Unit',
    type: 'rescue_boat',
    status: 'deployed',
    assigned_zone_id: 'zone-velachery-south',
    coordinates: [12.989, 80.218],
    crew_count: 16,
    fuel_supplies_pct: 85,
    contact_number: '+91 94440 12345',
    equipment: ['4x Inflatable Motor Boats', 'Life Jackets x60', 'Satellite Comm', 'Thermal Scanners']
  },
  {
    id: 'res-amb-02',
    name: '108 Emergency Ambulance Unit 12',
    type: 'ambulance',
    status: 'en_route',
    assigned_zone_id: 'zone-adyar-riverbank',
    coordinates: [13.008, 80.242],
    crew_count: 3,
    fuel_supplies_pct: 92,
    contact_number: '+91 94440 23456',
    equipment: ['Advanced Life Support', 'Portable Ventilator', 'Trauma Kit']
  },
  {
    id: 'res-fire-03',
    name: 'Tamil Nadu Fire & Rescue Station - Velachery',
    type: 'fire_truck',
    status: 'deployed',
    assigned_zone_id: 'zone-velachery-south',
    coordinates: [12.980, 80.225],
    crew_count: 10,
    fuel_supplies_pct: 78,
    contact_number: '+91 44 2243 1122',
    equipment: ['Heavy High-Capacity Water Pumps (500 HP)', 'Hydraulic Cutters', 'Search Lights']
  },
  {
    id: 'res-police-04',
    name: 'Greater Chennai Police Patrol - Adyar Division',
    type: 'police_patrol',
    status: 'deployed',
    assigned_zone_id: 'zone-guindy-underpass',
    coordinates: [13.003, 80.235],
    crew_count: 8,
    fuel_supplies_pct: 90,
    contact_number: '+91 44 2345 3344',
    equipment: ['Road Block Barricades', 'Public Address System', 'Drones']
  },
  {
    id: 'res-relief-05',
    name: 'Municipal Food & Water Distribution Truck A',
    type: 'relief_truck',
    status: 'available',
    coordinates: [12.990, 80.238],
    crew_count: 5,
    fuel_supplies_pct: 100,
    contact_number: '+91 98400 44556',
    equipment: ['2500 Packaged Meals', '5000L Drinking Water Bottles', 'Dry Ration Kits']
  },
  {
    id: 'res-sdrf-06',
    name: 'SDRF Motorboat Team Delta',
    type: 'rescue_boat',
    status: 'deployed',
    assigned_zone_id: 'zone-adyar-riverbank',
    coordinates: [13.014, 80.240],
    crew_count: 12,
    fuel_supplies_pct: 88,
    contact_number: '+91 94440 55667',
    equipment: ['3x Motorized Life Boats', 'Loudspeakers', 'Medical First-Aid']
  }
];

// 5. IOT SENSORS DATASET
export const POPULATED_IOT_SENSORS: DbIoTSensor[] = [
  {
    id: 'sensor-velachery-lake-sluice',
    name: 'Velachery Lake Sluice Gate 02',
    type: 'water_level',
    current_value: 2.85,
    unit: 'm (Depth)',
    threshold_warning: 2.0,
    threshold_critical: 2.6,
    battery_pct: 94,
    signal_pct: 98,
    status: 'critical',
    coordinates: [12.972, 80.220],
    last_updated: 'Just now'
  },
  {
    id: 'sensor-kotturpuram-bridge',
    name: 'Adyar River Kotturpuram Gauge',
    type: 'water_level',
    current_value: 3.42,
    unit: 'm (Stage)',
    threshold_warning: 2.8,
    threshold_critical: 3.2,
    battery_pct: 88,
    signal_pct: 92,
    status: 'critical',
    coordinates: [13.011, 80.237],
    last_updated: 'Just now'
  },
  {
    id: 'sensor-100ft-rd-canal',
    name: '100 Feet Road Canal Ultrasonic Sensor',
    type: 'water_level',
    current_value: 1.55,
    unit: 'm (Depth)',
    threshold_warning: 1.2,
    threshold_critical: 1.5,
    battery_pct: 91,
    signal_pct: 95,
    status: 'warning',
    coordinates: [12.981, 80.223],
    last_updated: '2 mins ago'
  },
  {
    id: 'sensor-taramani-pluviometer',
    name: 'Taramani Automatic Rain Gauge',
    type: 'rain_gauge',
    current_value: 88.0,
    unit: 'mm/hr',
    threshold_warning: 50.0,
    threshold_critical: 75.0,
    battery_pct: 99,
    signal_pct: 100,
    status: 'critical',
    coordinates: [12.987, 80.246],
    last_updated: 'Just now'
  },
  {
    id: 'sensor-buckingham-flow',
    name: 'Buckingham Canal Velocity Radar',
    type: 'flow_rate',
    current_value: 4.8,
    unit: 'm³/s',
    threshold_warning: 3.5,
    threshold_critical: 5.0,
    battery_pct: 82,
    signal_pct: 90,
    status: 'warning',
    coordinates: [12.998, 80.252],
    last_updated: '1 min ago'
  },
  {
    id: 'sensor-guindy-subway',
    name: 'Guindy Subway Submergence Sensor',
    type: 'water_level',
    current_value: 3.2,
    unit: 'ft (Inundation)',
    threshold_warning: 1.0,
    threshold_critical: 2.5,
    battery_pct: 96,
    signal_pct: 94,
    status: 'critical',
    coordinates: [13.0067, 80.2117],
    last_updated: 'Just now'
  }
];

// 6. CITIZEN REPORTS DATASET
export const POPULATED_CITIZEN_REPORTS: DbCitizenReport[] = [
  {
    id: 'rep-001',
    reporter_name: 'Karthik Subramanian',
    phone: '+91 98840 11223',
    location_name: 'Velachery 100ft Road near Vijaya Nagar Junction',
    coordinates: [12.9785, 80.2205],
    hazard_type: 'waterlogging',
    severity: 'critical',
    description: 'Water level reached 4 feet. Ground floor apartments submerged. 12 elderly residents stranded inside house.',
    image_url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
    ai_validation_score: 96,
    ai_validated_category: 'Severe Flood - Trapped Citizens',
    ai_summary: 'High credibility report verified with IoT Sluice gauge data (+2.8m water). Immediate rescue boat needed.',
    status: 'verified',
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString()
  },
  {
    id: 'rep-002',
    reporter_name: 'Anitha Rajan',
    phone: '+91 97900 33445',
    location_name: 'Kotturpuram Housing Board Block B',
    coordinates: [13.012, 80.239],
    hazard_type: 'trapped_citizens',
    severity: 'high',
    description: 'Adyar river water leaking into compound wall. Power cut in area. Transformer sparked.',
    image_url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80',
    ai_validation_score: 91,
    ai_validated_category: 'Riverbank Breach Risk',
    ai_summary: 'Cross-validated with Adyar Stage Gauge (3.42m). Substation isolation alert sent to TNEB.',
    status: 'in_progress',
    created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString()
  },
  {
    id: 'rep-003',
    reporter_name: 'Senthil Kumar',
    phone: '+91 94430 55667',
    location_name: 'Guindy Railway Subway',
    coordinates: [13.0067, 80.2117],
    hazard_type: 'road_submerged',
    severity: 'critical',
    description: 'Subway completely submerged up to 5 feet. Two cars stalled inside. Traffic diverted.',
    image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    ai_validation_score: 98,
    ai_validated_category: 'Critical Transportation Route Block',
    ai_summary: 'Automated road barrier triggered via Traffic Agent. Route recalculation active on map.',
    status: 'in_progress',
    created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString()
  }
];

// 7. HISTORICAL DECISION KNOWLEDGE BASE DATASET
export const POPULATED_DECISION_KNOWLEDGE: DbDecisionKnowledge[] = [
  {
    id: 'sim-2015-12-01',
    title: 'December 2015 Chennai Cloudburst & Chembarambakkam Release',
    rainfall_rate_mm_hr: 95,
    dam_discharge_m3s: 1800,
    effectiveness_score: 91,
    outcome: 'Saved 4,200 stranded residents with pre-positioned boats',
    lessons_learned: 'Pre-positioning rescue boats prior to T+30 minutes reduces medical transport delay by 42%.',
    created_at: '2015-12-01T10:00:00Z'
  },
  {
    id: 'sim-2023-12-04',
    title: 'December 2023 Cyclone Michaung Overflow',
    rainfall_rate_mm_hr: 80,
    dam_discharge_m3s: 1200,
    effectiveness_score: 88,
    outcome: 'Dewatering pumps deployed at 100ft road canal sluice reduced standing water duration by 14h',
    lessons_learned: 'Continuous pumping at Velachery 100ft road prevents basement inundation in 110kV Substation.',
    created_at: '2023-12-04T14:30:00Z'
  },
  {
    id: 'sim-2021-11-25',
    title: 'November 2021 Nivar Cyclone Adyar River Breach',
    rainfall_rate_mm_hr: 65,
    dam_discharge_m3s: 800,
    effectiveness_score: 94,
    outcome: 'Controlled evacuation of 8,500 Kotturpuram residents to Adyar School Shelter',
    lessons_learned: 'Early warning SMS to low-lying riverbank sectors prevents panic evacuation during high tide.',
    created_at: '2021-11-25T08:00:00Z'
  }
];
