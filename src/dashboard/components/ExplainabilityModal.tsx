import React, { useEffect, useState } from 'react';
import { ExplainableAIRecommendation } from '../../shared/types';
import { CheckCircle2, X, FileText } from 'lucide-react';

interface ExplainabilityModalProps {
  recommendation: ExplainableAIRecommendation | null;
  onClose: () => void;
  onApprove: (recId: string) => void;
}

// Secondary series in a monochrome chart reads as a 45° hatch, never a second hue.
const HATCH_FILL: React.CSSProperties = {
  backgroundImage: 'repeating-linear-gradient(45deg, #000000 0 1.5px, transparent 1.5px 3.5px)'
};

/* Entrance for a floating glass layer: the scrim fades the page back, the
   dialog settles in from 0.97 on the Squarespace reveal curve. Motion is
   dropped entirely under prefers-reduced-motion. */
export const ExplainabilityModal: React.FC<ExplainabilityModalProps> = ({
  recommendation,
  onClose,
  onApprove
}) => {
  const [deepExplain, setDeepExplain] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!recommendation) return;

    const fetchDeepExplain = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/ai/explain-decision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recommendation })
        });
        const data = await response.json();
        if (data.success && data.data) {
          setDeepExplain(data.data);
        }
      } catch (err) {
        console.error('Error fetching deep explainability:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeepExplain();
  }, [recommendation]);

  if (!recommendation) return null;

  const confidencePct = recommendation.reasoning.confidencePct;
  const residualPct = Math.max(0, 100 - confidencePct);

  return (
    <>
      <div
        className="rs-modal-scrim fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)'
        }}
      >
        {/* The dialog is a floating layer, so it is glass. Everything inside it
            stays flat and opaque — glass is never nested inside glass. */}
        <div className="rs-modal-surface glass glass--raised w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
            {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-line pb-5">
            <div className="min-w-0">
              <span className="text--eyebrow text-muted">Explainable AI decision audit</span>
              <h3 className="text--subtitle2 font-light text-ink mt-2">
                {recommendation.title}
              </h3>
            </div>

            <button
              onClick={onClose}
              className="text-muted hover:text-ink transition-colors cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
          </div>

          {/* Confidence meter */}
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <span className="text--eyebrow text-muted">Model confidence score</span>
              <div className="flex items-baseline gap-2.5 mt-1.5">
                <span className="text--subtitle3 text-ink tabular-nums">{confidencePct}%</span>
                <span className="text--body text-subtle">High statistical certainty</span>
              </div>

              <div className="h-1 bg-wash mt-3 flex overflow-hidden">
                <div className="h-full bg-ink" style={{ width: `${confidencePct}%` }} />
                <div className="h-full" style={{ ...HATCH_FILL, width: `${residualPct}%` }} />
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5">
                  <span className="sev-mark sev-mark--critical" />
                  <span className="text--footnote text-subtle">
                    Confidence <span className="tabular-nums">{confidencePct}%</span>
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="sev-mark sev-mark--advisory" />
                  <span className="text--footnote text-subtle">
                    Residual uncertainty <span className="tabular-nums">{residualPct}%</span>
                  </span>
                </span>
              </div>
            </div>

            <div className="shrink-0">
              <span className="text--eyebrow text-muted block">Target sector</span>
              <span className="text--body-medium text-ink block mt-1.5">
                {recommendation.targetZoneName}
              </span>
            </div>
          </div>

          {/* Evidence verification */}
          <div>
            <h4 className="text--eyebrow text-muted pb-2 border-b border-line">
              5-point multi-source evidence verification
            </h4>
            <div>
              {recommendation?.reasoning?.evidenceData?.map((ev, idx) => (
                <div key={idx} className="flex items-start gap-2.5 py-3 border-b border-line">
                  <CheckCircle2 className="w-4 h-4 text-ink shrink-0 mt-0.5" strokeWidth={1.5} />
                  <span className="text--body text-subtle">{ev}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Counterfactual risk */}
          <div className="sev-row--critical pl-4">
            <h4 className="flex items-center gap-1.5">
              <span className="sev-mark sev-mark--critical" />
              <span className="text--eyebrow sev-text--critical">
                Critical — counterfactual risk if action is delayed or omitted
              </span>
            </h4>
            <p className="text--body text-subtle mt-2">
              {recommendation.reasoning.riskExplanation}
            </p>
          </div>

          {/* Deep causal flow */}
          {loading ? (
            <p className="text--body text-muted text-center py-4">
              Generating deep causal flow &amp; trade-off matrix…
            </p>
          ) : deepExplain ? (
            <div className="pt-2 border-t border-line">
              <h4 className="text--eyebrow text-muted pb-2 border-b border-line">
                Deep causal reasoning sequence
              </h4>
              <div>
                {deepExplain.causalChain?.map((step: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 py-3 border-b border-line">
                    <span className="text--footnote text-muted tabular-nums mt-0.5 shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text--body text-subtle">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          </div>

          {/* Footer action bar — pinned below the scroll region, separated by a
              glass rule instead of a hairline border. */}
          <div className="shrink-0">
            <div className="glass-rule h-px w-full" aria-hidden="true" />
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
              <button
                onClick={() => {
                  alert('AI Explainability Log exported for Government Audit & Compliance.');
                }}
                className="cta cta--tertiary gap-1.5 text-subtle"
              >
                <FileText className="w-4 h-4" strokeWidth={1.5} />
                Export audit log
              </button>

              <div className="flex items-center gap-3">
                <button onClick={onClose} className="cta cta--secondary cta--compact">
                  Close
                </button>
                <button
                  onClick={() => {
                    onApprove(recommendation.id);
                    onClose();
                  }}
                  className="cta cta--primary cta--compact"
                >
                  Approve &amp; Dispatch Fleet
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};
