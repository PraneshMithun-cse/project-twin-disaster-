import React from 'react';
import { ShieldAlert, CheckCircle2, User, Phone, MapPin, Sparkles, Truck } from 'lucide-react';
import { CitizenReport } from '../../shared/types';

interface IncidentsPanelProps {
  reports: CitizenReport[];
  onOpenDispatchModal: (zoneId: string) => void;
  onUpdateReportStatus?: (reportId: string, newStatus: CitizenReport['status']) => void;
}

/* Monochrome severity + status mapping. A mark never stands alone — it is
   always rendered next to its word. */
const severityRow = (severity: string) =>
  severity === 'critical' ? 'sev-row--critical'
  : severity === 'high' ? 'sev-row--advisory'
  : 'sev-row--info';

const severityBadge = (severity: string) =>
  severity === 'critical' ? 'badge--critical'
  : severity === 'high' ? 'badge--advisory'
  : severity === 'medium' ? 'badge--info'
  : 'badge--quiet';

const statusMark = (status: string) =>
  status === 'dispatched' ? 'sev-mark--advisory'
  : status === 'pending' ? 'sev-mark--info'
  : status === 'verified' ? 'sev-mark--info'
  : 'sev-mark--ok';

const ROW_GRID = 'md:grid md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.7fr)_minmax(0,1.1fr)_minmax(0,150px)_auto] md:gap-4 md:items-start';

export default function IncidentsPanel({
  reports,
  onOpenDispatchModal,
  onUpdateReportStatus
}: IncidentsPanelProps) {
  return (
    <div className="space-y-8 font-sans text-near">
      
      {/* Page Header */}
      <div className="flex items-start justify-between gap-6 border-b border-line pb-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text--eyebrow text-muted">Emergency Intel</span>
            <span className="text--footnote text-muted flex items-center gap-1.5">
              <span className="sev-mark sev-mark--round sev-mark--ok" />
              Live · Multi-Feature Synchronized
            </span>
          </div>
          <h2 className="text--subtitle1 font-light text-ink">
            Chennai Citizen Incident Feed &amp; Command Dispatcher
          </h2>
          <p className="text--body text-subtle max-w-3xl">
            Real-time feed of citizen reports, severity levels, AI-validated incident locations, and direct fleet assignment.
          </p>
        </div>
        <ShieldAlert className="w-[18px] h-[18px] text-muted shrink-0 mt-1" strokeWidth={1.5} />
      </div>

      {/* Incidents Table */}
      <div className="panel overflow-hidden">
        {/* Column headers */}
        <div className={`hidden ${ROW_GRID} bg-wash border-b border-line px-4 py-2.5`}>
          <span className="text--eyebrow text-muted">Incident</span>
          <span className="text--eyebrow text-muted">Location &amp; AI Verification</span>
          <span className="text--eyebrow text-muted">Reporter</span>
          <span className="text--eyebrow text-muted">Status</span>
          <span className="text--eyebrow text-muted">Actions</span>
        </div>

        {(reports || []).map((report) => {
          return (
            <div
              key={report.id}
              className={`${ROW_GRID} ${severityRow(report.severity)} border-b border-line last:border-b-0 px-4 py-4 space-y-3 md:space-y-0`}
            >
              {/* Incident */}
              <div className="space-y-1 min-w-0">
                <h3 className="text--body-medium text-ink capitalize">{report.category.replace('_', ' ')}</h3>
                <span className="text--footnote text-muted block tabular-nums">Incident ID: #{report.id}</span>
                <p className="text--footnote text-subtle pt-1">{report.description}</p>
              </div>

              {/* Location & AI verification */}
              <div className="space-y-1.5 min-w-0">
                <div className="text--footnote text-near flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
                  <span className="truncate">{report.locationName}</span>
                </div>
                <div className="text--footnote text-muted flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
                  <span className="truncate">
                    Confidence <span className="tabular-nums">{report.aiValidationScore}%</span> ({report.aiValidatedCategory})
                  </span>
                </div>
              </div>

              {/* Reporter */}
              <div className="space-y-1.5 min-w-0">
                <span className="text--footnote text-near flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} /> {report.reporterName}
                </span>
                <span className="text--footnote text-muted flex items-center gap-1.5 tabular-nums">
                  <Phone className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} /> {report.phone}
                </span>
              </div>

              {/* Status */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`badge ${severityBadge(report.severity)}`}>
                  {report.severity}
                </span>
                <span className="badge badge--quiet">
                  <span className={`sev-mark ${statusMark(report.status)}`} />
                  {report.status}
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <button 
                  onClick={() => onOpenDispatchModal('zone-velachery-south')}
                  className="cta cta--primary cta--mini gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" strokeWidth={1.5} /> Dispatch Fleet
                </button>

                {report.status !== 'resolved' && (
                  <button
                    onClick={() => onUpdateReportStatus && onUpdateReportStatus(report.id, 'resolved')}
                    className="cta cta--secondary cta--mini gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} /> Mark Resolved
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
