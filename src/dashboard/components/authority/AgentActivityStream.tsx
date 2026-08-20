import React from 'react';
import { AgentLog } from '../../../hooks/useAgentPipeline';

interface AgentActivityStreamProps {
  logs: AgentLog[];
}

const SEVERITY_MARK: Record<string, string> = {
  alert: 'sev-mark sev-mark--critical',
  warning: 'sev-mark sev-mark--advisory',
  success: 'sev-mark sev-mark--ok',
  info: 'sev-mark sev-mark--info'
};

const SEVERITY_TEXT: Record<string, string> = {
  alert: 'sev-text--critical',
  warning: 'sev-text--advisory',
  success: 'sev-text--ok',
  info: 'sev-text--info'
};

// Hue is gone, so every mark is spelled out next to its word.
const SEVERITY_WORD: Record<string, string> = {
  alert: 'Critical',
  warning: 'Advisory',
  success: 'Nominal',
  info: 'Info'
};

const agentInitial = (agentName: string) => {
  const stripped = (agentName || 'Agent').replace(/^Agent\s*\d+\s*[:\-—]\s*/i, '').trim();
  return (stripped || agentName || 'A').charAt(0).toUpperCase();
};

export const AgentActivityStream: React.FC<AgentActivityStreamProps> = ({ logs = [] }) => {
  const safeLogs = Array.isArray(logs) ? logs : [];

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
        <h3 className="text--eyebrow text-muted">Live 3-Agent Activity Stream</h3>
        <span className="text--footnote text-muted">
          <span className="tabular-nums">{safeLogs.length}</span> events logged
        </span>
      </div>

      <div className="max-h-[360px] overflow-y-auto">
        {safeLogs.length === 0 ? (
          <p className="text--body text-subtle text-center py-10">
            No agent activity logged. Use <span className="text-ink font-medium">Sync Agents</span> above
            to run the reasoning loop.
          </p>
        ) : (
          safeLogs.map((log) => {
            const severity = log.severity || 'info';
            return (
              <div key={log.id} className="flex items-start gap-3 py-3.5 border-b border-line last:border-b-0">
                <span
                  className="w-5 h-5 rounded-full bg-paper text-ink text-[10px] leading-none font-medium shrink-0 flex items-center justify-center mt-0.5 ring-1 ring-ink"
                  aria-hidden="true"
                >
                  {agentInitial(log.agentName)}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text--body-medium text-ink truncate">{log.agentName}</span>
                    <span className="text--footnote text-muted tabular-nums shrink-0">{log.timestamp}</span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={SEVERITY_MARK[severity] || SEVERITY_MARK.info} />
                    <span className={`text--eyebrow ${SEVERITY_TEXT[severity] || SEVERITY_TEXT.info}`}>
                      {SEVERITY_WORD[severity] || SEVERITY_WORD.info}
                    </span>
                    <span aria-hidden="true" className="text--footnote text-muted">·</span>
                    <span className="text--eyebrow text-muted truncate">{log.action}</span>
                  </div>

                  <p className="text--body text-subtle mt-1.5">{log.details}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
