-- ============================================================================
-- ResponSync: AI Decision Digital Twin & Facility Safety - Full Supabase PostgreSQL / PostGIS Schema
-- Schema Version: 2.0 (Full Production Specification)
-- Pilot Area: Chennai Velachery & Adyar Corridor + Sai Fireworks Industrial Site
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. Clean Drop Existing Tables (CASCADE)
DROP TABLE IF EXISTS whatsapp_dispatches CASCADE;
DROP TABLE IF EXISTS facility_incidents CASCADE;
DROP TABLE IF EXISTS facility_employees CASCADE;
DROP TABLE IF EXISTS exit_routes CASCADE;
DROP TABLE IF EXISTS muster_hubs CASCADE;
DROP TABLE IF EXISTS blueprint_sensors CASCADE;
DROP TABLE IF EXISTS facility_zones CASCADE;
DROP TABLE IF EXISTS facilities CASCADE;
DROP TABLE IF EXISTS cascading_edges CASCADE;
DROP TABLE IF EXISTS cascading_nodes CASCADE;
DROP TABLE IF EXISTS xai_recommendations CASCADE;
DROP TABLE IF EXISTS agent_logs CASCADE;
DROP TABLE IF EXISTS emergency_alerts CASCADE;
DROP TABLE IF EXISTS evacuation_routes CASCADE;
DROP TABLE IF EXISTS decision_knowledge CASCADE;
DROP TABLE IF EXISTS simulations CASCADE;
DROP TABLE IF EXISTS iot_sensors CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS risk_zones CASCADE;
DROP TABLE IF EXISTS weather_cache CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS shelters CASCADE;
DROP TABLE IF EXISTS hospitals CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- PILLAR I: USER ACCOUNTS & ACCESS CONTROL
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('authority', 'responder', 'citizen', 'admin', 'safety_officer')),
    agency_name TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PILLAR II: DISASTER GIS & SPATIAL INFRASTRUCTURE
-- ============================================================================

-- Citizen Hazard Reports (SOS & WhatsApp Ingest)
CREATE TABLE reports (
    id TEXT PRIMARY KEY,
    reporter_name TEXT DEFAULT 'Anonymous Citizen',
    phone TEXT,
    location_name TEXT NOT NULL,
    coordinates DOUBLE PRECISION[] NOT NULL, -- [latitude, longitude]
    geom GEOMETRY(Point, 4326),
    hazard_type TEXT NOT NULL CHECK (hazard_type IN ('waterlogging', 'road_submerged', 'trapped_citizens', 'medical_emergency', 'power_outage', 'infrastructure_damage', 'other')),
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    description TEXT NOT NULL,
    image_url TEXT,
    ai_validation_score INT DEFAULT 90,
    ai_validated_category TEXT,
    ai_summary TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'dispatched', 'in_progress', 'resolved')),
    assigned_resource_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Risk Zones (Flood / Inundation Polygons)
CREATE TABLE risk_zones (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    risk_score DOUBLE PRECISION NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    confidence_score DOUBLE PRECISION DEFAULT 92.0,
    priority_level TEXT NOT NULL CHECK (priority_level IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    population_at_risk INT NOT NULL DEFAULT 0,
    current_water_level_meters DOUBLE PRECISION DEFAULT 0.0,
    predicted_water_level_30m DOUBLE PRECISION DEFAULT 0.0,
    predicted_water_level_1h DOUBLE PRECISION DEFAULT 0.0,
    predicted_water_level_2h DOUBLE PRECISION DEFAULT 0.0,
    rainfall_rate_mm_hr DOUBLE PRECISION DEFAULT 0.0,
    drainage_congestion_pct INT DEFAULT 0,
    estimated_time_to_inundation_min INT DEFAULT 120,
    status TEXT NOT NULL DEFAULT 'monitoring' CHECK (status IN ('safe', 'monitoring', 'warning', 'evacuating', 'submerged')),
    center_coordinates DOUBLE PRECISION[] NOT NULL,
    boundary_geom GEOMETRY(Polygon, 4326),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- IoT Telemetry Sensor Nodes
CREATE TABLE iot_sensors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('water_level', 'rain_gauge', 'flow_rate', 'structural_strain')),
    coordinates DOUBLE PRECISION[] NOT NULL,
    geom GEOMETRY(Point, 4326),
    current_value DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    unit TEXT NOT NULL,
    threshold_warning DOUBLE PRECISION NOT NULL,
    threshold_critical DOUBLE PRECISION NOT NULL,
    battery_pct INT DEFAULT 100,
    signal_pct INT DEFAULT 95,
    status TEXT NOT NULL DEFAULT 'normal' CHECK (status IN ('normal', 'warning', 'critical', 'offline')),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency Response Assets & Resources
CREATE TABLE resources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('fire_truck', 'ambulance', 'rescue_boat', 'boat', 'ndrf_team', 'ndrf', 'pump', 'bus', 'police_patrol', 'medical_unit', 'relief_truck')),
    status TEXT NOT NULL CHECK (status IN ('available', 'en_route', 'deployed', 'maintenance')),
    assigned_zone_id TEXT REFERENCES risk_zones(id) ON DELETE SET NULL,
    crew_count INT DEFAULT 4,
    fuel_or_supplies_pct INT DEFAULT 100,
    contact_number TEXT,
    coordinates DOUBLE PRECISION[] NOT NULL,
    geom GEOMETRY(Point, 4326),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relief Shelters
CREATE TABLE shelters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    capacity INT NOT NULL,
    current_occupancy INT DEFAULT 0,
    food_supplies_days INT DEFAULT 7,
    medical_staff_present BOOLEAN DEFAULT TRUE,
    power_backup BOOLEAN DEFAULT TRUE,
    status TEXT NOT NULL CHECK (status IN ('open', 'filling_fast', 'near_capacity', 'full', 'closed')),
    contact_person TEXT,
    contact_phone TEXT,
    coordinates DOUBLE PRECISION[] NOT NULL,
    geom GEOMETRY(Point, 4326),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency Medical Hospitals
CREATE TABLE hospitals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    total_capacity INT NOT NULL,
    occupied_capacity INT DEFAULT 0,
    icu_beds_total INT DEFAULT 50,
    icu_beds_available INT DEFAULT 10,
    has_trauma_center BOOLEAN DEFAULT TRUE,
    status TEXT NOT NULL CHECK (status IN ('operational', 'normal', 'strained', 'near_capacity', 'full', 'diverting', 'flooded')),
    contact_person TEXT,
    contact_phone TEXT,
    coordinates DOUBLE PRECISION[] NOT NULL,
    geom GEOMETRY(Point, 4326),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Evacuation Routes
CREATE TABLE evacuation_routes (
    id TEXT PRIMARY KEY,
    origin_name TEXT NOT NULL,
    destination_shelter_name TEXT NOT NULL,
    destination_shelter_id TEXT REFERENCES shelters(id) ON DELETE SET NULL,
    distance_km DOUBLE PRECISION NOT NULL DEFAULT 5.2,
    estimated_time_minutes INT NOT NULL DEFAULT 15,
    safety_score_pct INT NOT NULL DEFAULT 95,
    hazards_avoided TEXT[] NOT NULL DEFAULT '{}',
    turn_by_turn_instructions TEXT[] NOT NULL DEFAULT '{}',
    waypoints DOUBLE PRECISION[][] NOT NULL,
    geom GEOMETRY(LineString, 4326),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weather Data Cache
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

-- ============================================================================
-- PILLAR III: INDUSTRIAL FACILITY SAFETY & FIRE EVACUATION MODULE
-- ============================================================================

-- Industrial Facilities
CREATE TABLE facilities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    industry TEXT NOT NULL DEFAULT 'Fireworks & Pyrotechnics',
    address TEXT NOT NULL,
    coordinates DOUBLE PRECISION[] NOT NULL,
    geom GEOMETRY(Point, 4326),
    licence_no TEXT,
    safety_officer TEXT NOT NULL,
    safety_officer_phone TEXT NOT NULL,
    blueprint_width_m DOUBLE PRECISION NOT NULL DEFAULT 240,
    blueprint_height_m DOUBLE PRECISION NOT NULL DEFAULT 150,
    blueprint_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Facility Zones (Rooms/Sheds/Yards)
CREATE TABLE facility_zones (
    id TEXT PRIMARY KEY,
    facility_id TEXT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('production', 'storage', 'chemical', 'office', 'utility', 'open_yard', 'corridor')),
    hazard_class TEXT NOT NULL CHECK (hazard_class IN ('explosive', 'flammable', 'toxic', 'standard')),
    x DOUBLE PRECISION NOT NULL,
    y DOUBLE PRECISION NOT NULL,
    w DOUBLE PRECISION NOT NULL,
    h DOUBLE PRECISION NOT NULL,
    headcount INT DEFAULT 0,
    notes TEXT
);

-- Blueprint Sensors (Indoor Heat/Smoke/Flame Detectors)
CREATE TABLE blueprint_sensors (
    id TEXT PRIMARY KEY,
    facility_id TEXT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    zone_id TEXT REFERENCES facility_zones(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('smoke', 'heat', 'flame', 'gas_leak', 'spark_detector', 'manual_call_point')),
    x DOUBLE PRECISION NOT NULL,
    y DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL DEFAULT 'normal' CHECK (status IN ('normal', 'warning', 'triggered', 'offline')),
    current_value DOUBLE PRECISION DEFAULT 0.0,
    unit TEXT DEFAULT '°C',
    threshold_critical DOUBLE PRECISION DEFAULT 65.0,
    battery_pct INT DEFAULT 100,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safe Muster Assembly Points
CREATE TABLE muster_hubs (
    id TEXT PRIMARY KEY,
    facility_id TEXT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    x DOUBLE PRECISION NOT NULL,
    y DOUBLE PRECISION NOT NULL,
    capacity INT NOT NULL DEFAULT 100,
    safe_radius_m DOUBLE PRECISION DEFAULT 30,
    is_primary BOOLEAN DEFAULT TRUE,
    landmark TEXT
);

-- Indoor Egress Exit Routes
CREATE TABLE exit_routes (
    id TEXT PRIMARY KEY,
    facility_id TEXT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    from_zone_id TEXT REFERENCES facility_zones(id) ON DELETE CASCADE,
    to_hub_id TEXT REFERENCES muster_hubs(id) ON DELETE CASCADE,
    waypoints JSONB NOT NULL, -- Array of {x, y}
    width_m DOUBLE PRECISION DEFAULT 2.5,
    distance_m DOUBLE PRECISION DEFAULT 45,
    is_primary BOOLEAN DEFAULT TRUE
);

-- Facility Employees (Roster)
CREATE TABLE facility_employees (
    id TEXT PRIMARY KEY,
    facility_id TEXT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    employee_code TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    department TEXT NOT NULL,
    shift TEXT DEFAULT 'A',
    assigned_zone_id TEXT REFERENCES facility_zones(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'unknown' CHECK (status IN ('safe_muster', 'unaccounted', 'in_hazard_zone', 'evacuating', 'unknown')),
    last_seen_time TIMESTAMP WITH TIME ZONE
);

-- Facility Incident Events
CREATE TABLE facility_incidents (
    id TEXT PRIMARY KEY,
    facility_id TEXT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    phase TEXT NOT NULL CHECK (phase IN ('triggered', 'verifying', 'evacuating', 'all_clear')),
    triggered_by_sensor_id TEXT REFERENCES blueprint_sensors(id) ON DELETE SET NULL,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    evacuation_order_at TIMESTAMP WITH TIME ZONE,
    all_clear_at TIMESTAMP WITH TIME ZONE,
    total_on_site INT DEFAULT 0,
    safe_count INT DEFAULT 0,
    unaccounted_count INT DEFAULT 0,
    incident_data JSONB
);

-- WhatsApp Emergency Dispatch Log
CREATE TABLE whatsapp_dispatches (
    id TEXT PRIMARY KEY,
    facility_id TEXT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    incident_id TEXT REFERENCES facility_incidents(id) ON DELETE CASCADE,
    employee_id TEXT REFERENCES facility_employees(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    stage TEXT NOT NULL CHECK (stage IN ('queued', 'sending', 'sent', 'failed')),
    provider TEXT NOT NULL DEFAULT 'simulated',
    message_text TEXT NOT NULL,
    response_received TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PILLAR IV: MULTI-AGENT AI, EXPLAINABILITY & SIMULATION AUDIT TRAIL
-- ============================================================================

-- Autonomous Agent Activity Stream
CREATE TABLE agent_logs (
    id TEXT PRIMARY KEY,
    agent_name TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'alert', 'success')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Explainable AI (XAI) Recommendation Proposals
CREATE TABLE xai_recommendations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    target_zone_id TEXT REFERENCES risk_zones(id) ON DELETE SET NULL,
    target_zone_name TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('evacuate', 'deploy_boats', 'open_sluice_gate', 'block_road', 'setup_relief', 'medical_dispatch')),
    priority TEXT NOT NULL CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    recommended_resources JSONB NOT NULL,
    reasoning JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'executed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Historical Decision Knowledge Base (RAG Matching)
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

-- Hydrodynamic What-If Simulation Runs
CREATE TABLE simulations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    rainfall_mm_hr DOUBLE PRECISION NOT NULL,
    dam_discharge_m3s DOUBLE PRECISION NOT NULL,
    canal_blockage_pct INT DEFAULT 50,
    bridge_status TEXT DEFAULT 'restricted',
    duration_hours INT DEFAULT 3,
    high_tide_overlap BOOLEAN DEFAULT FALSE,
    mitigations_applied JSONB,
    affected_zones_count INT DEFAULT 0,
    predicted_submerged_area_km2 DOUBLE PRECISION DEFAULT 0.0,
    estimated_affected_people INT DEFAULT 0,
    critical_road_blocks TEXT[] DEFAULT '{}',
    recommended_deployments JSONB,
    risk_timeline JSONB,
    ai_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency Alerts & Public Broadcasts
CREATE TABLE emergency_alerts (
    id TEXT PRIMARY KEY,
    headline TEXT NOT NULL,
    zone TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'danger', 'critical')),
    agencies_notified TEXT[] NOT NULL DEFAULT '{}',
    instructions TEXT NOT NULL,
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cascading Infrastructure Topology Nodes
CREATE TABLE cascading_nodes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    node_type TEXT NOT NULL CHECK (node_type IN ('power_substation', 'sluice_gate', 'telecom_tower', 'hospital_feeder', 'subway_pump')),
    criticality TEXT NOT NULL CHECK (criticality IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    risk_score DOUBLE PRECISION DEFAULT 50.0,
    status TEXT DEFAULT 'operational' CHECK (status IN ('operational', 'degraded', 'failed')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cascading Infrastructure Edge Dependencies
CREATE TABLE cascading_edges (
    id TEXT PRIMARY KEY,
    source_node_id TEXT REFERENCES cascading_nodes(id) ON DELETE CASCADE,
    target_node_id TEXT REFERENCES cascading_nodes(id) ON DELETE CASCADE,
    dependency_type TEXT NOT NULL,
    failure_impact_weight DOUBLE PRECISION DEFAULT 1.0
);

-- ============================================================================
-- POSTGIS TRIGGERS & SPATIAL HELPERS
-- ============================================================================

-- Auto-populate PostGIS Point Geometries from Coordinates Arrays [lat, lng]
CREATE OR REPLACE FUNCTION update_point_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.coordinates IS NOT NULL AND array_length(NEW.coordinates, 1) = 2 THEN
        NEW.geom = ST_SetSRID(ST_MakePoint(NEW.coordinates[2], NEW.coordinates[1]), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reports_geom BEFORE INSERT OR UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_point_geom();
CREATE TRIGGER trg_sensors_geom BEFORE INSERT OR UPDATE ON iot_sensors FOR EACH ROW EXECUTE FUNCTION update_point_geom();
CREATE TRIGGER trg_resources_geom BEFORE INSERT OR UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION update_point_geom();
CREATE TRIGGER trg_shelters_geom BEFORE INSERT OR UPDATE ON shelters FOR EACH ROW EXECUTE FUNCTION update_point_geom();
CREATE TRIGGER trg_hospitals_geom BEFORE INSERT OR UPDATE ON hospitals FOR EACH ROW EXECUTE FUNCTION update_point_geom();
CREATE TRIGGER trg_facilities_geom BEFORE INSERT OR UPDATE ON facilities FOR EACH ROW EXECUTE FUNCTION update_point_geom();

-- ============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ============================================================================

CREATE INDEX idx_reports_geom ON reports USING GIST (geom);
CREATE INDEX idx_sensors_geom ON iot_sensors USING GIST (geom);
CREATE INDEX idx_resources_geom ON resources USING GIST (geom);
CREATE INDEX idx_shelters_geom ON shelters USING GIST (geom);
CREATE INDEX idx_hospitals_geom ON hospitals USING GIST (geom);

CREATE INDEX idx_reports_status ON reports (status);
CREATE INDEX idx_sensors_status ON iot_sensors (status);
CREATE INDEX idx_resources_status ON resources (status);
CREATE INDEX idx_facility_employees_fac ON facility_employees (facility_id);
CREATE INDEX idx_agent_logs_time ON agent_logs (timestamp DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR FULL APP ACCESSIBILITY
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE shelters ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE evacuation_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprint_sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE muster_hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exit_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE xai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cascading_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cascading_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on reports" ON reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on risk_zones" ON risk_zones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on iot_sensors" ON iot_sensors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on resources" ON resources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on shelters" ON shelters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on hospitals" ON hospitals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on evacuation_routes" ON evacuation_routes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on weather_cache" ON weather_cache FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on facilities" ON facilities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on facility_zones" ON facility_zones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on blueprint_sensors" ON blueprint_sensors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on muster_hubs" ON muster_hubs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on exit_routes" ON exit_routes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on facility_employees" ON facility_employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on facility_incidents" ON facility_incidents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on whatsapp_dispatches" ON whatsapp_dispatches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on agent_logs" ON agent_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on xai_recommendations" ON xai_recommendations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on decision_knowledge" ON decision_knowledge FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on simulations" ON simulations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on emergency_alerts" ON emergency_alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on cascading_nodes" ON cascading_nodes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on cascading_edges" ON cascading_edges FOR ALL USING (true) WITH CHECK (true);

-- Schema setup complete.
