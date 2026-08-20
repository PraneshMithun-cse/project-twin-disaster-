import React from 'react';
import { ShieldAlert, Check, Zap, MapPin, Camera, User, ChevronDown } from 'lucide-react';
import { ExplainableAIRecommendation, CitizenReport } from '../../../shared/types';

interface MasterRecommendationCardProps {
  recommendation: ExplainableAIRecommendation | null;
  reports?: CitizenReport[];
  activeReport?: CitizenReport | null;
  onSelectReport?: (reportId: string) => void;
  onDispatchFleet: (recommendation: ExplainableAIRecommendation) => void;
  isDispatched?: boolean;
}

const PRIORITY_BADGE: Record<string, string> = {
  CRITICAL: 'badge badge--critical',
  HIGH: 'badge badge--advisory',
  MEDIUM: 'badge badge--info'
};

const REPORT_SEVERITY_MARK: Record<string, string> = {
  critical: 'sev-mark sev-mark--critical',
  high: 'sev-mark sev-mark--advisory',
  medium: 'sev-mark sev-mark--info',
  low: 'sev-mark sev-mark--ok'
};

const REPORT_SEVERITY_TEXT: Record<string, string> = {
  critical: 'sev-text--critical',
  high: 'sev-text--advisory',
  medium: 'sev-text--info',
  low: 'sev-text--ok'
};

export const MasterRecommendationCard: React.FC<MasterRecommendationCardProps> = ({
  recommendation,
  reports = [],
  activeReport,
  onSelectReport,
  onDispatchFleet,
  isDispatched = false
}) => {
  if (!recommendation) {
    return (
      <div className="panel p-8 text-center">
        <ShieldAlert className="w-6 h-6 text-muted mx-auto mb-3" strokeWidth={1.5} />
        <p className="text--body text-subtle">Awaiting 3-Agent AI recommendation output…</p>
      </div>
    );
  }

  const confidencePct = recommendation.reasoning?.confidencePct || 94;
  const capturedSiteName = activeReport?.locationName || recommendation.targetZoneName;
  const priority = recommendation.priority || 'CRITICAL';
  const reportSeverity = activeReport?.severity || 'medium';

  return (
    <div className="panel p-6 space-y-6">

      {/* Priority, target zone and confidence */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
        <div className="space-y-2.5 min-w-0">
          <span className={PRIORITY_BADGE[priority] || PRIORITY_BADGE.MEDIUM}>
            {priority} priority
          </span>
          <div className="flex items-center gap-1.5 text--body text-near">
            <MapPin className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
            <span className="text-muted">Target zone —</span>
            <span className="text-ink">{recommendation.targetZoneName}</span>
          </div>
        </div>

        <div className="shrink-0 w-full sm:w-44">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text--eyebrow text-muted">XAI Confidence</span>
            <span className="text--subtitle3 text-ink tabular-nums">{confidencePct}%</span>
          </div>
          <div className="h-1 bg-wash mt-2 overflow-hidden">
            <div className="h-full bg-ink" style={{ width: `${confidencePct}%` }} />
          </div>
        </div>
      </div>

      {/* Captured incident site from citizen reports */}
      {activeReport ? (
        <div className="border border-line rounded-[4px] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 mb-3.5">
            <div className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
              <span className="text--eyebrow text-muted">Captured incident site (citizen report)</span>
            </div>
            {activeReport.aiValidationScore ? (
              <span className="flex items-center gap-1.5">
                <span className="sev-mark sev-mark--ok" />
                <span className="text--eyebrow text-subtle">
                  AI verified <span className="tabular-nums">{activeReport.aiValidationScore}%</span>
                </span>
              </span>
            ) : null}
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            {activeReport.imageUrl && (
              <div className="w-full sm:w-28 h-20 rounded-[4px] bg-wash border border-line overflow-hidden shrink-0">
                <img
                  src={activeReport.imageUrl}
                  alt="Captured incident site"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
                <span className="text--body-medium text-ink">{activeReport.locationName}</span>
              </div>

              <p className="text--body text-subtle line-clamp-2">
                “{activeReport.description}”
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-0.5 text--footnote text-muted">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" strokeWidth={1.5} /> {activeReport.reporterName}
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{activeReport.timestamp}</span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1.5">
                  <span className={REPORT_SEVERITY_MARK[reportSeverity] || REPORT_SEVERITY_MARK.medium} />
                  <span className={`text--eyebrow ${REPORT_SEVERITY_TEXT[reportSeverity] || REPORT_SEVERITY_TEXT.medium}`}>
                    {reportSeverity} severity
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Selector if multiple captured citizen reports exist */}
          {reports && reports.length > 1 && onSelectReport && (
            <div className="mt-4 pt-3 border-t border-line flex flex-wrap items-center justify-between gap-2">
              <span className="text--eyebrow text-muted shrink-0">Select captured incident site</span>
              <div className="relative w-full max-w-[300px]">
                <select
                  value={activeReport.id}
                  onChange={(e) => onSelectReport(e.target.value)}
                  className="text--body appearance-none w-full bg-paper text-ink border border-line rounded-[4px] pl-3 pr-8 py-2 cursor-pointer hover:border-muted focus:border-ink transition-colors"
                >
                  {reports.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.locationName?.slice(0, 32)}… ({rep.reporterName})
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="w-3.5 h-3.5 text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  strokeWidth={1.5}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-line rounded-[4px] p-4 flex items-center gap-2 text--body text-subtle">
          <MapPin className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
          <span>
            Incident location — <span className="text-ink font-medium">{capturedSiteName}</span>
          </span>
        </div>
      )}

      {/* Title and core rationale */}
      <div>
        <h3 className="text--subtitle2 font-light text-ink">{recommendation.title}</h3>
        <p className="text--body text-subtle mt-2.5">
          {recommendation.reasoning?.coreReason || recommendation.reasoning?.riskExplanation}
        </p>
      </div>

      {/* Recommended fleet allocation */}
      {recommendation.recommendedResources && recommendation.recommendedResources.length > 0 && (
        <div>
          <span className="text--eyebrow text-muted block pb-2 border-b border-line">
            Recommended fleet units
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-8">
            {recommendation.recommendedResources.map((res, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-2.5 border-b border-line">
                <span className="text--body text-subtle">{res.resourceType}</span>
                <span className="text--body-medium text-ink tabular-nums">×{res.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dispatch action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <span className="text--footnote text-muted">Agent 3 — Command &amp; Dispatch System</span>
        <button
          onClick={() => onDispatchFleet(recommendation)}
          disabled={isDispatched}
          className={`cta cta--compact gap-2 ${isDispatched ? 'cta--secondary cursor-default' : 'cta--primary'}`}
        >
          {isDispatched ? (
            <>
              <Check className="w-4 h-4" strokeWidth={1.5} />
              <span>Fleet Dispatched</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" strokeWidth={1.5} />
              <span>Approve &amp; Dispatch Fleet</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
