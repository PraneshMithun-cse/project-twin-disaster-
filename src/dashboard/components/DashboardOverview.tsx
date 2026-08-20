import React from 'react';
import {
  AlertTriangle,
  Truck,
  Home,
  Hospital,
  CloudRain,
  ArrowRight,
  Sparkles,
  Activity,
  ShieldAlert
} from 'lucide-react';
import { 
  ZoneRisk, 
  IoTSensorNode, 
  EmergencyResource, 
  EmergencyShelter, 
  CitizenReport, 
  EvacuationRoute,
  EmergencyHospital,
  AgentActivityLog
} from '../../shared/types';
import { DigitalTwinMap } from './DigitalTwinMap';

interface DashboardOverviewProps {
  zones: ZoneRisk[];
  sensors: IoTSensorNode[];
  resources: EmergencyResource[];
  shelters: EmergencyShelter[];
  reports: CitizenReport[];
  hospitals: EmergencyHospital[];
  agentLogs?: AgentActivityLog[];
  evacuationRoute: EvacuationRoute | null;
  timeHorizon: number;
  setTimeHorizon: (val: number) => void;
  onSelectReport: (report: CitizenReport) => void;
  onSelectZone: (zoneId: string) => void;
  onNavigateToTab: (tabId: string) => void;
}

/* Monochrome severity mapping — mark, row rule and badge are always paired
   with a written word, since there is no hue to carry the meaning. */
const severityMark = (severity: string) =>
  severity === 'critical' ? 'sev-mark--critical'
  : severity === 'high' ? 'sev-mark--advisory'
  : severity === 'medium' ? 'sev-mark--info'
  : 'sev-mark--ok';

const severityRow = (severity: string) =>
  severity === 'critical' ? 'sev-row--critical'
  : severity === 'high' ? 'sev-row--advisory'
  : 'sev-row--info';

const severityBadge = (severity: string) =>
  severity === 'critical' ? 'badge--critical'
  : severity === 'high' ? 'badge--advisory'
  : severity === 'medium' ? 'badge--info'
  : 'badge--quiet';

const logBadge = (severity: string) =>
  severity === 'critical' || severity === 'alert' ? 'badge--critical'
  : severity === 'high' || severity === 'warning' ? 'badge--advisory'
  : 'badge--info';

export default function DashboardOverview({
  zones,
  sensors,
  resources,
  shelters,
  reports,
  hospitals,
  agentLogs,
  evacuationRoute,
  timeHorizon,
  setTimeHorizon,
  onSelectReport,
  onSelectZone,
  onNavigateToTab
}: DashboardOverviewProps) {

  // Dynamic calculations from real datasets
  const activeReports = reports.filter(r => r.status !== 'resolved');
  const criticalReports = activeReports.filter(r => r.severity === 'critical' || r.severity === 'high');
  const deployedResources = resources.filter(r => r.status === 'deployed' || r.status === 'en_route');
  const availableResources = resources.filter(r => r.status === 'available');
  const openSheltersCount = shelters.filter(s => s.status === 'open' || s.status === 'near_capacity').length;
  const fullShelters = shelters.filter(s => s.status === 'near_capacity' || s.status === 'full').length;
  const capacityHospitalsCount = hospitals.filter(h => h.status === 'near_capacity' || h.status === 'full').length;

  const currentRainfall = zones.length > 0
    ? Math.round(zones.reduce((acc, z) => acc + (z.rainfallRateMmHr || 0), 0) / zones.length)
    : 85;

  const rainfallRiskText = currentRainfall >= 75 ? 'Critical Risk' : currentRainfall >= 45 ? 'High Risk' : 'Moderate';
  const rainfallMark = currentRainfall >= 75 ? 'sev-mark--critical' : currentRainfall >= 45 ? 'sev-mark--advisory' : 'sev-mark--info';

  return (
    <div className="space-y-6 font-sans text-near pb-8">
      
      {/* 1. KPI strip — the one floating layer on this page. A single glass
           container holds five flat tiles so the row reads as one instrument
           cluster; the tiles themselves stay flat (no nested glass) and are
           separated by `.glass-rule` hairlines. */}
      <div className="glass p-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-1 lg:gap-0">
        
        {/* Active Incidents */}
        <div
          onClick={() => onNavigateToTab('incidents')}
          className="relative rounded-xl p-3.5 flex items-start justify-between gap-3 cursor-pointer transition-all duration-[250ms] hover:bg-rose-50/60 text-slate-900"
          title="Click to view Active Incidents"
        >
          <div className="space-y-1.5 min-w-0">
            <span className="text--eyebrow text-slate-500 block">Active Incidents</span>
            <div className="text-3xl font-light text-rose-600 tabular-nums">{activeReports.length}</div>
            <div className="text--footnote text-slate-600 flex items-center gap-1.5">
              <span className={`sev-mark ${severityMark('critical')}`} />
              <span className="tabular-nums font-semibold">{criticalReports.length}</span> Critical Level
            </div>
          </div>
          <AlertTriangle className="w-[18px] h-[18px] text-rose-500 shrink-0" strokeWidth={1.5} />
        </div>

        {/* Resources Deployed */}
        <div
          onClick={() => onNavigateToTab('resources')}
          className="relative rounded-xl p-3.5 flex items-start justify-between gap-3 cursor-pointer transition-all duration-[250ms] hover:bg-emerald-50/60 text-slate-900"
          title="Click to view Fleet Operations"
        >
          <span
            aria-hidden="true"
            className="glass-rule absolute left-0 top-3 bottom-3 w-px hidden lg:block"
          />
          <div className="space-y-1.5 min-w-0">
            <span className="text--eyebrow text-slate-500 block">Resources Deployed</span>
            <div className="text-3xl font-light text-emerald-600 tabular-nums">{deployedResources.length}</div>
            <div className="text--footnote text-slate-600 flex items-center gap-1.5">
              <span className="sev-mark sev-mark--ok" />
              <span className="tabular-nums font-semibold">{availableResources.length}</span> Units Ready
            </div>
          </div>
          <Truck className="w-[18px] h-[18px] text-emerald-500 shrink-0" strokeWidth={1.5} />
        </div>

        {/* Open Shelters */}
        <div
          onClick={() => onNavigateToTab('shelters')}
          className="relative rounded-xl p-3.5 flex items-start justify-between gap-3 cursor-pointer transition-all duration-[250ms] hover:bg-sky-50/60 text-slate-900"
          title="Click to view Emergency Shelters"
        >
          <span
            aria-hidden="true"
            className="glass-rule absolute left-0 top-3 bottom-3 w-px hidden lg:block"
          />
          <div className="space-y-1.5 min-w-0">
            <span className="text--eyebrow text-slate-500 block">Open Shelters</span>
            <div className="text-3xl font-light text-sky-600 tabular-nums">{openSheltersCount}</div>
            <div className="text--footnote text-slate-600 flex items-center gap-1.5">
              <span className={`sev-mark ${fullShelters > 0 ? 'sev-mark--advisory' : 'sev-mark--ok'}`} />
              <span className="tabular-nums font-semibold">{fullShelters}</span> Near Capacity
            </div>
          </div>
          <Home className="w-[18px] h-[18px] text-sky-500 shrink-0" strokeWidth={1.5} />
        </div>

        {/* Hospitals Online */}
        <div
          onClick={() => onNavigateToTab('hospitals')}
          className="relative rounded-xl p-3.5 flex items-start justify-between gap-3 cursor-pointer transition-all duration-[250ms] hover:bg-indigo-50/60 text-slate-900"
          title="Click to view Emergency Hospitals"
        >
          <span
            aria-hidden="true"
            className="glass-rule absolute left-0 top-3 bottom-3 w-px hidden lg:block"
          />
          <div className="space-y-1.5 min-w-0">
            <span className="text--eyebrow text-slate-500 block">Hospitals Online</span>
            <div className="text-3xl font-light text-indigo-600 tabular-nums">{hospitals.length}</div>
            <div className="text--footnote text-slate-600 flex items-center gap-1.5">
              <span className={`sev-mark ${capacityHospitalsCount > 0 ? 'sev-mark--advisory' : 'sev-mark--ok'}`} />
              <span className="tabular-nums font-semibold">{capacityHospitalsCount}</span> ER At Capacity
            </div>
          </div>
          <Hospital className="w-[18px] h-[18px] text-indigo-500 shrink-0" strokeWidth={1.5} />
        </div>

        {/* Rainfall (24h) */}
        <div
          onClick={() => onNavigateToTab('twin_map')}
          className="relative rounded-xl p-3.5 flex items-start justify-between gap-3 cursor-pointer transition-all duration-[250ms] hover:bg-amber-50/60 text-slate-900"
          title="Click to view Digital Twin Weather & IoT Sensors"
        >
          <span
            aria-hidden="true"
            className="glass-rule absolute left-0 top-3 bottom-3 w-px hidden lg:block"
          />
          <div className="space-y-1.5 min-w-0">
            <span className="text--eyebrow text-slate-500 block">Precipitation (24h)</span>
            <div className="text-3xl font-light text-amber-600 tabular-nums">
              {currentRainfall} <span className="text--body text-muted">mm</span>
            </div>
            <div className="text--footnote text-slate-600 flex items-center gap-1.5">
              <span className={`sev-mark ${rainfallMark}`} />
              <span className="font-semibold">{rainfallRiskText}</span>
            </div>
          </div>
          <CloudRain className="w-[18px] h-[18px] text-amber-500 shrink-0" strokeWidth={1.5} />
        </div>

      </div>

      {/* 2. Map & Incidents Middle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Live Map (2/3 width) */}
        <div className="panel lg:col-span-2 p-5 flex flex-col h-[480px]">
          <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
            <h3 className="text--subtitle3 text-ink">
              Live Spatial Digital Twin Map
            </h3>
            <button 
              onClick={() => onNavigateToTab('twin_map')}
              className="cta cta--tertiary text-[11px]"
            >
              Full Interactive Map <span className="cta__arrow">→</span>
            </button>
          </div>

          {/* Embedded Leaflet Map */}
          <div className="flex-1 rounded overflow-hidden relative border border-line bg-wash">
            <DigitalTwinMap
              zones={zones}
              sensors={sensors}
              resources={resources}
              shelters={shelters}
              hospitals={hospitals}
              reports={reports}
              evacuationRoute={evacuationRoute}
              timeHorizon={timeHorizon}
              setTimeHorizon={setTimeHorizon}
              onSelectZone={(zone) => onSelectZone(zone.id)}
              onSelectResource={(res) => {}}
              onSelectReport={(rep) => {}}
            />
          </div>
        </div>

        {/* Right Column: Recent Incidents (1/3 width). The panel stretches to the
            grid row height so it ends level with the map, and the stream scrolls
            inside it rather than leaving the column half empty. */}
        <div className="panel p-5 flex flex-col min-h-0 h-[480px] lg:h-full lg:max-h-[480px]">
          <div className="flex items-center justify-between border-b border-line pb-3 mb-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-muted" strokeWidth={1.5} />
              <h3 className="text--subtitle3 text-ink">
                Recent Incidents Stream
              </h3>
            </div>
            <button
              onClick={() => onNavigateToTab('citizen_portal')}
              className="cta cta--tertiary text-[11px]"
            >
              View All
            </button>
          </div>

          {/* Incidents Stream — hairline separated rows, severity left rule */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            {(reports || []).slice(0, 5).map((report) => (
              <div 
                key={report.id} 
                onClick={() => onSelectReport(report)}
                className={`${severityRow(report.severity)} border-b border-line last:border-b-0 py-3 pl-3 pr-1 cursor-pointer transition-colors hover:bg-wash`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text--body-medium text-ink capitalize truncate">
                    {report.category.replace('_', ' ')}
                  </span>
                  <span className={`badge ${severityBadge(report.severity)}`}>
                    {report.severity}
                  </span>
                </div>
                <p className="text--footnote text-subtle truncate mt-1">{report.locationName}</p>
                <div className="flex items-center justify-between mt-1 text--footnote text-muted">
                  <span className="truncate">{report.reporterName}</span>
                  <span className="tabular-nums shrink-0 pl-2">{report.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 3. Bottom Row Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* AI Situation Summary */}
        <div className="panel p-5 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <Sparkles className="w-4 h-4 text-muted" strokeWidth={1.5} />
              <h3 className="text--subtitle3 text-ink">
                AI Situation Summary
              </h3>
            </div>
            <p className="text--body text-subtle">
              Flash flood risk remains critical in Velachery and surrounding low-lying areas. Radars show continuous cloud density over the Adyar corridor, likely increasing water logging and drainage backup over the next 2 hours. Automated coordination loops have triggered alert warnings and rerouted emergency transit lines.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('multi_agent')}
            className="cta cta--primary cta--compact w-full"
          >
            <span>View Full Analysis</span>
            <span className="cta__arrow"><ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} /></span>
          </button>
        </div>

        {/* Resource Overview Progress Bars */}
        <div className="panel p-5">
          <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted" strokeWidth={1.5} />
              <h3 className="text--subtitle3 text-ink">
                Resource Overview
              </h3>
            </div>
            <button 
              onClick={() => onNavigateToTab('resources')}
              className="cta cta--tertiary text-[11px]"
            >
              View All
            </button>
          </div>

          {/* Progress Indicators */}
          <div className="space-y-4">
            {/* Rescue Boats */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text--footnote text-subtle">Rescue Boats</span>
                <span className="text--footnote text-ink tabular-nums">6 / 10 Deployed</span>
              </div>
              <div className="w-full h-1 bg-wash">
                <div className="h-full bg-ink" style={{ width: '60%' }}></div>
              </div>
            </div>

            {/* Ambulances */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text--footnote text-subtle">Ambulances</span>
                <span className="text--footnote text-ink tabular-nums">7 / 12 Deployed</span>
              </div>
              <div className="w-full h-1 bg-wash">
                <div className="h-full bg-ink" style={{ width: '58%' }}></div>
              </div>
            </div>

            {/* Fire Trucks */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text--footnote text-subtle">Fire Trucks</span>
                <span className="text--footnote text-ink tabular-nums">4 / 8 Deployed</span>
              </div>
              <div className="w-full h-1 bg-wash">
                <div className="h-full bg-ink" style={{ width: '50%' }}></div>
              </div>
            </div>

            {/* Relief Supplies */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text--footnote text-subtle">Relief Supplies</span>
                <span className="text--footnote text-ink tabular-nums">60% Remaining</span>
              </div>
              <div className="w-full h-1 bg-wash">
                <div className="h-full bg-ink" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline & 3-Agent Intelligence Stream */}
        <div className="panel p-5 flex flex-col h-full max-h-[300px] lg:max-h-none overflow-hidden">
          <div className="flex items-center justify-between border-b border-line pb-3 mb-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-muted" strokeWidth={1.5} />
              <h3 className="text--subtitle3 text-ink">
                3-Agent Activity Feed
              </h3>
            </div>
            <button 
              onClick={() => onNavigateToTab('multi_agent')}
              className="cta cta--tertiary text-[11px]"
            >
              <span>HQ View ({agentLogs?.length || 0})</span>
              <span className="cta__arrow">→</span>
            </button>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto">
            {(agentLogs && agentLogs.length > 0 ? agentLogs : [
              { id: '1', timestamp: '10:25 AM', agentName: 'Coordinator Agent', action: 'System Monitoring Active', details: 'Continuous telemetry stream ingest across 12 production agents', severity: 'info' }
            ]).map((log, i) => (
              <div key={log.id || i} className="flex gap-3 items-start border-b border-line py-3">
                <span className="text--footnote text-muted tabular-nums pt-0.5 min-w-[58px]">{log.timestamp}</span>
                <div className="flex flex-col flex-1 min-w-0 gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text--body-medium text-ink">{log.agentName}</span>
                    <span className={`badge ${logBadge(log.severity)}`}>
                      {log.action}
                    </span>
                  </div>
                  <span className="text--footnote text-subtle truncate">{log.details}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
