import React from 'react';
import { Truck, Shield, AlertTriangle, Users, Fuel, Phone, MapPin, Zap, RefreshCw } from 'lucide-react';
import { EmergencyResource, ZoneRisk } from '../../shared/types';

interface ResourcesPanelProps {
  resources: EmergencyResource[];
  zones?: ZoneRisk[];
  onConsumeResource?: (resourceId: string, amountPct?: number) => void;
  onRefillResource?: (resourceId: string, amountPct?: number) => void;
  onUpdateResource?: (resourceId: string, updates: Partial<EmergencyResource>) => void;
  onDispatchResource?: (resourceId: string, zoneId: string) => void;
}

/* Monochrome status mapping — a mark is never shown without its word. */
const statusMark = (status: string) =>
  status === 'maintenance' ? 'sev-mark--critical'
  : status === 'deployed' ? 'sev-mark--advisory'
  : status === 'en_route' ? 'sev-mark--info'
  : 'sev-mark--ok';

const supplyMark = (pct: number) =>
  pct < 30 ? 'sev-mark--critical' : pct < 60 ? 'sev-mark--advisory' : 'sev-mark--ok';

const supplyWord = (pct: number) =>
  pct < 30 ? 'Low' : pct < 60 ? 'Moderate' : 'Ready';

const ROW_GRID = 'md:grid md:grid-cols-[minmax(0,1.7fr)_minmax(0,150px)_minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1.2fr)] md:gap-4 md:items-start';

export default function ResourcesPanel({
  resources,
  zones = [],
  onConsumeResource,
  onRefillResource,
  onUpdateResource,
  onDispatchResource
}: ResourcesPanelProps) {

  const totalFleet = resources.length;
  const deployedCount = resources.filter(r => r.status === 'deployed' || r.status === 'en_route').length;
  const avgSupplies = totalFleet > 0 
    ? Math.round(resources.reduce((acc, r) => acc + r.fuelOrSuppliesPct, 0) / totalFleet)
    : 0;
  const lowSupplyCount = resources.filter(r => r.fuelOrSuppliesPct < 30).length;

  const handleRefillAll = () => {
    resources.forEach(r => {
      if (onRefillResource) {
        onRefillResource(r.id, 50);
      }
    });
  };

  return (
    <div className="space-y-8 font-sans text-near">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 border-b border-line pb-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text--eyebrow text-muted">Fleet Operations &amp; Supply Command</span>
            {lowSupplyCount > 0 && (
              <span className="badge badge--critical">
                <AlertTriangle className="w-3 h-3" strokeWidth={1.5} /> {lowSupplyCount} Units Low Fuel
              </span>
            )}
          </div>
          <h2 className="text--subtitle1 font-light text-ink">
            Chennai Emergency Fleet Directory
          </h2>
          <p className="text--body text-subtle max-w-3xl">
            Real-time status tracking, active consumption meters, and field supply restocking for emergency units.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {onRefillResource && (
            <button
              onClick={handleRefillAll}
              className="cta cta--secondary cta--compact gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Refill All Fleet Units</span>
            </button>
          )}
          <Truck className="w-[18px] h-[18px] text-muted shrink-0" strokeWidth={1.5} />
        </div>
      </div>

      {/* Fleet Summary Statistics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="panel p-4 space-y-1.5">
          <span className="text--eyebrow text-muted block">Total Fleet Active</span>
          <div className="text--subtitle1 font-light text-ink tabular-nums">{totalFleet} Units</div>
          <span className="text--footnote text-subtle flex items-center gap-1.5">
            <span className="sev-mark sev-mark--advisory" />
            <span className="tabular-nums">{deployedCount}</span> Currently Deployed
          </span>
        </div>

        <div className="panel p-4 space-y-2">
          <span className="text--eyebrow text-muted block">Average Fleet Readiness</span>
          <div className="text--subtitle1 font-light text-ink tabular-nums">{avgSupplies}%</div>
          <div className="w-full h-1 bg-wash">
            <div className="h-full bg-ink transition-all duration-500" style={{ width: `${avgSupplies}%` }} />
          </div>
          <span className="text--footnote text-subtle flex items-center gap-1.5">
            <span className={`sev-mark ${supplyMark(avgSupplies)}`} />
            {supplyWord(avgSupplies)}
          </span>
        </div>

        <div className="panel p-4 space-y-1.5">
          <span className="text--eyebrow text-muted block">Low Supply Units</span>
          <div className="text--subtitle1 font-light text-ink tabular-nums">
            {lowSupplyCount} {lowSupplyCount === 1 ? 'Unit' : 'Units'}
          </div>
          <span className="text--footnote text-subtle flex items-center gap-1.5">
            <span className={`sev-mark ${lowSupplyCount > 0 ? 'sev-mark--critical' : 'sev-mark--ok'}`} />
            {lowSupplyCount > 0 ? 'Requires Restock' : 'All Units Stocked'}
          </span>
        </div>

        <div className="panel p-4 space-y-1.5">
          <span className="text--eyebrow text-muted block">Operations Control</span>
          <div className="text--subtitle2 font-light text-ink">Interactive Resource Meter</div>
          <span className="text--footnote text-muted block">Use the controls below to consume or refill</span>
        </div>
      </div>

      {/* Fleet Table */}
      <div className="panel overflow-hidden">
        {/* Column headers */}
        <div className={`hidden ${ROW_GRID} bg-wash border-b border-line px-4 py-2.5`}>
          <span className="text--eyebrow text-muted">Unit</span>
          <span className="text--eyebrow text-muted">Status</span>
          <span className="text--eyebrow text-muted">Fuel &amp; Supplies</span>
          <span className="text--eyebrow text-muted">Crew &amp; Equipment</span>
          <span className="text--eyebrow text-muted">Position &amp; Contact</span>
        </div>

        {(resources || []).map((res) => {
          const isLow = res.fuelOrSuppliesPct < 30;

          return (
            <div
              key={res.id}
              className={`${ROW_GRID} border-b border-line last:border-b-0 px-4 py-4 space-y-3 md:space-y-0`}
            >
              
              {/* Unit */}
              <div className="space-y-1.5 min-w-0">
                <h3 className="text--body-medium text-ink flex flex-wrap items-center gap-2">
                  {res.name}
                  {isLow && (
                    <span className="badge badge--critical">Low Supplies</span>
                  )}
                </h3>

                <span className="text--footnote text-subtle capitalize block">
                  {res.type.replace('_', ' ')}
                </span>

                {/* Zone Assignment Dropdown */}
                {(zones || []).length > 0 && onDispatchResource ? (
                  <label className="flex items-center gap-1.5 text--footnote text-muted">
                    <span>Zone</span>
                    <select
                      value={res.assignedZoneId || ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          onDispatchResource(res.id, e.target.value);
                        }
                      }}
                      className="bg-paper text-ink text--footnote border border-line rounded-[4px] px-2 py-1 focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Unassigned --</option>
                      {(zones || []).map(z => (
                        <option key={z.id} value={z.id}>
                          {z.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : res.assignedZoneId ? (
                  <span className="text--footnote text-muted truncate block">
                    Assigned: {res.assignedZoneId.replace('zone-', '')}
                  </span>
                ) : null}
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 min-w-0">
                <span className={`sev-mark ${statusMark(res.status)}`} />
                {onUpdateResource ? (
                  <select
                    value={res.status}
                    onChange={(e) => onUpdateResource(res.id, { status: e.target.value as any })}
                    className="text--eyebrow text-ink bg-paper border border-line rounded-[4px] px-2 py-1.5 cursor-pointer focus:outline-none"
                  >
                    <option value="available">Available</option>
                    <option value="en_route">En Route</option>
                    <option value="deployed">Deployed</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                ) : (
                  <span className="text--eyebrow text-ink">
                    {res.status.replace('_', ' ')}
                  </span>
                )}
              </div>

              {/* Fuel & supplies meter */}
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text--footnote text-subtle flex items-center gap-1.5">
                    <Fuel className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
                    Supplies
                  </span>
                  <span className="text--footnote text-ink tabular-nums">{res.fuelOrSuppliesPct}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1 bg-wash">
                  <div
                    className="h-full bg-ink transition-all duration-500"
                    style={{ width: `${res.fuelOrSuppliesPct}%` }}
                  />
                </div>

                <span className="text--footnote text-subtle flex items-center gap-1.5">
                  <span className={`sev-mark ${supplyMark(res.fuelOrSuppliesPct)}`} />
                  {supplyWord(res.fuelOrSuppliesPct)}
                </span>
              </div>

              {/* Crew & equipment */}
              <div className="space-y-1.5 min-w-0 text--footnote">
                <span className="text-near flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
                  <span className="tabular-nums">{res.crewCount}</span> Personnel
                </span>
                <span className="text-subtle flex items-center gap-1.5 capitalize">
                  <Shield className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
                  {res.type.replace('_', ' ')}
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(res.equipment || []).map((eq, i) => (
                    <span key={i} className="badge badge--quiet">
                      {eq}
                    </span>
                  ))}
                </div>
              </div>

              {/* Position & contact */}
              <div className="space-y-1.5 min-w-0 text--footnote">
                <span className="text-subtle flex items-center gap-1.5 tabular-nums">
                  <MapPin className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
                  {res.lat.toFixed(3)}, {res.lng.toFixed(3)}
                </span>
                <span className="text-near flex items-center gap-1.5 tabular-nums">
                  <Phone className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
                  {res.contactNumber}
                </span>
              </div>

              {/* Consumption & refill controls — hairline-separated sub-row */}
              <div className="md:col-span-5 md:pt-4 md:mt-4 border-t border-line pt-3 mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text--eyebrow text-muted">Consume</span>
                  <button
                    onClick={() => onConsumeResource && onConsumeResource(res.id, 10)}
                    disabled={res.fuelOrSuppliesPct <= 0}
                    className="cta cta--secondary cta--mini gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Simulate light operational use"
                  >
                    <Zap className="w-3 h-3" strokeWidth={1.5} />
                    <span>-10%</span>
                  </button>
                  <button
                    onClick={() => onConsumeResource && onConsumeResource(res.id, 25)}
                    disabled={res.fuelOrSuppliesPct <= 0}
                    className="cta cta--secondary cta--mini gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Simulate heavy rescue or pumping operation"
                  >
                    <Zap className="w-3 h-3" strokeWidth={1.5} />
                    <span>-25% Heavy</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text--eyebrow text-muted">Refill</span>
                  <button
                    onClick={() => onRefillResource && onRefillResource(res.id, 25)}
                    disabled={res.fuelOrSuppliesPct >= 100}
                    className="cta cta--secondary cta--mini gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Restock fuel or emergency supplies"
                  >
                    <RefreshCw className="w-3 h-3" strokeWidth={1.5} />
                    <span>+25%</span>
                  </button>
                  <button
                    onClick={() => onRefillResource && onRefillResource(res.id, 100)}
                    disabled={res.fuelOrSuppliesPct >= 100}
                    className="cta cta--primary cta--mini disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Full fuel tank & supply restock"
                  >
                    <span>100% Full</span>
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
