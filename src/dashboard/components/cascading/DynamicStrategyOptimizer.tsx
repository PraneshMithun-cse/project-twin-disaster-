import React, { useState, useMemo } from 'react';
import {
  ResponseStrategy,
  StrategyMetrics,
  InfrastructureNode
} from '../../../shared/cascadingTypes';
import {
  Award,
  CheckCircle2,
  Plus,
  BarChart3,
  ShieldCheck,
  Clock,
  Activity,
  X,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Check,
  Coins
} from 'lucide-react';

interface DynamicStrategyOptimizerProps {
  strategies: ResponseStrategy[];
  approvedStrategyId: string | null;
  nodes: InfrastructureNode[];
  onApproveStrategy: (strategy: ResponseStrategy) => void;
  onAddCustomStrategy: (strategy: ResponseStrategy) => void;
}

/** 45° hatch, matching `.sev-mark--advisory`, used for the second series on a track. */
const HATCH_FILL = 'repeating-linear-gradient(45deg, #000000 0 1.5px, transparent 1.5px 3.5px)';
/** The same hatch in the safe accent, for a second series that is a protective outcome. */
const HATCH_FILL_SAFE = 'repeating-linear-gradient(45deg, #0e8a5f 0 1.5px, transparent 1.5px 3.5px)';

const clampPct = (value: number) => Math.max(0, Math.min(100, value));

/** `ink` = neutral score / operator weight. `safe` = a protective outcome. */
type TrackTone = 'ink' | 'safe';

/**
 * 4px wash track. The primary series is a solid fill; an optional second series
 * shares the same track as a 45° hatch, so shape — not colour — is what tells
 * the two series apart in print and for colour-blind readers. `tone` only layers
 * meaning on top: protective outcomes (lives evacuated, infrastructure kept up)
 * take the safe accent; scores and weights stay on the ink ramp. The legend next
 * to every chart names every series and shows its colour.
 */
const MetricTrack: React.FC<{ solidPct: number; hatchPct?: number; tone?: TrackTone }> = ({
  solidPct,
  hatchPct,
  tone = 'ink'
}) => (
  <div className="relative h-1 bg-wash rounded-[1px] overflow-hidden">
    {typeof hatchPct === 'number' && (
      <div
        className="absolute inset-y-0 left-0 transition-colors duration-[250ms]"
        style={{
          width: `${clampPct(hatchPct)}%`,
          backgroundImage: tone === 'safe' ? HATCH_FILL_SAFE : HATCH_FILL
        }}
      />
    )}
    <div
      className={`absolute inset-y-0 left-0 transition-colors duration-[250ms] ${tone === 'safe' ? 'bg-safe' : 'bg-ink'}`}
      style={{ width: `${clampPct(solidPct)}%` }}
    />
  </div>
);

export const DynamicStrategyOptimizer: React.FC<DynamicStrategyOptimizerProps> = ({
  strategies,
  approvedStrategyId,
  nodes,
  onApproveStrategy,
  onAddCustomStrategy
}) => {
  // Objective Weighting Sliders (Normalized percentages)
  const [weightSpeed, setWeightSpeed] = useState<number>(20);
  const [weightProtection, setWeightProtection] = useState<number>(25);
  const [weightEvacuation, setWeightEvacuation] = useState<number>(30);
  const [weightCoverage, setWeightCoverage] = useState<number>(15);
  const [weightCost, setWeightCost] = useState<number>(10);

  // Custom Strategy Creator Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [customTagline, setCustomTagline] = useState<string>('');
  const [customFocus, setCustomFocus] = useState<string>('High-Capacity Dewatering & Microgrid Backup');
  const [customResponseMin, setCustomResponseMin] = useState<number>(15);
  const [customEvacPct, setCustomEvacPct] = useState<number>(90);
  const [customProtectPct, setCustomProtectPct] = useState<number>(92);
  const [customCasualties, setCustomCasualties] = useState<number>(0);

  // Strategy Actions list in creator
  const [customActions, setCustomActions] = useState<Array<{ action: string; target: string; resourcesAssigned: string }>>([
    { action: 'Deploy High-Volume Mobile Pumps (x6)', target: 'Velachery Substation & Sluice Outfall', resourcesAssigned: 'PWD Emergency Fleet' },
    { action: 'Setup Temporary Microgrid Feeder Link', target: 'Velachery Apollo Hospital ICU', resourcesAssigned: 'TNEB Grid Operations' }
  ]);
  const [newActAction, setNewActAction] = useState<string>('');
  const [newActTarget, setNewActTarget] = useState<string>('');
  const [newActResource, setNewActResource] = useState<string>('');

  // Comparison Matrix Modal
  const [showMatrixModal, setShowMatrixModal] = useState<boolean>(false);

  // Strategy Dispatch Notification Banner
  const [dispatchNotice, setDispatchNotice] = useState<string | null>(null);

  // Preset Handlers
  const handleApplyPreset = (preset: 'life' | 'power' | 'speed' | 'cost') => {
    if (preset === 'life') {
      setWeightEvacuation(45);
      setWeightProtection(25);
      setWeightSpeed(20);
      setWeightCoverage(10);
      setWeightCost(0);
    } else if (preset === 'power') {
      setWeightProtection(50);
      setWeightEvacuation(20);
      setWeightSpeed(20);
      setWeightCoverage(10);
      setWeightCost(0);
    } else if (preset === 'speed') {
      setWeightSpeed(50);
      setWeightEvacuation(25);
      setWeightProtection(15);
      setWeightCoverage(10);
      setWeightCost(0);
    } else if (preset === 'cost') {
      setWeightCost(35);
      setWeightSpeed(20);
      setWeightProtection(20);
      setWeightEvacuation(15);
      setWeightCoverage(10);
    }
  };

  const handleResetWeights = () => {
    setWeightSpeed(20);
    setWeightProtection(25);
    setWeightEvacuation(30);
    setWeightCoverage(15);
    setWeightCost(10);
  };

  // Dynamically recalculate strategy overallScores based on objective weights
  const optimizedStrategies = useMemo(() => {
    const totalWeight = (weightSpeed + weightProtection + weightEvacuation + weightCoverage + weightCost) || 1;
    const wSpeed = weightSpeed / totalWeight;
    const wProtect = weightProtection / totalWeight;
    const wEvac = weightEvacuation / totalWeight;
    const wCov = weightCoverage / totalWeight;
    const wCost = weightCost / totalWeight;

    const scored = strategies.map(strat => {
      const m = strat.metrics;
      // Speed score: 100 - (responseTimeMins / 60 * 100) bounded
      const speedScore = Math.max(0, 100 - (m.responseTimeMins * 1.5));
      // Cost score: 100 - operationalCostScore
      const costScore = Math.max(0, 100 - m.operationalCostScore);
      // Casualty penalty
      const casualtyPenalty = m.estimatedCasualties * 15;

      const rawScore = (
        speedScore * wSpeed +
        m.infrastructureProtectionPct * wProtect +
        m.evacuationEfficiencyPct * wEvac +
        m.populationCoveragePct * wCov +
        costScore * wCost
      ) - casualtyPenalty;

      const score = Math.min(99.9, Math.max(10, Math.round(rawScore * 10) / 10));

      return {
        ...strat,
        metrics: {
          ...strat.metrics,
          overallScore: score
        }
      };
    });

    // Sort descending by overallScore and assign rank
    return scored.sort((a, b) => b.metrics.overallScore - a.metrics.overallScore)
      .map((strat, idx) => ({
        ...strat,
        rank: idx + 1,
        isOptimal: idx === 0
      }));
  }, [strategies, weightSpeed, weightProtection, weightEvacuation, weightCoverage, weightCost]);

  const handleAddActionItem = () => {
    if (!newActAction.trim() || !newActTarget.trim()) return;
    setCustomActions(prev => [
      ...prev,
      {
        action: newActAction,
        target: newActTarget,
        resourcesAssigned: newActResource || 'Command Unit'
      }
    ]);
    setNewActAction('');
    setNewActTarget('');
    setNewActResource('');
  };

  const handleCreateCustomStrategy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newStrategy: ResponseStrategy = {
      id: `strat-custom-${Date.now()}`,
      name: customName,
      code: 'strategy_d',
      tagline: customTagline || 'Custom user-designed response strategy plan',
      description: `User-optimized emergency response plan targeting ${customFocus}.`,
      primaryFocus: customFocus,
      rank: 1,
      isOptimal: false,
      metrics: {
        responseTimeMins: customResponseMin,
        evacuationEfficiencyPct: customEvacPct,
        resourceUtilizationPct: 85,
        populationCoveragePct: 92,
        estimatedCasualties: customCasualties,
        infrastructureProtectionPct: customProtectPct,
        operationalCostScore: 30,
        overallScore: 90
      },
      actions: customActions,
      tradeoffs: {
        pros: [
          `Targeted interventions designed specifically for ${customFocus}`,
          `Pre-positioned resources reduce delay to ${customResponseMin} mins`
        ],
        cons: [
          `Requires dedicated resource commitment from central reserves`
        ]
      }
    };

    onAddCustomStrategy(newStrategy);
    setShowCreateModal(false);
    setCustomName('');
    setCustomTagline('');
  };

  const handleDispatch = (strat: ResponseStrategy) => {
    onApproveStrategy(strat);
    setDispatchNotice(`Strategy "${strat.name}" dispatched! Infrastructure protection actions deployed to grid.`);
    setTimeout(() => setDispatchNotice(null), 6000);
  };

  const fieldClass =
    'w-full bg-paper border border-line rounded-[4px] p-2 text--body text-ink outline-none focus:border-ink transition-colors';

  // Objective weight sliders — one shape, no hue, each with its own read-out track.
  const objectiveSliders: {
    key: string;
    label: string;
    value: number;
    setValue: (v: number) => void;
    Icon: typeof Clock;
  }[] = [
    { key: 'speed', label: 'Speed', value: weightSpeed, setValue: setWeightSpeed, Icon: Clock },
    { key: 'protection', label: 'Grid safety', value: weightProtection, setValue: setWeightProtection, Icon: ShieldCheck },
    { key: 'evacuation', label: 'Life evacuation', value: weightEvacuation, setValue: setWeightEvacuation, Icon: Activity },
    { key: 'coverage', label: 'Coverage', value: weightCoverage, setValue: setWeightCoverage, Icon: TrendingUp },
    { key: 'cost', label: 'Cost efficiency', value: weightCost, setValue: setWeightCost, Icon: Coins }
  ];

  return (
    <div className="space-y-5">
      {/* Dispatch Banner Notice — a dispatched strategy is a resolved /
          delivered outcome, so it takes the safe accent */}
      {dispatchNotice && (
        <div className="panel sev-row--ok p-3.5 flex items-center justify-between gap-3 animate-reveal">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-safe flex-shrink-0" strokeWidth={1.5} />
            <span className="text--body-medium text-safe-strong">{dispatchNotice}</span>
          </div>
          <button onClick={() => setDispatchNotice(null)} className="cta cta--inline text-muted hover:text-ink">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* 1. Header & Optimization Controls Toolbar */}
      <div className="panel p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 pb-3 border-b border-line">
          <div>
            <span className="text--eyebrow text-muted block mb-1.5">Multi-objective optimizer</span>
            <h2 className="text--subtitle3 text-ink flex items-center gap-2">
              <Award className="w-4 h-4" strokeWidth={1.5} />
              Dynamic response strategy optimizer
            </h2>
            <p className="text--body text-subtle mt-1.5 max-w-2xl">
              Adjust objective priorities below to re-evaluate trade-offs and re-rank disaster response plans in real time.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowMatrixModal(true)}
              className="cta cta--secondary cta--compact gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Compare Matrix</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="cta cta--primary cta--compact gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Create Strategy</span>
            </button>
          </div>
        </div>

        {/* Sliders Grid for Multi-Objective Weighting */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 panel--wash p-3.5">
          {objectiveSliders.map(({ key, label, value, setValue, Icon }) => (
            <div key={key} className="space-y-1.5">
              <div className="flex justify-between items-center text--footnote">
                <span className="text-subtle flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} /> {label}
                </span>
                <span className="text-ink font-medium tabular-nums">{value}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full accent-ink bg-wash-strong h-1 cursor-pointer"
              />
              <MetricTrack solidPct={value} />
            </div>
          ))}
        </div>

        {/* Presets Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text--eyebrow text-muted mr-1">Objective presets</span>
            <button onClick={() => handleApplyPreset('life')} className="cta cta--secondary cta--mini">
              Max ICU &amp; Life Safety
            </button>
            <button onClick={() => handleApplyPreset('power')} className="cta cta--secondary cta--mini">
              Grid &amp; Power Preservation
            </button>
            <button onClick={() => handleApplyPreset('speed')} className="cta cta--secondary cta--mini">
              Rapid Response Speed
            </button>
            <button onClick={() => handleApplyPreset('cost')} className="cta cta--secondary cta--mini">
              Fiscal &amp; Resource Constrained
            </button>
          </div>

          <button onClick={handleResetWeights} className="cta cta--tertiary gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Reset Weights</span>
          </button>
        </div>

        {/* Chart legend — every series named, and every swatch shows its colour */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 border-t border-line">
          <span className="text--eyebrow text-muted">Bar legend</span>
          <span className="flex items-center gap-2 text--footnote text-subtle">
            <span className="block w-9 h-1 bg-ink rounded-[1px]" />
            Solid black — weighted score &amp; objective weight
          </span>
          <span className="flex items-center gap-2 text--footnote text-subtle">
            <span className="block w-9 h-1 bg-safe rounded-[1px]" />
            Solid green — evacuation efficiency (lives protected)
          </span>
          <span className="flex items-center gap-2 text--footnote text-subtle">
            <span className="block w-9 h-1 rounded-[1px]" style={{ backgroundImage: HATCH_FILL_SAFE }} />
            Hatched green — infrastructure protection
          </span>
          <span className="flex items-center gap-2 text--footnote text-subtle">
            <span className="block w-9 h-1 bg-wash rounded-[1px]" />
            Track — 0 to 100% scale
          </span>
        </div>
      </div>

      {/* 2. Dynamically Scored & Ranked Strategy Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {optimizedStrategies.map((strat) => {
          const isApproved = approvedStrategyId === strat.id;

          return (
            <div
              key={strat.id}
              className={`panel lift p-5 flex flex-col justify-between relative ${
                strat.isOptimal ? 'sev-row--critical' : ''
              }`}
            >
              {/* Optimal Badge */}
              {strat.isOptimal && (
                <div className="absolute -top-2.5 left-4">
                  <span className="badge badge--critical">Rank 1 — recommended</span>
                </div>
              )}

              <div className="space-y-4 pt-1">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text--eyebrow text-muted">Rank #{strat.rank}</span>
                    <span className="text--body-medium text-ink tabular-nums">
                      {strat.metrics.overallScore} / 100 pts
                    </span>
                  </div>
                  <h3 className="text--subtitle3 text-ink mt-2">{strat.name}</h3>
                  <p className="text--footnote text-muted mt-1">{strat.tagline}</p>

                  {/* Overall score track — solid black on wash */}
                  <div className="mt-3">
                    <MetricTrack solidPct={strat.metrics.overallScore} />
                    <div className="flex justify-between text--footnote text-muted mt-1 tabular-nums">
                      <span>0</span>
                      <span>100</span>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics Summary */}
                <div className="panel--wash p-3 space-y-3">
                  <div className="flex justify-between items-center text--footnote">
                    <span className="text-muted">Response time</span>
                    <span className="text-ink font-medium tabular-nums">{strat.metrics.responseTimeMins} mins</span>
                  </div>

                  {/* Two series, one track: solid = evacuation, hatch = grid
                      protection. Both are protective outcomes, so both take the
                      safe accent; the solid/hatch shape still separates them. */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text--footnote">
                      <span className="text-muted">Evacuation efficiency (solid)</span>
                      <span className="text-safe-strong font-medium tabular-nums transition-colors duration-[250ms]">{strat.metrics.evacuationEfficiencyPct}%</span>
                    </div>
                    <div className="flex justify-between items-center text--footnote">
                      <span className="text-muted">Grid protection (hatched)</span>
                      <span className="text-safe-strong font-medium tabular-nums transition-colors duration-[250ms]">{strat.metrics.infrastructureProtectionPct}%</span>
                    </div>
                    <MetricTrack
                      solidPct={strat.metrics.evacuationEfficiencyPct}
                      hatchPct={strat.metrics.infrastructureProtectionPct}
                      tone="safe"
                    />
                  </div>

                  <div className="flex justify-between items-center text--footnote pt-1 border-t border-line">
                    <span className="text-muted">Est. casualties</span>
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`sev-mark ${strat.metrics.estimatedCasualties === 0 ? 'sev-mark--ok' : 'sev-mark--critical'}`}
                      />
                      <span
                        className={`tabular-nums ${
                          strat.metrics.estimatedCasualties === 0 ? 'sev-text--ok' : 'sev-text--critical'
                        }`}
                      >
                        {strat.metrics.estimatedCasualties}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Actions Deployment Items */}
                <div>
                  <span className="text--eyebrow text-muted block mb-2">
                    Targeted action deployments
                  </span>
                  <ul className="border-t border-line">
                    {strat.actions?.map((act, i) => (
                      <li key={i} className="flex items-start gap-2 py-2.5 border-b border-line">
                        <ArrowRight className="w-3.5 h-3.5 text-muted flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                        <div>
                          <span className="text--body-medium text-ink block">{act.action}</span>
                          <span className="text--footnote text-muted block mt-0.5">
                            {act.target} · {act.resourcesAssigned}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pros & Cons Trade-offs */}
                <div className="space-y-3 pt-1">
                  <div>
                    <span className="text--eyebrow text-muted block mb-1.5">
                      Optimization benefits
                    </span>
                    <ul className="space-y-1">
                      {/* Optimisation benefits are protective gains → safe rule */}
                      {strat.tradeoffs?.pros?.map((p, i) => (
                        <li key={i} className="text--footnote text-subtle sev-row--ok pl-2.5">{p}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text--eyebrow text-muted block mb-1.5">
                      Trade-off costs
                    </span>
                    <ul className="space-y-1">
                      {strat.tradeoffs?.cons?.map((c, i) => (
                        <li key={i} className="text--footnote text-subtle sev-row--advisory pl-2.5">{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>

              {/* Approve & Dispatch Button */}
              <div className="pt-4 mt-4 border-t border-line">
                <button
                  onClick={() => handleDispatch(strat)}
                  disabled={isApproved}
                  className={`cta ${isApproved ? 'cta--secondary text-safe-strong' : 'cta--primary'} cta--compact w-full gap-2 disabled:cursor-default transition-colors duration-[250ms]`}
                >
                  {isApproved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                      <span>Strategy Active</span>
                    </>
                  ) : (
                    <>
                      <span>Approve &amp; Dispatch</span>
                      <span className="cta__arrow">→</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* 3. Create Custom Strategy Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={handleCreateCustomStrategy} className="panel p-5 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-line">
              <span className="text--subtitle3 text-ink flex items-center gap-2">
                <Plus className="w-4 h-4" strokeWidth={1.5} /> Create custom response plan
              </span>
              <button type="button" onClick={() => setShowCreateModal(false)} className="cta cta--inline text-muted hover:text-ink">
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text--eyebrow text-muted block mb-1.5">Strategy name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Strategy Delta: Rapid Microgrid & Boat Fleet"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className={fieldClass}
                />
              </div>

              <div>
                <label className="text--eyebrow text-muted block mb-1.5">Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. High-mobility amphibious rescue with targeted power backup"
                  value={customTagline}
                  onChange={(e) => setCustomTagline(e.target.value)}
                  className={fieldClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text--eyebrow text-muted block mb-1.5">Response time (mins)</label>
                  <input
                    type="number"
                    value={customResponseMin}
                    onChange={(e) => setCustomResponseMin(Number(e.target.value))}
                    className={`${fieldClass} tabular-nums`}
                  />
                </div>
                <div>
                  <label className="text--eyebrow text-muted block mb-1.5">Grid protection %</label>
                  <input
                    type="number"
                    value={customProtectPct}
                    onChange={(e) => setCustomProtectPct(Number(e.target.value))}
                    className={`${fieldClass} tabular-nums`}
                  />
                </div>
              </div>

              {/* Action items builder */}
              <div className="border-t border-line pt-3 space-y-2">
                <span className="text--eyebrow text-muted block">Deployment actions</span>

                <div className="max-h-36 overflow-y-auto border-t border-line">
                  {customActions.map((act, idx) => (
                    <div key={idx} className="py-2 border-b border-line flex items-center justify-between gap-2">
                      <div>
                        <span className="text--body-medium text-ink block">{act.action}</span>
                        <span className="text--footnote text-muted">
                          Target: {act.target} · {act.resourcesAssigned}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCustomActions(prev => prev.filter((_, i) => i !== idx))}
                        className="cta cta--inline text-muted hover:text-ink"
                      >
                        <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Action Sub-Form */}
                <div className="panel--wash p-3 space-y-2">
                  <input
                    type="text"
                    placeholder="Action title (e.g. Pre-position 250kW diesel generator)"
                    value={newActAction}
                    onChange={(e) => setNewActAction(e.target.value)}
                    className={fieldClass}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Target asset"
                      value={newActTarget}
                      onChange={(e) => setNewActTarget(e.target.value)}
                      className={fieldClass}
                    />
                    <input
                      type="text"
                      placeholder="Resources"
                      value={newActResource}
                      onChange={(e) => setNewActResource(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddActionItem}
                    className="cta cta--secondary cta--mini w-full gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" strokeWidth={1.5} /> Add Action Item
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="cta cta--tertiary"
              >
                Cancel
              </button>
              <button type="submit" className="cta cta--primary cta--compact">
                Assemble &amp; Evaluate
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Multi-Strategy Metric Comparison Matrix Modal */}
      {showMatrixModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="panel p-5 max-w-3xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-line">
              <span className="text--subtitle3 text-ink flex items-center gap-2">
                <BarChart3 className="w-4 h-4" strokeWidth={1.5} /> Side-by-side comparison matrix
              </span>
              <button onClick={() => setShowMatrixModal(false)} className="cta cta--inline text-muted hover:text-ink">
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* Legend for the in-table bars */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="text--eyebrow text-muted">Legend</span>
              <span className="flex items-center gap-2 text--footnote text-subtle">
                <span className="block w-9 h-1 bg-ink rounded-[1px]" /> Weighted score, 0–100
              </span>
              <span className="flex items-center gap-2 text--footnote text-subtle">
                <span className="block w-9 h-1 bg-safe rounded-[1px]" /> Protective outcomes — evac efficiency, grid protection
              </span>
              <span className="flex items-center gap-2 text--footnote text-subtle">
                <span className="sev-mark sev-mark--critical" /> Casualties above zero
              </span>
              <span className="flex items-center gap-2 text--footnote text-subtle">
                <span className="sev-mark sev-mark--ok" /> Zero casualties
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-wash border-b border-line">
                    <th className="p-2.5 text--eyebrow text-muted font-medium">Strategy plan</th>
                    <th className="p-2.5 text--eyebrow text-muted font-medium">Rank &amp; score</th>
                    <th className="p-2.5 text--eyebrow text-muted font-medium">Response speed</th>
                    <th className="p-2.5 text--eyebrow text-muted font-medium">Evac efficiency</th>
                    <th className="p-2.5 text--eyebrow text-muted font-medium">Grid protection</th>
                    <th className="p-2.5 text--eyebrow text-muted font-medium">Casualties</th>
                  </tr>
                </thead>
                <tbody>
                  {optimizedStrategies.map((strat) => (
                    <tr key={strat.id} className={`border-b border-line ${strat.isOptimal ? 'bg-wash' : ''}`}>
                      <td className="p-2.5">
                        <span className="text--body-medium text-ink block">{strat.name}</span>
                        <span className="text--footnote text-muted">{strat.primaryFocus}</span>
                      </td>
                      <td className="p-2.5 min-w-[120px]">
                        <span className="text--body-medium text-ink tabular-nums block">
                          {strat.metrics.overallScore} pts
                        </span>
                        <span className="text--footnote text-muted block mb-1.5">Rank #{strat.rank}</span>
                        <MetricTrack solidPct={strat.metrics.overallScore} />
                      </td>
                      <td className="p-2.5 text--body text-near tabular-nums">{strat.metrics.responseTimeMins} mins</td>
                      <td className="p-2.5 text--body text-safe-strong tabular-nums transition-colors duration-[250ms]">{strat.metrics.evacuationEfficiencyPct}%</td>
                      <td className="p-2.5 text--body text-safe-strong tabular-nums transition-colors duration-[250ms]">{strat.metrics.infrastructureProtectionPct}%</td>
                      <td className="p-2.5">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`sev-mark ${strat.metrics.estimatedCasualties === 0 ? 'sev-mark--ok' : 'sev-mark--critical'}`}
                          />
                          <span
                            className={`tabular-nums ${
                              strat.metrics.estimatedCasualties === 0 ? 'sev-text--ok' : 'sev-text--critical'
                            }`}
                          >
                            {strat.metrics.estimatedCasualties}
                          </span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-line">
              <button
                onClick={() => setShowMatrixModal(false)}
                className="cta cta--primary cta--compact"
              >
                Close Matrix
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
