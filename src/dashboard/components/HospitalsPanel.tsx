import React, { useState } from 'react';
import { Hospital, CheckCircle2, AlertCircle, Phone, MapPin, Zap, UserPlus, ArrowRightLeft } from 'lucide-react';
import { EmergencyHospital } from '../../shared/types';

interface HospitalsPanelProps {
  hospitals: EmergencyHospital[];
  onAdmitPatient?: (hospitalId: string, count: number) => void;
  onToggleGeneratorPower?: (hospitalId: string) => void;
  onTransferPatientLoad?: (fromHospitalId: string, count: number) => void;
}

/* Monochrome status mapping — the mark always travels with its word. */
const statusMark = (status: string) =>
  status === 'full' ? 'sev-mark--critical'
  : status === 'near_capacity' || status === 'strained' ? 'sev-mark--advisory'
  : 'sev-mark--ok';

const statusBadge = (status: string) =>
  status === 'full' ? 'badge--critical'
  : status === 'near_capacity' || status === 'strained' ? 'badge--advisory'
  : 'badge--info';

const ROW_GRID = 'md:grid md:grid-cols-[minmax(0,1.8fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,150px)] md:gap-4 md:items-start';

export default function HospitalsPanel({
  hospitals,
  onAdmitPatient,
  onToggleGeneratorPower,
  onTransferPatientLoad
}: HospitalsPanelProps) {
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
            <span className="text--eyebrow text-muted">Medical Directory</span>
            <span className="text--footnote text-muted flex items-center gap-1.5">
              <span className="sev-mark sev-mark--round sev-mark--ok" />
              Live · Cross-Feature Synchronized
            </span>
          </div>
          <h2 className="text--subtitle1 font-light text-ink">
            Chennai Emergency Hospitals Directory &amp; Live Surge Manager
          </h2>
          <p className="text--body text-subtle max-w-3xl">
            Real-time monitor and control of emergency ward beds, critical ICU support systems, and backup generators.
          </p>
        </div>
        <Hospital className="w-[18px] h-[18px] text-muted shrink-0 mt-1" strokeWidth={1.5} />
      </div>

      {/* Hospitals Table */}
      <div className="panel overflow-hidden">
        {/* Column headers */}
        <div className={`hidden ${ROW_GRID} bg-wash border-b border-line px-4 py-2.5`}>
          <span className="text--eyebrow text-muted">Hospital</span>
          <span className="text--eyebrow text-muted">Bed Occupancy</span>
          <span className="text--eyebrow text-muted">ICU &amp; Trauma</span>
          <span className="text--eyebrow text-muted">Status</span>
        </div>

        {(hospitals || []).map((h: any) => {
          const totalCap = h.totalCapacity ?? h.total_beds ?? 100;
          const occCap = h.occupiedCapacity ?? (totalCap - (h.available_icu_beds ?? 0)) ?? 50;
          const icuAvail = h.icuBedsAvailable ?? h.available_icu_beds ?? 0;
          const icuTot = h.icuBedsTotal ?? Math.max(icuAvail, 10);
          const occupancyPct = totalCap > 0 ? Math.round((occCap / totalCap) * 100) : 0;
          const statusStr = (h.status || 'normal').replace('_', ' ');
          const traumaCenterActive = h.hasTraumaCenter ?? h.trauma_center_active ?? true;
          const customAdmit = admitCounts[h.id] || 5;

          return (
            <div
              key={h.id}
              className={`${ROW_GRID} border-b border-line last:border-b-0 px-4 py-4 space-y-3 md:space-y-0`}
            >
              {/* Hospital */}
              <div className="space-y-1 min-w-0">
                <h3 className="text--body-medium text-ink">{h.name}</h3>
                <div className="text--footnote text-muted flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                  <span className="truncate">{h.address || 'Chennai Emergency Sector'}</span>
                </div>
                <div className="text--footnote text-muted flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                  <span>Contact: {h.contactPerson || 'Disaster Desk'}</span>
                  <span className="flex items-center gap-1.5 tabular-nums">
                    <Phone className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} /> {h.phone || '108'}
                  </span>
                </div>
              </div>

              {/* Bed occupancy */}
              <div className="space-y-1.5 min-w-0">
                <div className="text--footnote text-near tabular-nums">
                  {occCap} / {totalCap} ({occupancyPct}%)
                </div>
                <div className="w-full h-1 bg-wash">
                  <div
                    className="h-full bg-ink transition-all duration-500"
                    style={{ width: `${Math.min(100, occupancyPct)}%` }}
                  ></div>
                </div>
                <div className="text--footnote text-subtle flex items-center gap-1.5">
                  <span className={`sev-mark ${occupancyPct >= 90 ? 'sev-mark--critical' : occupancyPct >= 75 ? 'sev-mark--advisory' : 'sev-mark--ok'}`} />
                  {occupancyPct >= 90 ? 'At Capacity' : occupancyPct >= 75 ? 'Filling Up' : 'Beds Available'}
                </div>
              </div>

              {/* ICU & trauma */}
              <div className="space-y-1.5 min-w-0 text--footnote">
                <div className="flex items-center gap-1.5 text-near">
                  <span className={`sev-mark ${icuAvail === 0 ? 'sev-mark--critical' : 'sev-mark--ok'}`} />
                  <span className="tabular-nums">{icuAvail} / {icuTot}</span> ICU Beds
                  {icuAvail === 0 ? ' — None Available' : ' Available'}
                </div>
                <div className="flex items-center gap-1.5 text-subtle">
                  {traumaCenterActive ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
                  )}
                  Trauma Center: {traumaCenterActive ? 'Active' : 'None'}
                </div>
              </div>

              {/* Status */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`badge ${statusBadge(h.status)}`}>
                  <span className={`sev-mark ${statusMark(h.status)}`} />
                  {statusStr}
                </span>
              </div>

              {/* Medical orchestration controls — hairline-separated sub-row */}
              <div className="md:col-span-4 md:pt-4 md:mt-4 border-t border-line pt-3 mt-3 space-y-2.5">
                <span className="text--eyebrow text-muted flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Live Medical Orchestration
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1.5 border border-line rounded-[4px] px-2 py-1.5">
                    <span className="text--footnote text-muted">Count</span>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={customAdmit}
                      onChange={(e) => handleAdmitChange(h.id, parseInt(e.target.value) || 1)}
                      className="w-12 bg-transparent text-ink text--footnote tabular-nums text-center focus:outline-none"
                    />
                  </label>

                  <button
                    onClick={() => onAdmitPatient && onAdmitPatient(h.id, customAdmit)}
                    className="cta cta--primary cta--mini gap-1.5"
                  >
                    <UserPlus className="w-3 h-3" strokeWidth={1.5} />
                    <span>Admit Critical ICU ({customAdmit})</span>
                  </button>

                  <button
                    onClick={() => onToggleGeneratorPower && onToggleGeneratorPower(h.id)}
                    className="cta cta--secondary cta--mini gap-1.5"
                    title="Toggle auxiliary generator power"
                  >
                    <Zap className="w-3 h-3" strokeWidth={1.5} />
                    <span>Aux Generator Power</span>
                  </button>

                  <button
                    onClick={() => onTransferPatientLoad && onTransferPatientLoad(h.id, 5)}
                    className="cta cta--secondary cta--mini gap-1.5"
                    title="Transfer patient load to another facility"
                  >
                    <ArrowRightLeft className="w-3 h-3" strokeWidth={1.5} />
                    <span>Transfer Patients (-5)</span>
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
