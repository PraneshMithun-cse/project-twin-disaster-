import React from 'react';

export interface InfrastructureNode {
  id: string;
  name: string;
  category: 'power' | 'subway' | 'water' | 'hospital';
  status: 'operational' | 'warning' | 'failed';
  impactScore: number;
  dependentNodes: string[];
}

interface CascadingMatrixGridProps {
  nodes: InfrastructureNode[];
  onSelectNode: (node: InfrastructureNode) => void;
  selectedNodeId?: string;
}

/**
 * Monochrome intensity ramp. Hue is gone, so failure-impact magnitude is
 * carried entirely by the alpha of a black fill. Bounds are published in the
 * legend so any cell can be decoded back to a number.
 */
const IMPACT_RAMP: { upperBound: number; alpha: number; label: string }[] = [
  { upperBound: 20, alpha: 0.04, label: '0–20' },
  { upperBound: 40, alpha: 0.1, label: '21–40' },
  { upperBound: 60, alpha: 0.2, label: '41–60' },
  { upperBound: 80, alpha: 0.35, label: '61–80' },
  { upperBound: 92, alpha: 0.55, label: '81–92' },
  { upperBound: 100, alpha: 0.78, label: '93–100' }
];

const rampStepFor = (score: number) =>
  IMPACT_RAMP.find(step => score <= step.upperBound) ?? IMPACT_RAMP[IMPACT_RAMP.length - 1];

/** Fills at or above this alpha are dark enough that type must invert. */
const INVERT_TEXT_AT = 0.55;

export const CascadingMatrixGrid: React.FC<CascadingMatrixGridProps> = ({
  nodes,
  onSelectNode,
  selectedNodeId
}) => {
  // Status is encoded by mark shape plus an always-visible word, never by hue.
  const getStatusMark = (status: InfrastructureNode['status']) => {
    switch (status) {
      case 'failed':
        return 'sev-mark sev-mark--critical';
      case 'warning':
        return 'sev-mark sev-mark--advisory';
      default:
        return 'sev-mark sev-mark--ok';
    }
  };

  const getStatusLabel = (status: InfrastructureNode['status']) => {
    switch (status) {
      case 'failed':
        return 'FAILED';
      case 'warning':
        return 'WARNING';
      default:
        return 'OPERATIONAL';
    }
  };

  return (
    <div className="space-y-3">
      {/* Legends — the ramp and the marks are the only encodings, so both are published */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <span className="text--eyebrow text-muted block">Failure impact index</span>
          <div className="flex items-end">
            {IMPACT_RAMP.map(step => (
              <div key={step.upperBound} className="flex flex-col items-center">
                <span
                  className="block w-11 h-3 border-t border-b border-r border-line first:border-l"
                  style={{ backgroundColor: `rgba(0,0,0,${step.alpha})` }}
                />
                <span className="text--footnote text-muted mt-1 tabular-nums">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <span className="text--eyebrow text-muted">Asset status</span>
          <span className="flex items-center gap-1.5 text--footnote text-subtle">
            <span className="sev-mark sev-mark--ok" /> Operational
          </span>
          <span className="flex items-center gap-1.5 text--footnote text-subtle">
            <span className="sev-mark sev-mark--advisory" /> Warning
          </span>
          <span className="flex items-center gap-1.5 text--footnote text-subtle">
            <span className="sev-mark sev-mark--critical" /> Failed
          </span>
        </div>
      </div>

      {/* Matrix — hairline 1px grid, cell fill carries the impact score */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-line">
        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const step = rampStepFor(node.impactScore);
          const inverted = step.alpha >= INVERT_TEXT_AT;

          return (
            <div
              key={node.id}
              onClick={() => onSelectNode(node)}
              className={`relative p-3 border-r border-b border-line cursor-pointer transition-colors ${
                inverted ? 'text-paper' : 'text-near'
              }`}
              style={{
                backgroundColor: `rgba(0,0,0,${step.alpha})`,
                boxShadow: isSelected ? 'inset 0 0 0 2px var(--ink)' : undefined
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`text--eyebrow ${inverted ? 'text-paper' : 'text-muted'}`}>
                  {node.category}
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className={getStatusMark(node.status)}
                    style={inverted ? { filter: 'invert(1)' } : undefined}
                  />
                  <span className={`text--footnote ${inverted ? 'text-paper' : 'text-subtle'}`}>
                    {getStatusLabel(node.status)}
                  </span>
                </span>
              </div>

              <h4 className="text--body-medium mb-2">{node.name}</h4>

              <div
                className={`flex items-center justify-between text--footnote pt-2 border-t ${
                  inverted ? 'border-white/30' : 'border-line'
                }`}
              >
                <span className={inverted ? 'text-paper' : 'text-muted'}>Failure impact</span>
                <span className="tabular-nums font-medium">{node.impactScore}/100</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
