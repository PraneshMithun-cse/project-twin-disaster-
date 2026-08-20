import React, { useState, useMemo } from 'react';
import {
  ZoneRisk,
  AgentActivityLog,
  ExplainableAIRecommendation,
  CitizenReport,
  EmergencyResource,
  AutomatedAlert
} from '../../shared/types';
import { AgentPipelineHeader } from './authority/AgentPipelineHeader';
import { AgentActivityStream } from './authority/AgentActivityStream';
import { MasterRecommendationCard } from './authority/MasterRecommendationCard';
import { useAgentPipeline } from '../../hooks/useAgentPipeline';
import { FileText, Send, Zap } from 'lucide-react';

interface AuthorityDashboardProps {
  zones: ZoneRisk[];
  agentLogs: AgentActivityLog[];
  recommendations: ExplainableAIRecommendation[];
  reports?: CitizenReport[];
  resources: EmergencyResource[];
  alerts: AutomatedAlert[];
  onApproveRecommendation: (recId: string) => void;
  onRejectRecommendation: (recId: string) => void;
  onOpenExplainModal: (rec: ExplainableAIRecommendation) => void;
  onOpenDispatchModal: (zoneId: string) => void;
  isSyncing: boolean;
  onTriggerSync: () => void;
}

export const AuthorityDashboard: React.FC<AuthorityDashboardProps> = ({
  zones,
  agentLogs: initialAgentLogs,
  recommendations,
  reports = [],
  resources,
  alerts,
  onApproveRecommendation,
  onOpenExplainModal,
  onOpenDispatchModal,
  isSyncing,
  onTriggerSync
}) => {
  const { isRunning, agentLogs, activeRecommendation, executePipeline, lastPreset } = useAgentPipeline();
  const [dispatchedRecIds, setDispatchedRecIds] = useState<Record<string, boolean>>({});
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Active captured incident report
  const activeReport = useMemo(() => {
    if (!reports || reports.length === 0) return null;
    return reports.find(r => r.id === selectedReportId) || reports[0];
  }, [reports, selectedReportId]);

  const handleRunPipeline = (preset: 'normal' | 'moderate' | 'flood') => {
    executePipeline(preset);
    onTriggerSync();
  };

  const handleDispatch = (rec: any) => {
    if (rec.id) {
      setDispatchedRecIds((prev) => ({ ...prev, [rec.id]: true }));
      onApproveRecommendation(rec.id);
    }
    if (rec.targetZoneId) {
      onOpenDispatchModal(rec.targetZoneId);
    }
  };

  // Map hook logs to initial logs if empty
  const displayLogs = agentLogs.length > 0 ? agentLogs : initialAgentLogs.map((l, idx) => ({
    id: l.id || `init-log-${idx}`,
    agentName: l.agentName,
    action: l.action,
    details: l.details,
    timestamp: l.timestamp,
    severity: (l.severity as any) || 'info'
  }));

  const primaryRecommendation = activeRecommendation || (recommendations[0] as any) || null;

  // Synchronize target location in recommendation with captured incident location in reports
  const synchronizedRecommendation = useMemo(() => {
    if (!primaryRecommendation) return null;
    const targetLoc = activeReport?.locationName || primaryRecommendation.targetZoneName;
    return {
      ...primaryRecommendation,
      targetZoneName: targetLoc
    };
  }, [primaryRecommendation, activeReport]);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8 text-near">
      {/* 3-Agent Pipeline Command Header */}
      <AgentPipelineHeader
        isRunning={isRunning || isSyncing}
        onRunPipeline={handleRunPipeline}
        lastPreset={lastPreset}
      />

      {/* Main Grid: Left Master Recommendation, Right 3-Agent Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <MasterRecommendationCard
            recommendation={synchronizedRecommendation}
            reports={reports}
            activeReport={activeReport}
            onSelectReport={(repId) => setSelectedReportId(repId)}
            onDispatchFleet={handleDispatch}
            isDispatched={synchronizedRecommendation?.id ? dispatchedRecIds[synchronizedRecommendation.id] : false}
          />

          {/* Quick Manual Emergency Actions */}
          <div className="panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3 mb-4">
              <span className="text--eyebrow text-muted">
                Emergency fleet &amp; agency broadcast actions
              </span>
              <span className="flex items-center gap-1.5">
                <span className="sev-mark sev-mark--ok sev-mark--round" />
                <span className="text--eyebrow text-subtle">Manual override ready</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => onOpenDispatchModal(zones[0]?.id || 'zone-velachery-south')}
                className="cta cta--primary cta--compact gap-2 w-full"
              >
                <Zap className="w-4 h-4" strokeWidth={1.5} />
                <span>Dispatch Fleet</span>
              </button>

              <button
                onClick={() => synchronizedRecommendation && onOpenExplainModal(synchronizedRecommendation)}
                className="cta cta--secondary cta--compact gap-2 w-full"
              >
                <FileText className="w-4 h-4" strokeWidth={1.5} />
                <span>Audit XAI Rationale</span>
              </button>

              <button
                onClick={() => alert('Emergency C-DOT SMS Broadcast Dispatched to Chennai Citizens.')}
                className="cta cta--secondary cta--compact gap-2 w-full"
              >
                <Send className="w-4 h-4" strokeWidth={1.5} />
                <span>Broadcast SMS Alert</span>
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <AgentActivityStream logs={displayLogs} />
        </div>
      </div>
    </div>
  );
};

