import React from 'react';
import {
  Activity,
  CloudRain,
  Radio,
  Satellite,
  Layers
} from 'lucide-react';
import { IoTSensorNode, ZoneRisk } from '../../shared/types';

interface AnalyticsHubProps {
  sensors: IoTSensorNode[];
  zones: ZoneRisk[];
}

/* Status encoding: badge shape + the word always carry the state; the accent
   only layers on top. Critical stays solid black, warning stays the black ring,
   a sensor reading inside its band is "available / operational" → safe green. */
const SENSOR_STATUS: Record<IoTSensorNode['status'], { badge: string; label: string }> = {
  critical: { badge: 'badge badge--critical', label: 'Critical' },
  warning: { badge: 'badge badge--advisory', label: 'Warning' },
  normal: { badge: 'badge badge--safe', label: 'Normal' }
};

export const AnalyticsHub: React.FC<AnalyticsHubProps> = ({ sensors, zones }) => {
  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-6 text-near font-sans">

      {/* Title Header */}
      <div className="panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <span className="text--eyebrow text-muted flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4" strokeWidth={1.5} />
            Data Fusion &amp; Telemetry Hub
          </span>
          <h2 className="text--subtitle2 text-ink">
            Multi-Source Telemetry Integration Hub
          </h2>
          <p className="text--body text-subtle mt-2">
            Fusing OpenWeatherMap radar, Tomorrow.io high-tide predictions, NASA FIRMS / Sentinel SAR imagery,
            Mapbox traffic vectors, and IoT telemetry into unified intelligence.
          </p>
        </div>

        <div className="shrink-0 border border-line rounded-[4px] px-5 py-3 text-right">
          <span className="text--eyebrow text-muted block">Avg Response Speedup</span>
          <span className="text--subtitle2 text-safe-strong tabular-nums block mt-1.5 transition-colors duration-[250ms]">42% Faster</span>
        </div>
      </div>

      {/* Data Fusion Feed Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="panel lift p-4 space-y-3 bg-white/70">
          <div className="flex items-center justify-between">
            <CloudRain className="w-4 h-4 text-sky-500" strokeWidth={1.5} />
            <span className="badge badge--safe">Online</span>
          </div>
          <h4 className="text--body-medium text-ink">Weather Radar Feed</h4>
          <p className="text--footnote text-muted">OpenWeatherMap / IMD Radar</p>
          {/* Rainfall rate — hydrological telemetry */}
          <div className="text--body text-sky-600 font-semibold tabular-nums pt-3 border-t border-line transition-colors duration-[250ms]">85 mm/hr Convective Cell</div>
        </div>

        <div className="panel lift p-4 space-y-3 bg-white/70">
          <div className="flex items-center justify-between">
            <Satellite className="w-4 h-4 text-indigo-500" strokeWidth={1.5} />
            <span className="badge badge--safe">Online</span>
          </div>
          <h4 className="text--body-medium text-ink">Satellite SAR Observation</h4>
          <p className="text--footnote text-muted">Sentinel-1 &amp; NASA FIRMS</p>
          {/* Submerged area — hydrological telemetry */}
          <div className="text--body text-indigo-600 font-semibold tabular-nums pt-3 border-t border-line transition-colors duration-[250ms]">3.2 km² Inundation Surface</div>
        </div>

        <div className="panel lift p-4 space-y-3 bg-white/70">
          <div className="flex items-center justify-between">
            <Radio className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />
            <span className="badge badge--safe">Online</span>
          </div>
          <h4 className="text--body-medium text-ink">IoT Hydrodynamic Sensors</h4>
          <p className="text--footnote text-muted">5 Ultrasonic Sluice Gauges</p>
          {/* Full availability of the sensor fleet — a protected/operational state */}
          <div className="text--body text-emerald-600 font-semibold tabular-nums pt-3 border-t border-line transition-colors duration-[250ms]">100% Telemetry Online</div>
        </div>

        <div className="panel lift p-4 space-y-3 bg-white/70">
          <div className="flex items-center justify-between">
            <Layers className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
            <span className="badge badge--safe">Online</span>
          </div>
          <h4 className="text--body-medium text-ink">Traffic &amp; Corridors</h4>
          <p className="text--footnote text-muted">Google / Mapbox Vector Feed</p>
          <div className="text--body text-amber-600 font-semibold tabular-nums pt-3 border-t border-line">Guindy Subway Closed</div>
        </div>
      </div>

      {/* IoT Sensors Telemetry Live Gauge Breakdown */}
      <div className="panel p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-line pb-4">
          <h3 className="text--subtitle3 text-ink flex items-center gap-2">
            <Radio className="w-4 h-4" strokeWidth={1.5} />
            IoT Hydrodynamic Sensor Telemetry (Velachery &amp; Adyar)
          </h3>

          {/* Gauge legend — every series is still named; the live water stage
              additionally carries the informational blue accent */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text--footnote text-muted shrink-0">
            <span className="flex items-center gap-2">
              <span className="inline-block w-6 h-[4px] bg-info" />
              Live stage
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block w-6 h-[4px] bg-wash" />
              Gauge range
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block w-px h-3 bg-ink" />
              Warn / crit tick
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(sensors || []).map((sensor) => {
            const status = SENSOR_STATUS[sensor.status] ?? SENSOR_STATUS.normal;
            const scaleMax = sensor.thresholdCritical * 1.2;
            const fillPct = Math.min(100, (sensor.currentValue / scaleMax) * 100);
            const warnTickPct = Math.min(100, (sensor.thresholdWarning / scaleMax) * 100);
            const critTickPct = Math.min(100, (sensor.thresholdCritical / scaleMax) * 100);

            return (
              <div key={sensor.id} className="border border-line rounded-[4px] p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text--eyebrow text-muted block">{sensor.id}</span>
                    <h4 className="text--body-medium text-ink mt-1">{sensor.name}</h4>
                  </div>
                  <span className={status.badge}>{status.label}</span>
                </div>

                <div className="flex items-baseline justify-between border-t border-line pt-3">
                  <span className="text--footnote text-muted">Live Stage</span>
                  <span className="text--subtitle3 text-info-strong tabular-nums transition-colors duration-[250ms]">
                    {sensor.currentValue} {sensor.unit}
                  </span>
                </div>

                {/* Threshold gauge — 4px wash track, water-stage fill in the blue
                    telemetry accent, 1px black threshold ticks (thresholds stay black) */}
                <div className="space-y-1.5">
                  <div className="relative w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-sky-400 to-sky-600 rounded-full transition-all duration-[300ms]" style={{ width: `${fillPct}%` }} />
                  </div>
                  <div className="relative h-2" aria-hidden="true">
                    <span className="absolute top-0 w-px h-2 bg-amber-500" style={{ left: `${warnTickPct}%` }} />
                    <span className="absolute top-0 w-px h-2 bg-red-500" style={{ left: `${critTickPct}%` }} />
                  </div>
                  <div className="flex justify-between text--footnote text-muted tabular-nums">
                    <span>Warn {sensor.thresholdWarning} {sensor.unit}</span>
                    <span>Crit {sensor.thresholdCritical} {sensor.unit}</span>
                  </div>
                </div>

                <div className="flex justify-between text--footnote text-muted tabular-nums pt-3 border-t border-line">
                  <span>Bat {sensor.batteryPct}%</span>
                  <span>Sig {sensor.signalPct}%</span>
                  <span>Upd {sensor.lastUpdated}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
