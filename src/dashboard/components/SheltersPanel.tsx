import React, { useState } from 'react';
import { Home, Zap, CheckCircle2, AlertCircle, Phone, MapPin, Navigation, UserPlus, PackageCheck, ShieldPlus } from 'lucide-react';
import { EmergencyShelter } from '../../shared/types';

interface SheltersPanelProps {
  shelters: EmergencyShelter[];
  onAdmitEvacuees?: (shelterId: string, count: number) => void;
  onRestockSupplies?: (shelterId: string, days: number) => void;
  onTogglePowerBackup?: (shelterId: string) => void;
  onRequestMedicalStaff?: (shelterId: string) => void;
}

/* Monochrome status mapping — the mark is always paired with its word. */
const statusMark = (status: string) =>
  status === 'full' ? 'sev-mark--critical'
  : status === 'near_capacity' ? 'sev-mark--advisory'
  : status === 'closed' ? 'sev-mark--info'
  : 'sev-mark--ok';

const statusBadge = (status: string) =>
  status === 'full' ? 'badge--critical'
  : status === 'near_capacity' ? 'badge--advisory'
  : 'badge--info';

const ROW_GRID = 'md:grid md:grid-cols-[minmax(0,1.8fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,150px)] md:gap-4 md:items-start';

export default function SheltersPanel({
  shelters,
  onAdmitEvacuees,
  onRestockSupplies,
  onTogglePowerBackup,
  onRequestMedicalStaff
}: SheltersPanelProps) {
  const [admitCounts, setAdmitCounts] = useState<Record<string, number>>({});

  const handleAdmitChange = (id: string, val: number) => {
    setAdmitCounts(prev => ({ ...prev, [id]: Math.max(1, val) }));
  };

  return (
    <div className="space-y-8 font-sans text-near">
      
      {/* Page Header */}
      <div className="flex items-start justify-between gap-6 border-b border-line pb-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text--eyebrow text-muted">Crisis Relocation</span>
            <span className="text--footnote text-muted flex items-center gap-1.5">
              <span className="sev-mark sev-mark--round sev-mark--ok" />
              Live · Cross-Feature Synchronized
            </span>
          </div>
          <h2 className="text--subtitle1 font-light text-ink">
            Chennai Emergency Shelters Directory &amp; Live Allocator
          </h2>
          <p className="text--body text-subtle max-w-3xl">
            Real-time tracking and control of camp capacity, food reserves, emergency medical staff, and backup power grids.
          </p>
        </div>
        <Home className="w-[18px] h-[18px] text-muted shrink-0 mt-1" strokeWidth={1.5} />
      </div>

      {/* Shelters Table */}
      <div className="panel overflow-hidden">
        {/* Column headers */}
        <div className={`hidden ${ROW_GRID} bg-wash border-b border-line px-4 py-2.5`}>
          <span className="text--eyebrow text-muted">Shelter</span>
          <span className="text--eyebrow text-muted">Occupancy</span>
          <span className="text--eyebrow text-muted">Provisions</span>
          <span className="text--eyebrow text-muted">Status</span>
        </div>

        {(shelters || []).map((shelter) => {
          const occupancyPct = Math.round((shelter.currentOccupancy / shelter.totalCapacity) * 100);
          const customAdmitCount = admitCounts[shelter.id] || 25;

          return (
            <div
              key={shelter.id}
              className={`${ROW_GRID} border-b border-line last:border-b-0 px-4 py-4 space-y-3 md:space-y-0`}
            >
              {/* Shelter */}
              <div className="space-y-1 min-w-0">
                <h3 className="text--body-medium text-ink">{shelter.name}</h3>
                <div className="text--footnote text-muted flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                  <span className="truncate">{shelter.address}</span>
                </div>
                <div className="text--footnote text-muted flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                  <span>Camp Lead: {shelter.contactPerson}</span>
                  <span className="flex items-center gap-1.5 tabular-nums">
                    <Phone className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} /> {shelter.phone}
                  </span>
                </div>
              </div>

              {/* Occupancy */}
              <div className="space-y-1.5 min-w-0">
                <div className="text--footnote text-near tabular-nums">
                  {shelter.currentOccupancy} / {shelter.totalCapacity} ({occupancyPct}%)
                </div>
                <div className="w-full h-1 bg-wash">
                  <div
                    className="h-full bg-ink transition-all duration-500"
                    style={{ width: `${Math.min(100, occupancyPct)}%` }}
                  ></div>
                </div>
                <div className="text--footnote text-muted flex items-center gap-1.5">
                  <span className={`sev-mark ${occupancyPct >= 95 ? 'sev-mark--critical' : occupancyPct >= 80 ? 'sev-mark--advisory' : 'sev-mark--ok'}`} />
                  {occupancyPct >= 95 ? 'At Capacity' : occupancyPct >= 80 ? 'Filling Up' : 'Space Available'}
                </div>
              </div>

              {/* Provisions */}
              <div className="space-y-1.5 min-w-0 text--footnote">
                <div className="flex items-center gap-1.5 text-near">
                  <span className={`sev-mark ${shelter.foodSuppliesDays <= 2 ? 'sev-mark--critical' : shelter.foodSuppliesDays <= 5 ? 'sev-mark--advisory' : 'sev-mark--ok'}`} />
                  <span className="tabular-nums">{shelter.foodSuppliesDays}</span> Days Food Supply
                </div>
                <div className="flex items-center gap-1.5 text-subtle">
                  {shelter.medicalStaffPresent ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
                  )}
                  Medical Staff: {shelter.medicalStaffPresent ? 'Present' : 'None'}
                </div>
                <div className="flex items-center gap-1.5 text-subtle">
                  <Zap className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
                  Power Grid: {shelter.powerBackup ? 'Active' : 'Offline'}
                </div>
              </div>

              {/* Status */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`badge ${statusBadge(shelter.status)}`}>
                  <span className={`sev-mark ${statusMark(shelter.status)}`} />
                  {shelter.status.replace('_', ' ')}
                </span>
              </div>

              {/* Orchestration controls — hairline-separated sub-row */}
              <div className="md:col-span-4 md:pt-4 md:mt-4 border-t border-line pt-3 mt-3 space-y-2.5">
                <span className="text--eyebrow text-muted flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Live Orchestration Actions
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1.5 border border-line rounded-[4px] px-2 py-1.5">
                    <span className="text--footnote text-muted">Qty</span>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={customAdmitCount}
                      onChange={(e) => handleAdmitChange(shelter.id, parseInt(e.target.value) || 1)}
                      className="w-12 bg-transparent text-ink text--footnote tabular-nums text-center focus:outline-none"
                    />
                  </label>

                  <button
                    onClick={() => onAdmitEvacuees && onAdmitEvacuees(shelter.id, customAdmitCount)}
                    className="cta cta--primary cta--mini gap-1.5"
                  >
                    <UserPlus className="w-3 h-3" strokeWidth={1.5} />
                    <span>Admit Evacuees (+{customAdmitCount})</span>
                  </button>

                  <button
                    onClick={() => onRestockSupplies && onRestockSupplies(shelter.id, 5)}
                    className="cta cta--secondary cta--mini gap-1.5"
                    title="Add 5 Days Ration Supply"
                  >
                    <PackageCheck className="w-3 h-3" strokeWidth={1.5} />
                    <span>+5 Days Food</span>
                  </button>

                  <button
                    onClick={() => onTogglePowerBackup && onTogglePowerBackup(shelter.id)}
                    className="cta cta--secondary cta--mini gap-1.5"
                    title="Toggle Emergency Generator"
                  >
                    <Zap className="w-3 h-3" strokeWidth={1.5} />
                    <span>Gen Power</span>
                  </button>

                  <button
                    onClick={() => onRequestMedicalStaff && onRequestMedicalStaff(shelter.id)}
                    className="cta cta--secondary cta--mini gap-1.5"
                    title="Assign Emergency Medical Squad"
                  >
                    <ShieldPlus className="w-3 h-3" strokeWidth={1.5} />
                    <span>Med Staff</span>
                  </button>

                  <button
                    onClick={() => {
                      const lat = shelter.lat || (shelter as any).location?.coordinates?.[0] || 12.9830;
                      const lng = shelter.lng || (shelter as any).location?.coordinates?.[1] || 80.2182;
                      const launchUrl = (origStr?: string) => {
                        let url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
                        if (origStr) url += `&origin=${origStr}`;
                        window.open(url, '_blank', 'noopener,noreferrer');
                      };

                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => launchUrl(`${pos.coords.latitude},${pos.coords.longitude}`),
                          () => launchUrl(),
                          { timeout: 3500 }
                        );
                      } else {
                        launchUrl();
                      }
                    }}
                    className="cta cta--tertiary text-[11px] ml-auto"
                  >
                    <Navigation className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.5} />
                    <span>Navigate in Google Maps</span>
                    <span className="cta__arrow">→</span>
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
