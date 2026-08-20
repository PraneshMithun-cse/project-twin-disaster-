import React, { useState, useEffect } from 'react';
import {
  Settings, Cpu, Database, Bell, Save, RotateCcw,
  MapPin, ShieldAlert, Radio, Layers, Key, Check, Zap,
  FileText, Volume2, Smartphone, SlidersHorizontal, AlertTriangle, UserCheck
} from 'lucide-react';

export interface MasterSettings {
  // 1. Operational & System
  systemName: string;
  commandHQ: string;
  defaultRegion: string;
  latitude: number;
  longitude: number;
  rainThresholdMmHr: number;
  damDischargeThresholdM3s: number;
  waterDepthThresholdM: number;
  autoDispatchRiskPct: number;
  defaultRoleMode: 'authority' | 'citizen';

  // 2. AI & Multi-Agent Engine
  grokModel: string;
  aiTemperature: number;
  maxTokens: number;
  scenarioMatchLimit: number;
  enableXaiAudit: boolean;
  systemPromptOverride: string;
  grokApiKey: string;

  // 3. GIS & Telemetry External API Integrations
  radarSyncIntervalSec: number;
  enableSentinelSar: boolean;
  enableNasaFirms: boolean;
  mapDefaultLayer: 'dark' | 'terrain' | 'satellite' | 'flood';
  defaultZoomLevel: number;
  hydroMeshResolution: 'low' | 'medium' | 'high';
  nasaFirmsMapKey: string;
  sentinelSarApiKey: string;
  imdRadarApiUrl: string;

  // 4. Alerts & Broadcasts External Service Credentials
  enableFcmPush: boolean;
  enableSmsBroadcast: boolean;
  enableAudioAlerts: boolean;
  citizenReportMinScore: number;
  showAlertBannerOnLoad: boolean;
  firebaseFcmServerKey: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;

  // 5. Database & API
  enableSupabaseSync: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  cacheTtlMins: number;
}

const DEFAULT_SETTINGS: MasterSettings = {
  // Operational
  systemName: 'ResponSync AI Disaster Command Center',
  commandHQ: 'Chennai Flood Operations HQ, Ripon Building',
  defaultRegion: 'Chennai Metropolitan Corridor (Velachery / Adyar / Cooum)',
  latitude: 13.0827,
  longitude: 80.2707,
  rainThresholdMmHr: 50,
  damDischargeThresholdM3s: 1000,
  waterDepthThresholdM: 1.2,
  autoDispatchRiskPct: 80,
  defaultRoleMode: 'authority',

  // AI & Multi-Agent
  grokModel: 'grok-2-latest',
  aiTemperature: 0.2,
  maxTokens: 2048,
  scenarioMatchLimit: 3,
  enableXaiAudit: true,
  systemPromptOverride: 'Act as Lead Disaster Command AI Agent for Urban Infrastructure Cascading Failure Optimization System. Output concise, actionable structured recommendations.',
  grokApiKey: '',

  // GIS & Telemetry
  radarSyncIntervalSec: 5,
  enableSentinelSar: true,
  enableNasaFirms: true,
  mapDefaultLayer: 'dark',
  defaultZoomLevel: 12,
  hydroMeshResolution: 'high',
  nasaFirmsMapKey: '',
  sentinelSarApiKey: '',
  imdRadarApiUrl: 'https://api.responsync-disaster.gov/gis/imd-radar-live',

  // Alerts & Broadcasts
  enableFcmPush: true,
  enableSmsBroadcast: true,
  enableAudioAlerts: true,
  citizenReportMinScore: 70,
  showAlertBannerOnLoad: true,
  firebaseFcmServerKey: '',
  twilioAccountSid: '',
  twilioAuthToken: '',
  twilioPhoneNumber: '',

  // Database & API
  enableSupabaseSync: true,
  supabaseUrl: 'https://xyzcompany.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  cacheTtlMins: 15
};

/* ── Presentational primitives — monochrome, hairline-ruled ──────────── */

const FIELD_CLASS =
  'w-full bg-paper border border-line rounded-[4px] px-3 py-2 text--body text-near placeholder:text-muted outline-none transition-colors focus:border-ink focus:ring-1 focus:ring-ink';

const RANGE_CLASS =
  'w-full h-[3px] bg-wash-strong rounded-full appearance-none cursor-pointer accent-ink';

/** Monochrome switch: #ddd track off, black track on, white knob with a 1px ring. */
const Toggle: React.FC<{
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
}> = ({ checked, onChange, label }) => (
  <label className="relative inline-flex items-center shrink-0 cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
      className="sr-only peer"
    />
    <span className="block w-10 h-6 rounded-full bg-line ring-1 ring-line transition-colors peer-checked:bg-ink peer-checked:ring-ink" />
    <span className="pointer-events-none absolute left-[3px] top-[3px] w-[18px] h-[18px] rounded-full bg-paper ring-1 ring-line transition-transform peer-checked:translate-x-[16px] peer-checked:ring-ink" />
  </label>
);

/** Connection state, always a mark paired with its word — never a colored dot. */
const ConnectionStatus: React.FC<{ connected: boolean }> = ({ connected }) => (
  <span className="text--eyebrow flex items-center gap-2 shrink-0">
    <span className={`sev-mark ${connected ? 'sev-mark--ok' : 'sev-mark--critical'}`} />
    <span className={connected ? 'sev-text--ok' : 'sev-text--critical'}>
      {connected ? 'Connected' : 'Not configured'}
    </span>
  </span>
);

/** Section title with the 1px rule underneath. */
const SectionHead: React.FC<{ title: string; description?: string }> = ({ title, description }) => (
  <div className="border-b border-line pb-3">
    <h3 className="text--subtitle3 text-ink">{title}</h3>
    {description && <p className="text--footnote text-muted mt-1.5">{description}</p>}
  </div>
);

/** A settings row: label + description on the left, control on the right. */
const SettingRow: React.FC<{
  label: string;
  description?: string;
  children: React.ReactNode;
}> = ({ label, description, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-line last:border-b-0">
    <div className="max-w-xl">
      <span className="text--body-medium text-ink block">{label}</span>
      {description && <span className="text--footnote text-muted block mt-1">{description}</span>}
    </div>
    <div className="w-full sm:w-auto sm:min-w-[280px] flex sm:justify-end">{children}</div>
  </div>
);

/** A slider row — the value reads as tabular figures. */
const SliderRow: React.FC<{
  label: string;
  description?: string;
  value: string;
  children: React.ReactNode;
}> = ({ label, description, value, children }) => (
  <div className="py-4 border-b border-line last:border-b-0 space-y-2.5">
    <div className="flex items-baseline justify-between gap-4">
      <span className="text--body-medium text-ink">{label}</span>
      <span className="text--footnote text-ink tabular-nums shrink-0">{value}</span>
    </div>
    {children}
    {description && <p className="text--footnote text-muted">{description}</p>}
  </div>
);

/** Instructional "how to connect" block — recessed wash, no code colouring. */
const HowTo: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="panel--wash p-3 space-y-1.5">
    <p className="text--eyebrow text-muted">{title}</p>
    <div className="text--footnote text-subtle space-y-1">{children}</div>
  </div>
);

const LINK_CLASS = 'text-ink underline underline-offset-2 hover:text-subtle transition-colors';
const CODE_CLASS = 'text-near';

export default function SettingsPanel() {
  const [settings, setSettings] = useState<MasterSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'gis' | 'alerts' | 'database'>('general');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Load saved settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('responsync_master_settings');
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.warn('Failed to parse saved settings from localStorage', e);
    }
  }, []);

  const handleChange = <K extends keyof MasterSettings>(key: K, value: MasterSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem('responsync_master_settings', JSON.stringify(settings));

      // Dispatch custom event so other components can react immediately if needed
      window.dispatchEvent(new CustomEvent('responsync_settings_updated', { detail: settings }));

      setSaveStatus('Master Settings saved successfully!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e) {
      setSaveStatus('Failed to save settings to localStorage.');
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset ALL Master Settings to factory defaults?')) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.removeItem('responsync_master_settings');
      window.dispatchEvent(new CustomEvent('responsync_settings_updated', { detail: DEFAULT_SETTINGS }));
      setSaveStatus('Reset to factory default configurations!');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const TABS: { id: 'general' | 'ai' | 'gis' | 'alerts' | 'database'; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'General & operational', icon: MapPin },
    { id: 'ai', label: 'Multi-agent AI engine', icon: Cpu },
    { id: 'gis', label: 'GIS & telemetry', icon: Radio },
    { id: 'alerts', label: 'Alerts & broadcasts', icon: Bell },
    { id: 'database', label: 'Database & API keys', icon: Database }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 bg-paper text-near font-sans">

      {/* Top Header Banner */}
      <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 pb-8 border-b border-line">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text--eyebrow text-muted">Master system control center</span>
            <span className="text--footnote text-muted tabular-nums">v3.4.0 high-availability</span>
          </div>
          <h2 className="text--subtitle1 font-light text-ink flex items-center gap-3">
            <SlidersHorizontal className="w-5 h-5 text-ink shrink-0" strokeWidth={1.5} />
            ResponSync master configuration
          </h2>
          <p className="text--body text-subtle mt-4">
            Configure every core parameter across operational thresholds, multi-agent AI models,
            GIS radar syncs, FCM broadcasts, and database persistence.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleReset}
            className="cta cta--secondary cta--compact"
            title="Reset to Factory Defaults"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-2" strokeWidth={1.5} /> Reset
          </button>
          <button
            onClick={handleSave}
            className="cta cta--primary cta--compact"
          >
            <Save className="w-3.5 h-3.5 mr-2" strokeWidth={1.5} /> Save all
          </button>
        </div>
      </header>

      {/* Save Status Alert Banner */}
      {saveStatus && (
        <div className="panel--wash px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="sev-mark sev-mark--ok" />
            <span className="text--body text-near">{saveStatus}</span>
          </div>
          <span className="text--eyebrow text-muted">System synchronized</span>
        </div>
      )}

      {/* Settings Category Navigation Tabs */}
      <div className="flex border-b border-line overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text--body whitespace-nowrap cursor-pointer transition-colors border-b-2 -mb-px ${
                isActive
                  ? 'border-ink text-ink font-medium'
                  : 'border-transparent text-muted hover:text-near'
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={1.5} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Settings Content Area */}
      <div className="space-y-10">

        {/* TAB 1: GENERAL & OPERATIONAL */}
        {activeTab === 'general' && (
          <div className="space-y-10">
            <section>
              <SectionHead
                title="Command HQ & regional operational parameters"
                description="Define core disaster management center details and critical alert threshold triggers."
              />

              <SettingRow
                label="System name"
                description="Displayed in main navigation, headers, and official reports."
              >
                <input
                  type="text"
                  value={settings.systemName}
                  onChange={(e) => handleChange('systemName', e.target.value)}
                  className={FIELD_CLASS}
                />
              </SettingRow>

              <SettingRow
                label="Command HQ facility name"
                description="Primary operational dispatch building location."
              >
                <input
                  type="text"
                  value={settings.commandHQ}
                  onChange={(e) => handleChange('commandHQ', e.target.value)}
                  className={FIELD_CLASS}
                />
              </SettingRow>

              <SettingRow
                label="Primary regional corridor"
                description="Geographic corridor this command center is responsible for."
              >
                <input
                  type="text"
                  value={settings.defaultRegion}
                  onChange={(e) => handleChange('defaultRegion', e.target.value)}
                  className={FIELD_CLASS}
                />
              </SettingRow>

              <SettingRow
                label="Center latitude (°N)"
                description="Map viewport anchor point, north–south."
              >
                <input
                  type="number"
                  step="0.0001"
                  value={settings.latitude}
                  onChange={(e) => handleChange('latitude', parseFloat(e.target.value))}
                  className={`${FIELD_CLASS} tabular-nums`}
                />
              </SettingRow>

              <SettingRow
                label="Center longitude (°E)"
                description="Map viewport anchor point, east–west."
              >
                <input
                  type="number"
                  step="0.0001"
                  value={settings.longitude}
                  onChange={(e) => handleChange('longitude', parseFloat(e.target.value))}
                  className={`${FIELD_CLASS} tabular-nums`}
                />
              </SettingRow>
            </section>

            {/* Threshold Sliders */}
            <section>
              <SectionHead
                title="Disaster trigger thresholds"
                description="Values at which the system escalates automatically."
              />

              <SliderRow
                label="Heavy rainfall trigger"
                value={`${settings.rainThresholdMmHr} mm/hr`}
                description="Triggers flash flood warning state on Digital Twin map overlays."
              >
                <input
                  type="range"
                  min="10"
                  max="150"
                  step="5"
                  value={settings.rainThresholdMmHr}
                  onChange={(e) => handleChange('rainThresholdMmHr', parseInt(e.target.value))}
                  className={RANGE_CLASS}
                />
              </SliderRow>

              <SliderRow
                label="Dam discharge critical rate"
                value={`${settings.damDischargeThresholdM3s} m³/s`}
                description="Triggers downstream Adyar/Cooum estuarine overflow simulations."
              >
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={settings.damDischargeThresholdM3s}
                  onChange={(e) => handleChange('damDischargeThresholdM3s', parseInt(e.target.value))}
                  className={RANGE_CLASS}
                />
              </SliderRow>

              <SliderRow
                label="Submergence evacuation depth"
                value={`${settings.waterDepthThresholdM} meters`}
                description="Depth at which automated boat rerouting & evacuation detours trigger."
              >
                <input
                  type="range"
                  min="0.3"
                  max="3.0"
                  step="0.1"
                  value={settings.waterDepthThresholdM}
                  onChange={(e) => handleChange('waterDepthThresholdM', parseFloat(e.target.value))}
                  className={RANGE_CLASS}
                />
              </SliderRow>

              <SliderRow
                label="Auto-dispatch risk confidence"
                value={`${settings.autoDispatchRiskPct}%`}
                description="Multi-Agent AI certainty score required before automated dispatch order generation."
              >
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={settings.autoDispatchRiskPct}
                  onChange={(e) => handleChange('autoDispatchRiskPct', parseInt(e.target.value))}
                  className={RANGE_CLASS}
                />
              </SliderRow>
            </section>
          </div>
        )}

        {/* TAB 2: MULTI-AGENT AI ENGINE */}
        {activeTab === 'ai' && (
          <div className="space-y-10">
            <section>
              <SectionHead
                title="Multi-agent AI pipeline & Grok configuration"
                description="Controls how the AI interprets situations, triggers automated responses, and limits search depth."
              />

              <SettingRow
                label="Primary Grok model alias"
                description="Selected model handles multi-agent cascading impact & dispatch reasoning."
              >
                <select
                  value={settings.grokModel}
                  onChange={(e) => handleChange('grokModel', e.target.value)}
                  className={FIELD_CLASS}
                >
                  <option value="grok-2-latest">grok-2-latest (recommended for live reasoning)</option>
                  <option value="grok-beta">grok-beta (fast response)</option>
                  <option value="grok-vision-beta">grok-vision-beta (deep multimodal analysis)</option>
                </select>
              </SettingRow>

              <SettingRow
                label="Historical scenario retrieval limit"
                description="Number of historical disaster incidents compared in Supabase PostGIS vector search."
              >
                <select
                  value={settings.scenarioMatchLimit}
                  onChange={(e) => handleChange('scenarioMatchLimit', parseInt(e.target.value))}
                  className={FIELD_CLASS}
                >
                  <option value={1}>Top 1 historical incident</option>
                  <option value={3}>Top 3 historical incidents (standard)</option>
                  <option value={5}>Top 5 historical incidents (extended)</option>
                </select>
              </SettingRow>

              <SliderRow
                label="Model temperature (creativity vs determinism)"
                value={`${settings.aiTemperature}`}
              >
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={settings.aiTemperature}
                  onChange={(e) => handleChange('aiTemperature', parseFloat(e.target.value))}
                  className={RANGE_CLASS}
                />
                <div className="flex justify-between gap-3 text--footnote text-muted tabular-nums">
                  <span>0.0 strict deterministic</span>
                  <span className="hidden sm:inline">0.5 balanced</span>
                  <span>1.0 creative counterfactuals</span>
                </div>
              </SliderRow>

              <SettingRow
                label="Explainable AI (XAI) decision logging"
                description="Generate counterfactual analysis and evidence chain trees for every authority recommendation."
              >
                <Toggle
                  checked={settings.enableXaiAudit}
                  onChange={(e) => handleChange('enableXaiAudit', e.target.checked)}
                  label="Explainable AI decision logging"
                />
              </SettingRow>

              <SettingRow
                label="Global system directive injection"
                description="Base instruction prepended to all Multi-Agent AI generation prompts."
              >
                <textarea
                  rows={4}
                  value={settings.systemPromptOverride}
                  onChange={(e) => handleChange('systemPromptOverride', e.target.value)}
                  className={FIELD_CLASS}
                />
              </SettingRow>
            </section>
          </div>
        )}

        {/* TAB 3: GIS & TELEMETRY */}
        {activeTab === 'gis' && (
          <div className="space-y-10">
            <section>
              <SectionHead
                title="GIS, radar & satellite telemetry"
                description="Configure Doppler radar sync frequency, satellite imagery feeds, and hydrodynamic mesh precision."
              />

              <SliderRow
                label="Doppler radar refresh frequency"
                value={`${settings.radarSyncIntervalSec} seconds`}
                description="Interval for fetching live IMD rainfall intensity layers."
              >
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={settings.radarSyncIntervalSec}
                  onChange={(e) => handleChange('radarSyncIntervalSec', parseInt(e.target.value))}
                  className={RANGE_CLASS}
                />
              </SliderRow>

              <SliderRow
                label="Default digital twin map zoom"
                value={`Level ${settings.defaultZoomLevel}`}
                description="Initial viewport zoom level on map load."
              >
                <input
                  type="range"
                  min="8"
                  max="18"
                  step="1"
                  value={settings.defaultZoomLevel}
                  onChange={(e) => handleChange('defaultZoomLevel', parseInt(e.target.value))}
                  className={RANGE_CLASS}
                />
              </SliderRow>

              <SettingRow
                label="Default map visual theme"
                description="Base layer shown when the digital twin first loads."
              >
                <select
                  value={settings.mapDefaultLayer}
                  onChange={(e) => handleChange('mapDefaultLayer', e.target.value as any)}
                  className={FIELD_CLASS}
                >
                  <option value="dark">Dark tactical vectors</option>
                  <option value="terrain">Topographic contour terrain</option>
                  <option value="satellite">Sentinel-2 optical satellite</option>
                  <option value="flood">High-contrast inundation overlay</option>
                </select>
              </SettingRow>

              <SettingRow
                label="Hydrodynamic simulation mesh"
                description="Grid resolution used by the water flow solver."
              >
                <select
                  value={settings.hydroMeshResolution}
                  onChange={(e) => handleChange('hydroMeshResolution', e.target.value as any)}
                  className={FIELD_CLASS}
                >
                  <option value="low">Coarse grid (fastest / low CPU)</option>
                  <option value="medium">Medium precision grid</option>
                  <option value="high">Dense 10m mesh (maximum accuracy)</option>
                </select>
              </SettingRow>

              <SettingRow
                label="ESA Sentinel-1 SAR synthetic aperture radar"
                description="Cloud-penetrating all-weather flood boundary detection."
              >
                <Toggle
                  checked={settings.enableSentinelSar}
                  onChange={(e) => handleChange('enableSentinelSar', e.target.checked)}
                  label="ESA Sentinel-1 SAR feed"
                />
              </SettingRow>

              <SettingRow
                label="NASA FIRMS thermal anomaly feed"
                description="Near real-time hotspot detection for cascading electrical fires."
              >
                <Toggle
                  checked={settings.enableNasaFirms}
                  onChange={(e) => handleChange('enableNasaFirms', e.target.checked)}
                  label="NASA FIRMS thermal anomaly feed"
                />
              </SettingRow>
            </section>

            {/* EXTERNAL SATELLITE & RADAR PROVIDER API INTEGRATIONS */}
            <section className="space-y-6">
              <SectionHead
                title="External telemetry credentials & live endpoints"
                description="Credentials for satellite and radar providers. Environment variables take precedence."
              />

              {/* NASA FIRMS MAPKEY */}
              <div className="space-y-2 pb-6 border-b border-line">
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <label className="text--body-medium text-ink">NASA FIRMS MAPKEY (hotspot telemetry)</label>
                  <ConnectionStatus connected={!!settings.nasaFirmsMapKey} />
                </div>
                <input
                  type="password"
                  placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j"
                  value={settings.nasaFirmsMapKey}
                  onChange={(e) => handleChange('nasaFirmsMapKey', e.target.value)}
                  className={FIELD_CLASS}
                />
                <HowTo title="How to connect NASA FIRMS">
                  <p>1. Register at <a href="https://firms.modaps.eosdis.nasa.gov/api/map_key/" target="_blank" rel="noreferrer" className={LINK_CLASS}>firms.modaps.eosdis.nasa.gov/api/map_key</a></p>
                  <p>2. Request a free MAPKEY token sent to your email.</p>
                  <p>3. Paste the token above or declare <code className={CODE_CLASS}>NASA_FIRMS_MAPKEY</code> in your environment.</p>
                </HowTo>
              </div>

              {/* ESA Sentinel SAR Token */}
              <div className="space-y-2 pb-6 border-b border-line">
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <label className="text--body-medium text-ink">ESA Copernicus Sentinel-1 API key / token</label>
                  <ConnectionStatus connected={!!settings.sentinelSarApiKey} />
                </div>
                <input
                  type="password"
                  placeholder="e.g. Bearer eyJhbGciOi..."
                  value={settings.sentinelSarApiKey}
                  onChange={(e) => handleChange('sentinelSarApiKey', e.target.value)}
                  className={FIELD_CLASS}
                />
                <HowTo title="How to connect Copernicus Data Space Ecosystem">
                  <p>1. Register a free account at <a href="https://dataspace.copernicus.eu/" target="_blank" rel="noreferrer" className={LINK_CLASS}>dataspace.copernicus.eu</a></p>
                  <p>2. Generate an OAuth client secret token for Sentinel-1 synthetic aperture radar.</p>
                  <p>3. Paste the bearer token above or set <code className={CODE_CLASS}>SENTINEL_SAR_API_KEY</code>.</p>
                </HowTo>
              </div>

              {/* IMD Radar Endpoint */}
              <div className="space-y-2">
                <label className="text--body-medium text-ink block">IMD live Doppler radar REST endpoint</label>
                <input
                  type="text"
                  value={settings.imdRadarApiUrl}
                  onChange={(e) => handleChange('imdRadarApiUrl', e.target.value)}
                  className={FIELD_CLASS}
                />
                <span className="text--footnote text-muted block">
                  Custom regional radar server endpoint URL for live precipitation reflectivity rasters.
                </span>
              </div>
            </section>
          </div>
        )}

        {/* TAB 4: ALERTS & BROADCASTS */}
        {activeTab === 'alerts' && (
          <div className="space-y-10">
            <section>
              <SectionHead
                title="Emergency notifications & public broadcast gateway"
                description="Manage mobile push notifications, citizen report validation scores, and siren audio cues."
              />

              <SettingRow
                label="Firebase Cloud Messaging (FCM) push gateway"
                description="Automatically transmit urgent evacuation alerts to registered mobile apps."
              >
                <Toggle
                  checked={settings.enableFcmPush}
                  onChange={(e) => handleChange('enableFcmPush', e.target.checked)}
                  label="FCM push gateway"
                />
              </SettingRow>

              <SettingRow
                label="National emergency SMS cell broadcast (CAP / Twilio)"
                description="Cellular broadcast to all citizens in geofenced affected sectors."
              >
                <Toggle
                  checked={settings.enableSmsBroadcast}
                  onChange={(e) => handleChange('enableSmsBroadcast', e.target.checked)}
                  label="Emergency SMS cell broadcast"
                />
              </SettingRow>

              <SettingRow
                label="Audible siren chimes on critical alerts"
                description="Play the emergency audio siren in the command room when a new flash flood alert arrives."
              >
                <Toggle
                  checked={settings.enableAudioAlerts}
                  onChange={(e) => handleChange('enableAudioAlerts', e.target.checked)}
                  label="Audible siren chimes"
                />
              </SettingRow>

              <SliderRow
                label="Citizen report auto-verification threshold"
                value={`${settings.citizenReportMinScore}% confidence`}
                description="Reports scoring above this credibility score automatically route to first responder queues."
              >
                <input
                  type="range"
                  min="40"
                  max="95"
                  step="5"
                  value={settings.citizenReportMinScore}
                  onChange={(e) => handleChange('citizenReportMinScore', parseInt(e.target.value))}
                  className={RANGE_CLASS}
                />
              </SliderRow>
            </section>

            {/* BROADCAST GATEWAYS SERVICE CREDENTIALS */}
            <section className="space-y-6">
              <SectionHead
                title="Emergency broadcast service integration keys"
                description="Credentials for the push and SMS gateways. Environment variables take precedence."
              />

              {/* FCM Config Box */}
              <div className="space-y-2 pb-6 border-b border-line">
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <label className="text--body-medium text-ink flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-muted" strokeWidth={1.5} />
                    FCM server key / service account private key
                  </label>
                  <ConnectionStatus connected={!!settings.firebaseFcmServerKey} />
                </div>
                <input
                  type="password"
                  placeholder="e.g. AAAAnX...:APA91b..."
                  value={settings.firebaseFcmServerKey}
                  onChange={(e) => handleChange('firebaseFcmServerKey', e.target.value)}
                  className={FIELD_CLASS}
                />
                <HowTo title="How to connect FCM">
                  <p>1. Open <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className={LINK_CLASS}>Firebase Console</a> &gt; Project Settings &gt; Cloud Messaging.</p>
                  <p>2. Enable the Cloud Messaging API and copy your server key, or generate a service account JSON.</p>
                  <p>3. Paste the key above or set <code className={CODE_CLASS}>FIREBASE_FCM_SERVER_KEY</code> in environment variables.</p>
                </HowTo>
              </div>

              {/* Twilio Config Box */}
              <div className="space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <h4 className="text--body-medium text-ink flex items-center gap-2">
                    <Zap className="w-4 h-4 text-muted" strokeWidth={1.5} />
                    Twilio cell broadcast / mass SMS gateway
                  </h4>
                  <ConnectionStatus
                    connected={!!settings.twilioAccountSid && !!settings.twilioAuthToken && !!settings.twilioPhoneNumber}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text--eyebrow text-muted block">Twilio account SID</label>
                    <input
                      type="text"
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={settings.twilioAccountSid}
                      onChange={(e) => handleChange('twilioAccountSid', e.target.value)}
                      className={FIELD_CLASS}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text--eyebrow text-muted block">Twilio auth token</label>
                    <input
                      type="password"
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={settings.twilioAuthToken}
                      onChange={(e) => handleChange('twilioAuthToken', e.target.value)}
                      className={FIELD_CLASS}
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text--eyebrow text-muted block">Twilio active sender phone number</label>
                    <input
                      type="text"
                      placeholder="+18005550199"
                      value={settings.twilioPhoneNumber}
                      onChange={(e) => handleChange('twilioPhoneNumber', e.target.value)}
                      className={`${FIELD_CLASS} tabular-nums`}
                    />
                  </div>
                </div>

                <HowTo title="How to connect Twilio emergency SMS">
                  <p>1. Sign up at <a href="https://console.twilio.com" target="_blank" rel="noreferrer" className={LINK_CLASS}>console.twilio.com</a></p>
                  <p>2. Copy the account SID &amp; auth token from the console dashboard.</p>
                  <p>3. Get an active SMS-enabled phone number and enter it above.</p>
                  <p>4. Alternatively set <code className={CODE_CLASS}>TWILIO_ACCOUNT_SID</code>, <code className={CODE_CLASS}>TWILIO_AUTH_TOKEN</code>, <code className={CODE_CLASS}>TWILIO_PHONE_NUMBER</code> in environment.</p>
                </HowTo>
              </div>
            </section>
          </div>
        )}

        {/* TAB 5: DATABASE & API KEYS */}
        {activeTab === 'database' && (
          <div className="space-y-10">
            <section>
              <SectionHead 
                title="Database, Supabase PostGIS & Grok API keys"
                description="Manage backend database connections, Grok API keys, caching TTLs, and service endpoints."
              />

              {/* Grok API Key Box */}
              <div className="flex flex-col gap-3 p-6 bg-paper border border-line rounded-lg">
                <div className="flex justify-between items-center">
                  <label className="text--body-medium text-ink">xAI Grok API key(s)</label>
                  <ConnectionStatus connected={!!settings.grokApiKey} />
                </div>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    value={settings.grokApiKey}
                    onChange={(e) => handleChange('grokApiKey', e.target.value)}
                    placeholder="xai-xxxxxxxxxxxxxxxxx"
                    className={`${FIELD_CLASS} pl-10 bg-white`}
                  />
                </div>
                <div className="text-sm text-gray-500 mt-2 space-y-1">
                  <p>1. Get a key from the <a href="https://console.x.ai" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">xAI Console</a>.</p>
                  <p>2. Paste multiple comma-separated keys above, or set <code className={CODE_CLASS}>GROK_API_KEY=key1</code> in environment.</p>
                  <p>The server round-robins requests and fails over instantly on 429 quota errors.</p>
                </div>
              </div>

              <SettingRow
                label="Supabase PostGIS historical database sync"
                description="Persist incidents, multi-agent decisions, and shelter capacities to the cloud PostgreSQL database."
              >
                <Toggle
                  checked={settings.enableSupabaseSync}
                  onChange={(e) => handleChange('enableSupabaseSync', e.target.checked)}
                  label="Supabase PostGIS sync"
                />
              </SettingRow>

              <SettingRow
                label="Supabase project URL"
                description="Base REST endpoint of your Supabase project."
              >
                <input
                  type="text"
                  value={settings.supabaseUrl}
                  onChange={(e) => handleChange('supabaseUrl', e.target.value)}
                  className={FIELD_CLASS}
                />
              </SettingRow>

              <SettingRow
                label="Supabase anon key"
                description="Public anon key used by the browser client."
              >
                <div className="w-full space-y-2">
                  <input
                    type="password"
                    value={settings.supabaseAnonKey}
                    onChange={(e) => handleChange('supabaseAnonKey', e.target.value)}
                    className={FIELD_CLASS}
                  />
                  <div className="flex sm:justify-end">
                    <ConnectionStatus connected={!!settings.supabaseUrl && !!settings.supabaseAnonKey} />
                  </div>
                </div>
              </SettingRow>

              <SliderRow
                label="GIS vector data cache TTL"
                value={`${settings.cacheTtlMins} minutes`}
                description="Cache expiration time for static GIS road network shapefiles."
              >
                <input
                  type="range"
                  min="1"
                  max="60"
                  step="1"
                  value={settings.cacheTtlMins}
                  onChange={(e) => handleChange('cacheTtlMins', parseInt(e.target.value))}
                  className={RANGE_CLASS}
                />
              </SliderRow>
            </section>
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div className="pt-6 border-t border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text--footnote text-muted">
            <Key className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>All modifications are persisted to local storage and active session state.</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleReset}
              className="cta cta--secondary cta--compact"
            >
              Reset defaults
            </button>
            <button
              onClick={handleSave}
              className="cta cta--primary cta--compact"
            >
              <Save className="w-3.5 h-3.5 mr-2" strokeWidth={1.5} /> Save configuration
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
