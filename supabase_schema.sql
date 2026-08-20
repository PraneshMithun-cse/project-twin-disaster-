-- ============================================================================
-- ResponSync: AI Decision Digital Twin - Complete Supabase PostgreSQL / PostGIS Schema
-- ResponSync Version: 1.0 (TDD Section 13 Specification)
-- Pilot Area: Chennai Velachery & Adyar Corridor
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. Clean Drop Existing Tables (CASCADE)
DROP TABLE IF EXISTS evacuation_routes CASCADE;
DROP TABLE IF EXISTS decision_knowledge CASCADE;
DROP TABLE IF EXISTS simulation_results CASCADE;
DROP TABLE IF EXISTS simulations CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS citizen_reports CASCADE;
DROP TABLE IF EXISTS risk_zones CASCADE;
DROP TABLE IF EXISTS weather_cache CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS shelters CASCADE;
DROP TABLE IF EXISTS hospitals CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 3. Create Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('authority', 'responder', 'citizen', 'admin')),
    agency_name TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Citizen Reports Table
CREATE TABLE reports (
    id TEXT PRIMARY KEY,
    reporter_name TEXT DEFAULT 'Anonymous Citizen',
    phone TEXT,
    location_name TEXT NOT NULL,
    coordinates DOUBLE PRECISION[] NOT NULL, -- [latitude, longitude]
    geom GEOMETRY(Point, 4326),
    hazard_type TEXT NOT NULL CHECK (hazard_type IN ('waterlogging', 'road_submerged', 'trapped_citizens', 'medical_emergency', 'power_outage', 'other')),
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    description TEXT NOT NULL,
    image_url TEXT,
    ai_validation_score INT DEFAULT 90,
    ai_validated_category TEXT,
    ai_summary TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'in_progress', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Weather Cache Table
CREATE TABLE weather_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location TEXT NOT NULL DEFAULT 'Chennai Velachery-Adyar Corridor',
    rainfall_mm_hr DOUBLE PRECISION NOT NULL,
    description TEXT NOT NULL,
    temperature_c DOUBLE PRECISION,
    humidity_pct INT,
    wind_speed_kmh DOUBLE PRECISION,
    high_tide_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Risk Zones Table
CREATE TABLE risk_zones (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    risk_score DOUBLE PRECISION NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    priority_level TEXT NOT NULL CHECK (priority_level IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    population_at_risk INT NOT NULL DEFAULT 0,
    predicted_water_level_30m DOUBLE PRECISION DEFAULT 0.0,
    predicted_water_level_1h DOUBLE PRECISION DEFAULT 0.0,
    status TEXT NOT NULL DEFAULT 'monitoring' CHECK (status IN ('safe', 'monitoring', 'warning', 'evacuating', 'submerged')),
    center_coordinates DOUBLE PRECISION[] NOT NULL,
    boundary_geom GEOMETRY(Polygon, 4326),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create Disaster Simulations Table
CREATE TABLE simulations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    rainfall_mm_hr DOUBLE PRECISION NOT NULL,
    dam_discharge_m3s DOUBLE PRECISION NOT NULL,
    canal_blockage_pct INT DEFAULT 50,
    affected_zones_count INT DEFAULT 0,
    predicted_submerged_area_km2 DOUBLE PRECISION DEFAULT 0.0,
    estimated_affected_people INT DEFAULT 0,
    effectiveness_score INT DEFAULT 85,
    outcome TEXT,
    lessons_learned TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create Decision Knowledge Base Table (Historical Scenarios)
CREATE TABLE decision_knowledge (
    id TEXT PRIMARY KEY,
    historical_event TEXT NOT NULL,
    similarity_pct INT NOT NULL,
    key_matches TEXT[] NOT NULL,
    retrieved_strategy TEXT NOT NULL,
    historical_outcome TEXT NOT NULL,
    ai_refinement TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create Emergency Resources Table
CREATE TABLE resources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('boat', 'pump', 'ambulance', 'ndrf', 'bus', 'fire_truck')),
    status TEXT NOT NULL CHECK (status IN ('available', 'en_route', 'deployed', 'maintenance')),
    assigned_zone_id TEXT,
    coordinates DOUBLE PRECISION[] NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Create Emergency Shelters Table
CREATE TABLE shelters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    capacity INT NOT NULL,
    current_occupancy INT DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('open', 'filling_fast', 'full', 'closed')),
    contact_phone TEXT,
    has_medical_unit BOOLEAN DEFAULT TRUE,
    has_food_supply BOOLEAN DEFAULT TRUE,
    coordinates DOUBLE PRECISION[] NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Create Hospitals Table
CREATE TABLE hospitals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    total_beds INT NOT NULL,
    available_icu_beds INT DEFAULT 0,
    trauma_center_active BOOLEAN DEFAULT TRUE,
    status TEXT NOT NULL CHECK (status IN ('operational', 'strained', 'diverting', 'flooded')),
    coordinates DOUBLE PRECISION[] NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Create Evacuation Routes Table
CREATE TABLE evacuation_routes (
    id TEXT PRIMARY KEY,
    origin_name TEXT NOT NULL,
    destination_shelter_name TEXT NOT NULL,
    destination_shelter_id TEXT REFERENCES shelters(id),
    safety_score_pct INT NOT NULL DEFAULT 95,
    hazards_avoided TEXT[] NOT NULL,
    waypoints DOUBLE PRECISION[][] NOT NULL, -- Array of [lat, lng] pairs
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INITIAL SEED DATA (Chennai Velachery & Adyar Corridor)
-- ============================================================================

-- Seed Risk Zones
INSERT INTO risk_zones (id, name, risk_score, priority_level, population_at_risk, predicted_water_level_30m, predicted_water_level_1h, status, center_coordinates)
VALUES 
('zone-velachery-south', 'Velachery South (Vijaya Nagar)', 88.5, 'CRITICAL', 42000, 1.4, 2.2, 'evacuating', ARRAY[12.9785, 80.2205]),
('zone-guindy-subway', 'Guindy Railway Subway Corridor', 94.0, 'CRITICAL', 18500, 1.9, 2.8, 'submerged', ARRAY[13.0067, 80.2117]),
('zone-kotturpuram', 'Kotturpuram Adyar River Bank', 76.2, 'HIGH', 24600, 0.9, 1.5, 'warning', ARRAY[13.0231, 80.2411]),
('zone-taramani-link', 'Taramani 100ft Canal Link', 54.1, 'MEDIUM', 10000, 0.4, 0.8, 'monitoring', ARRAY[12.9863, 80.2432]);

-- Seed Historical Decision Knowledge Base
INSERT INTO decision_knowledge (id, historical_event, similarity_pct, key_matches, retrieved_strategy, historical_outcome, ai_refinement)
VALUES
('sim-2015-12-01', 'December 2015 Chennai Cloudburst & Chembarambakkam Release', 94, ARRAY['85mm/hr Cloudburst intensity', 'High tide estuarine backwater', 'Velachery Lake sluice overflow'], 'Immediate deployment of 4 NDRF boat units to Vijaya Nagar & pre-evacuation of Kotturpuram tenements', 'Rescued 4,200 stranded residents with 91% effectiveness score', 'Apply 2015 strategy but add automated road barricading at Guindy subway to prevent vehicle stalling.'),
('sim-2021-11-25', 'November 2021 Cyclone Nivar Severe Inundation', 86, ARRAY['Heavy catchment rain in Adyar', 'Drainage silt blockage 80%'], 'High-capacity 500HP dewatering pumps stationed at 100ft road canal sluice', 'Reduced standing water duration by 14 hours across Velachery South', 'Deploy pumps 30 minutes earlier based on live IoT sensor water depth derivative.'),
('sim-2023-12-04', 'December 2023 Cyclone Michaung Overflow', 89, ARRAY['Extreme rainfall 90mm/hr', 'Subway inundation'], 'Pre-positioning mobile emergency generators at hospital feeders & boat dispatch', 'Maintained critical ICU power at 100% and evacuated 2,100 citizens', 'Integrate real-time satellite radar altimetry for early dam release warnings.');

-- Seed Emergency Shelters
INSERT INTO shelters (id, name, address, capacity, current_occupancy, status, contact_phone, coordinates)
VALUES
('sh-01', 'Velachery Community Center Relief Camp', '100ft Road, Velachery, Chennai', 1200, 480, 'open', '+91 44 2243 0001', ARRAY[12.9815, 80.2225]),
('sh-02', 'Guindy Government Higher Secondary School', 'GST Road, Guindy, Chennai', 850, 620, 'filling_fast', '+91 44 2234 1122', ARRAY[13.0089, 80.2135]),
('sh-03', 'Kotturpuram Corporation Relief Hall', 'Adyar River Road, Kotturpuram, Chennai', 600, 150, 'open', '+91 44 2441 5566', ARRAY[13.0245, 80.2425]);

-- Seed Emergency Resources
INSERT INTO resources (id, name, type, status, assigned_zone_id, coordinates)
VALUES
('res-01', 'NDRF Motorboat Fleet A (4 Boats)', 'boat', 'deployed', 'zone-velachery-south', ARRAY[12.9790, 80.2210]),
('res-02', 'Heavy Dewatering Pump 500HP #1', 'pump', 'deployed', 'zone-guindy-subway', ARRAY[13.0060, 80.2110]),
('res-03', '108 Emergency Ambulance Unit #4', 'ambulance', 'available', NULL, ARRAY[12.9850, 80.2260]),
('res-04', 'Disaster Relief Transit Bus Fleet', 'bus', 'en_route', 'zone-kotturpuram', ARRAY[13.0210, 80.2400]);

-- Seed Initial Citizen Reports
INSERT INTO reports (id, reporter_name, phone, location_name, coordinates, hazard_type, severity, description, status)
VALUES
('rep-001', 'Ramesh Kumar', '+91 98401 23456', 'Velachery Vijaya Nagar Bus Stand', ARRAY[12.9785, 80.2205], 'waterlogging', 'high', 'Severe waterlogging near bus stand. Water depth approx 2.5ft and rising.', 'verified'),
('rep-002', 'Priya Sundaram', '+91 94440 98765', 'Guindy Railway Subway', ARRAY[13.0067, 80.2117], 'road_submerged', 'critical', 'Subway completely submerged. Two cars stalled in water. Avoid route.', 'in_progress');

-- Enable Row Level Security (RLS) with Full Access Policies for App Integration
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE shelters ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all on reports" ON reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on risk_zones" ON risk_zones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on shelters" ON shelters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on resources" ON resources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on decision_knowledge" ON decision_knowledge FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on simulations" ON simulations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on hospitals" ON hospitals FOR ALL USING (true) WITH CHECK (true);
