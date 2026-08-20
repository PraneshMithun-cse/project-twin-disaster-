import React from 'react';
import { Cpu, RefreshCw } from 'lucide-react';

interface AgentPipelineHeaderProps {
  isRunning: boolean;
  onRunPipeline: (preset: 'normal' | 'moderate' | 'flood') => void;
  lastPreset: 'normal' | 'moderate' | 'flood';
  rainfallMmHr?: number;
  dischargeM3s?: number;
}

type StageState = 'complete' | 'running' | 'pending';

const PIPELINE_STAGES: { id: string; label: string; caption: string }[] = [
  { id: 'agent-1', label: 'Agent 1 — Sentinel Risk Engine', caption: 'Ingest & score' },
  { id: 'agent-2', label: 'Agent 2 — Cascading Predictor', caption: 'Cascade forecast' },
  { id: 'agent-3', label: 'Agent 3 — Fleet Dispatch', caption: 'Plan & dispatch' }
];

const STAGE_MARK: Record<StageState, string> = {
  complete: 'sev-mark sev-mark--critical sev-mark--round',
  running: 'sev-mark sev-mark--critical sev-mark--round animate-pulse-mono',
  pending: 'sev-mark sev-mark--neutral sev-mark--round'
};

const STAGE_LABEL_CLASS: Record<StageState, string> = {
  complete: 'text-ink font-medium',
  running: 'text-ink font-medium',
  pending: 'text-muted'
};

const STAGE_WORD_CLASS: Record<StageState, string> = {
  complete: 'text-near',
  running: 'text-near',
  pending: 'text-muted'
};

const STAGE_WORD: Record<StageState, string> = {
  complete: 'Complete',
  running: 'Running',
  pending: 'Pending'
};

export const AgentPipelineHeader: React.FC<AgentPipelineHeaderProps> = ({
  isRunning,
  onRunPipeline,
  lastPreset,
  rainfallMmHr = 110,
  dischargeM3s = 1850
}) => {
  // Purely presentational: the pipeline exposes a single `isRunning` flag, so every
  // stage reads as running while the loop executes and as complete once it settles.
  const stageState: StageState = isRunning ? 'running' : 'complete';

  return (
    <div className="panel p-5 mb-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">

        {/* Left: system identity and live telemetry */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text--eyebrow text-muted">Multi-Agent Command</span>
            <span aria-hidden="true" className="text--footnote text-muted">·</span>
            <span className="flex items-center gap-1.5">
              <span className="sev-mark sev-mark--ok sev-mark--round" />
              <span className="text--eyebrow text-subtle">Active</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5 mt-2">
            <Cpu className="w-[18px] h-[18px] text-ink shrink-0" strokeWidth={1.5} />
            <h2 className="text--subtitle2 font-light text-ink">
              3-Agent AI Autonomous Pipeline
            </h2>
          </div>

          <p className="text--footnote text-muted mt-2">
            Live telemetry — Rain{' '}
            <span className="text-near tabular-nums">{rainfallMmHr} mm/hr</span>
            <span aria-hidden="true"> · </span>
            Basin discharge{' '}
            <span className="text-near tabular-nums">{dischargeM3s} m³/s</span>
          </p>
        </div>

        {/* Right: preset selector and sync trigger */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text--eyebrow text-muted">Preset</span>

          <div className="inline-flex items-center border border-line rounded-[4px] overflow-hidden">
            {(['normal', 'moderate', 'flood'] as const).map((preset, i) => (
              <button
                key={preset}
                onClick={() => onRunPipeline(preset)}
                disabled={isRunning}
                className={`text--eyebrow px-3.5 py-2.5 cursor-pointer transition-colors disabled:opacity-50 ${
                  i > 0 ? 'border-l border-line' : ''
                } ${
                  lastPreset === preset
                    ? 'bg-wash-strong text-ink'
                    : 'bg-paper text-muted hover:text-ink'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <button
            onClick={() => onRunPipeline(lastPreset)}
            disabled={isRunning}
            className="cta cta--primary cta--mini gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} strokeWidth={1.5} />
            <span>{isRunning ? 'Running Agents' : 'Sync Agents'}</span>
          </button>
        </div>
      </div>

      {/* Hairline stepper across the three agents */}
      <div className="mt-5 pt-5 border-t border-line flex flex-col sm:flex-row sm:items-center">
        {PIPELINE_STAGES.map((stage, i) => (
          <React.Fragment key={stage.id}>
            {i > 0 && (
              <span aria-hidden="true" className="hidden sm:block h-px w-10 bg-line shrink-0 mx-4" />
            )}
            <div
              className={`flex items-start gap-2.5 flex-1 min-w-0 ${
                i > 0 ? 'border-t border-line pt-3 mt-3 sm:border-t-0 sm:pt-0 sm:mt-0' : ''
              }`}
            >
              <span className={`${STAGE_MARK[stageState]} mt-[5px]`} />
              <div className="min-w-0">
                <div className={`text--body ${STAGE_LABEL_CLASS[stageState]}`}>{stage.label}</div>
                <div className="text--footnote text-muted mt-0.5">
                  {stage.caption}
                  <span aria-hidden="true"> · </span>
                  <span className={STAGE_WORD_CLASS[stageState]}>
                    {STAGE_WORD[stageState]}
                  </span>
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
