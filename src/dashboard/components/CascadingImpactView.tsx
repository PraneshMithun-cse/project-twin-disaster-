import React, { useState, useEffect, useRef } from 'react';
import {
  InfrastructureNode,
  DependencyEdge,
  CascadingImpactPrediction,
  ResponseStrategy,
  WhatIfParameters,
  TimeIntervalForecast,
  ExplainableDecisionReport,
  AssetStatus,
  AssetCategory
} from '../../shared/cascadingTypes';
import {
  INITIAL_INFRASTRUCTURE_NODES,
  INITIAL_DEPENDENCY_EDGES,
  INITIAL_CASCADING_PREDICTIONS,
  INITIAL_RESPONSE_STRATEGIES,
  DEFAULT_WHAT_IF_PARAMS,
  INITIAL_TIME_FORECASTS,
  INITIAL_EXPLAINABLE_REPORT,
  recalculateCascadingSimulation
} from '../../shared/cascadingData';
import { InteractiveTopologyMap } from './cascading/InteractiveTopologyMap';
import { DynamicStrategyOptimizer } from './cascading/DynamicStrategyOptimizer';
import {
  Zap,
  Activity,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  GitBranch,
  ShieldAlert,
  Award,
  Clock,
  TrendingUp,
  Building2,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Info,
  Server,
  Layers,
  MapPin,
  Cpu,
  ChevronRight,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Eye
} from 'lucide-react';

interface CascadingImpactViewProps {
  onNavigateToTab?: (tab: string) => void;
  onApplyCascadingStrategy?: (strategy: ResponseStrategy) => void;
}

export default function CascadingImpactView({ onNavigateToTab, onApplyCascadingStrategy }: CascadingImpactViewProps) {
  // 1. Core State
  const [nodes, setNodes] = useState<InfrastructureNode[]>(INITIAL_INFRASTRUCTURE_NODES);
  const [edges, setEdges] = useState<DependencyEdge[]>(INITIAL_DEPENDENCY_EDGES);
  const [predictions, setPredictions] = useState<CascadingImpactPrediction[]>(INITIAL_CASCADING_PREDICTIONS);
  const [strategies, setStrategies] = useState<ResponseStrategy[]>(INITIAL_RESPONSE_STRATEGIES);
  const [whatIfParams, setWhatIfParams] = useState<WhatIfParameters>(DEFAULT_WHAT_IF_PARAMS);
  const [forecasts, setForecasts] = useState<TimeIntervalForecast[]>(INITIAL_TIME_FORECASTS);
  const [explainReport, setExplainReport] = useState<ExplainableDecisionReport>(INITIAL_EXPLAINABLE_REPORT);

  // Active View Tabs
  const [activeTab, setActiveTab] = useState<'graph' | 'strategies' | 'whatif' | 'report'>('graph');

  // Timeline Scrubber State
  const [timeIndex, setTimeIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Selected Node Inspector
  const [selectedNode, setSelectedNode] = useState<InfrastructureNode | null>(nodes[0]);

  // Loading / AI Re-calculation
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [approvedStrategyId, setApprovedStrategyId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showInfographic, setShowInfographic] = useState<boolean>(false);

  // Auto Scrubber Animation Effect
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimeIndex((prev) => (prev + 1) % forecasts.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, forecasts.length]);

  // Current Forecast Interval
  const currentForecast = forecasts[timeIndex] || forecasts[0];

  // Auto-fetch simulation from Agent endpoint on mount
  useEffect(() => {
    handleCalculateSimulation(whatIfParams);
  }, []);

  // Re-calculate simulation on What-If parameters update
  const handleCalculateSimulation = async (updatedParams: WhatIfParameters) => {
    setIsSimulating(true);
    setWhatIfParams(updatedParams);

    try {
      // Call backend API for AI analysis
      const resp = await fetch('/api/ai/cascading-impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedParams)
      });

      if (resp.ok) {
        const json = await resp.json();
        if (json.success && json.data) {
          if (json.data.nodes) {
            setNodes(json.data.nodes);
            setSelectedNode(json.data.nodes[0] || null);
          }
          if (json.data.edges) setEdges(json.data.edges);
          if (json.data.predictions) setPredictions(json.data.predictions);
          if (json.data.strategies) setStrategies(json.data.strategies);
          if (json.data.forecasts) setForecasts(json.data.forecasts);
          if (json.data.report) setExplainReport(json.data.report);
          setIsSimulating(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend API call fallback to local calculation engine:', err);
    }

    // Deterministic fallback engine
    const simResult = recalculateCascadingSimulation(INITIAL_INFRASTRUCTURE_NODES, INITIAL_DEPENDENCY_EDGES, updatedParams);
    setNodes(simResult.updatedNodes);
    setPredictions(simResult.updatedPredictions);
    setStrategies(simResult.updatedStrategies);
    setForecasts(simResult.updatedForecasts);
    setExplainReport(simResult.updatedReport);
    setIsSimulating(false);
  };

  const handleResetWhatIf = () => {
    handleCalculateSimulation(DEFAULT_WHAT_IF_PARAMS);
  };

  const handleToggleBridge = (nodeId: string) => {
    const closed = whatIfParams.closedBridges.includes(nodeId)
      ? whatIfParams.closedBridges.filter(id => id !== nodeId)
      : [...whatIfParams.closedBridges, nodeId];
    handleCalculateSimulation({ ...whatIfParams, closedBridges: closed });
  };

  const handleTogglePower = (nodeId: string) => {
    const disabled = whatIfParams.disabledPowerStations.includes(nodeId)
      ? whatIfParams.disabledPowerStations.filter(id => id !== nodeId)
      : [...whatIfParams.disabledPowerStations, nodeId];
    handleCalculateSimulation({ ...whatIfParams, disabledPowerStations: disabled });
  };

  const handleToggleHospital = (nodeId: string) => {
    const disabled = whatIfParams.disabledHospitals.includes(nodeId)
      ? whatIfParams.disabledHospitals.filter(id => id !== nodeId)
      : [...whatIfParams.disabledHospitals, nodeId];
    handleCalculateSimulation({ ...whatIfParams, disabledHospitals: disabled });
  };

  // Interactive Topology & Strategy Handlers
  const handleUpdateNode = (updatedNode: InfrastructureNode) => {
    setNodes(prev => prev.map(n => n.id === updatedNode.id ? updatedNode : n));
    if (selectedNode?.id === updatedNode.id) {
      setSelectedNode(updatedNode);
    }
  };

  const handleAddNode = (newNode: InfrastructureNode) => {
    setNodes(prev => [...prev, newNode]);
    setSelectedNode(newNode);
  };

  const handleAddEdge = (newEdge: DependencyEdge) => {
    setEdges(prev => [...prev, newEdge]);
  };

  const handleUpdateEdge = (updatedEdge: DependencyEdge) => {
    setEdges(prev => prev.map(e => e.id === updatedEdge.id ? updatedEdge : e));
  };

  const handleDeleteEdge = (edgeId: string) => {
    setEdges(prev => prev.filter(e => e.id !== edgeId));
  };

  const handleTriggerNodeCascade = (nodeId: string) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          healthPct: 0,
          failureProbability: 100,
          status: 'FAILED'
        };
      }
      return n;
    }));

    const targetNode = nodes.find(n => n.id === nodeId);
    if (targetNode) {
      const newPrediction: CascadingImpactPrediction = {
        id: `casc-trigger-${Date.now()}`,
        sourceAssetId: nodeId,
        sourceAssetName: targetNode.name,
        targetAssetId: 'downstream-dependents',
        targetAssetName: 'Connected Downstream Grid Network',
        cascadeLevel: 'PRIMARY',
        estimatedTimeMin: 10,
        impactSeverity: 'CRITICAL',
        confidenceScore: 98,
        criticalityScore: 95,
        geographicArea: targetNode.zoneName,
        affectedInfrastructure: ['Downstream Substation Feeders', 'Emergency Access Corridors'],
        recommendedPriority: 'P1 - Immediate Intervention',
        explanation: `Manual stress-test trigger failed ${targetNode.name}, initiating immediate cascade trip across connected dependency edges.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setPredictions(prev => [newPrediction, ...prev]);
    }
  };

  const handleIsolateNode = (nodeId: string) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        const boostedHealth = Math.min(100, n.healthPct + 40);
        return {
          ...n,
          healthPct: boostedHealth,
          failureProbability: Math.max(0, 100 - boostedHealth),
          status: boostedHealth >= 80 ? 'OPERATIONAL' : 'AT_RISK'
        };
      }
      return n;
    }));
  };

  const handleApproveStrategy = (strat: ResponseStrategy) => {
    setApprovedStrategyId(strat.id);

    if (onApplyCascadingStrategy) {
      onApplyCascadingStrategy(strat);
    }

    setNodes(prev => prev.map(n => {
      if (n.category === 'Power Stations' || n.category === 'Hospitals' || n.category === 'Drainage Networks') {
        const boosted = Math.min(100, n.healthPct + 35);
        return {
          ...n,
          healthPct: boosted,
          failureProbability: Math.max(0, 100 - boosted),
          status: boosted >= 80 ? 'OPERATIONAL' : 'AT_RISK'
        };
      }
      return n;
    }));

    setPredictions(prev => prev.map(p => ({
      ...p,
      impactSeverity: p.impactSeverity === 'CRITICAL' ? 'MEDIUM' : 'LOW',
      explanation: `${p.explanation} [Mitigated by dispatched strategy "${strat.name}"].`
    })));
  };

  const handleAddCustomStrategy = (newStrategy: ResponseStrategy) => {
    setStrategies(prev => [newStrategy, ...prev]);
  };

  // Helper to get disaster specific parameter ranges and labels
  const paramMeta = (() => {
    switch (whatIfParams.activeDisasterType) {
      case 'cyclone':
        return {
          param1Label: 'Sustained Wind Speed Escalation:',
          param1Unit: '%',
          param1Min: 0,
          param1Max: 100,
          param1Step: 5,
          param2Label: 'Tidal Storm Surge Depth:',
          param2Unit: ' m',
          param2Min: 1,
          param2Max: 10,
          param2Step: 0.5,
        };
      case 'earthquake':
        return {
          param1Label: 'Seismic Shock Escalation:',
          param1Unit: '%',
          param1Min: 0,
          param1Max: 100,
          param1Step: 5,
          param2Label: 'Peak Ground Acceleration:',
          param2Unit: ' m/s²',
          param2Min: 50,
          param2Max: 500,
          param2Step: 25,
        };
      case 'wildfire':
        return {
          param1Label: 'Flame Spread Velocity Increase:',
          param1Unit: '%',
          param1Min: 0,
          param1Max: 100,
          param1Step: 5,
          param2Label: 'Wind Gust & Thermal Radiation:',
          param2Unit: ' km/h',
          param2Min: 20,
          param2Max: 200,
          param2Step: 10,
        };
      case 'landslide':
        return {
          param1Label: 'Soil Saturation Escalation:',
          param1Unit: '%',
          param1Min: 0,
          param1Max: 100,
          param1Step: 5,
          param2Label: 'Slope Debris Flow Discharge:',
          param2Unit: ' m³/s',
          param2Min: 50,
          param2Max: 600,
          param2Step: 25,
        };
      case 'tsunami':
        return {
          param1Label: 'Inundation Surge Elevation:',
          param1Unit: '%',
          param1Min: 0,
          param1Max: 100,
          param1Step: 5,
          param2Label: 'Coastal Wave Velocity:',
          param2Unit: ' m/s',
          param2Min: 10,
          param2Max: 100,
          param2Step: 5,
        };
      case 'flood':
      default:
        return {
          param1Label: 'Rainfall Rate Increase:',
          param1Unit: '%',
          param1Min: 0,
          param1Max: 100,
          param1Step: 5,
          param2Label: 'Chembarambakkam Dam Release:',
          param2Unit: ' m³/s',
          param2Min: 100,
          param2Max: 800,
          param2Step: 25,
        };
    }
  })();

  /* Which of the two what-if inputs read as water/flow for the active disaster,
     and so carry the blue telemetry accent on their read-out track. Presentation
     only — it selects a class, never a value fed to the simulation. */
  const hydroParams: Record<string, { param1: boolean; param2: boolean }> = {
    flood: { param1: true, param2: true },
    cyclone: { param1: false, param2: true },
    tsunami: { param1: true, param2: true },
    landslide: { param1: false, param2: true },
    earthquake: { param1: false, param2: false },
    wildfire: { param1: false, param2: false }
  };
  const hydro = hydroParams[whatIfParams.activeDisasterType] ?? { param1: false, param2: false };

  const timeMinutesMap: Record<string, number> = {
    '0m': 0,
    '30m': 30,
    '1h': 60,
    '3h': 180,
    '6h': 360,
    '12h': 720,
    '24h': 1440
  };
  const scrubbedMinutes = timeMinutesMap[currentForecast?.timeInterval || '0m'] || 0;

  const getLayoutPos = (id: string) => {
    const idx = nodes.findIndex(n => n.id === id);
    const index = idx >= 0 ? idx : 0;
    const layoutGrid = [
      { x: 14, y: 25 },
      { x: 32, y: 28 },
      { x: 52, y: 22 },
      { x: 78, y: 20 },
      { x: 82, y: 55 },
      { x: 32, y: 68 },
      { x: 58, y: 72 },
      { x: 50, y: 48 },
    ];
    if (index < layoutGrid.length) return layoutGrid[index];
    const angle = (index / Math.max(1, nodes.length)) * 2 * Math.PI;
    return { x: Math.round(50 + 35 * Math.cos(angle)), y: Math.round(50 + 35 * Math.sin(angle)) };
  };

  // Status encoding — badge shape + the explicit word always carry the state.
  // The accent only layers on: failed/critical stay black, an asset still
  // standing is "operational / available" → safe green.
  const getStatusBadge = (status: AssetStatus) => {
    switch (status) {
      case 'OPERATIONAL':
        return <span className="badge badge--safe">OPERATIONAL</span>;
      case 'AT_RISK':
        return <span className="badge badge--info">AT RISK</span>;
      case 'DISRUPTED':
        return <span className="badge badge--info">DISRUPTED</span>;
      case 'CRITICAL':
        return <span className="badge badge--advisory">CRITICAL</span>;
      case 'FAILED':
        return <span className="badge badge--critical">FAILED</span>;
      default:
        return null;
    }
  };

  // Gray-ramp stand-in for the old status hues (kept for signature parity).
  const getNodeColor = (status: AssetStatus) => {
    switch (status) {
      case 'OPERATIONAL': return '#dddddd';
      case 'AT_RISK': return '#898989';
      case 'DISRUPTED': return '#5a5a5a';
      case 'CRITICAL': return '#1a1a1a';
      case 'FAILED': return '#000000';
    }
  };

  // Display-only scale for the forecast strip bars.
  const peakFailedAssets = Math.max(1, ...forecasts.map(f => f.failedAssetsCount));

  return (
    <div className="flex flex-col h-full bg-paper text-near overflow-y-auto no-scrollbar pb-12">

      {/* 1. Header & Scrubber Control Bar */}
      <div className="bg-paper border-b border-line px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20">
        <div>
          <span className="text--eyebrow text-muted block mb-1.5">Proactive AI · Cascading impact</span>
          <h1 className="text--subtitle3 text-ink">
            Multi-disaster cascading impact prediction
          </h1>
          <p className="text--footnote text-muted mt-1">
            Modelling N-th order urban asset failures and dynamic response strategy optimisation
          </p>
        </div>

        {/* Disaster Type Selector & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={whatIfParams.activeDisasterType}
            onChange={(e) => handleCalculateSimulation({ ...whatIfParams, activeDisasterType: e.target.value as any })}
            className="bg-paper border border-line rounded-[4px] text--body text-ink px-3 py-2 outline-none focus:border-ink transition-colors cursor-pointer"
          >
            <option value="flood">Flood &amp; Urban Inundation</option>
            <option value="cyclone">Cyclone &amp; Storm Surge</option>
            <option value="earthquake">Earthquake &amp; Structural Risk</option>
            <option value="wildfire">Wildfire &amp; Heat Anomaly</option>
            <option value="landslide">Landslide &amp; Debris Flow</option>
            <option value="tsunami">Tsunami Coastal Surge</option>
          </select>

          <button
            onClick={() => setShowInfographic(true)}
            className="cta cta--secondary cta--compact gap-1.5"
          >
            <Info className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Architecture</span>
          </button>

          <button
            onClick={() => setActiveTab('whatif')}
            className={`cta ${activeTab === 'whatif' ? 'cta--primary' : 'cta--secondary'} cta--compact gap-1.5`}
          >
            <Sliders className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>What-If Lab</span>
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="cta cta--secondary cta--compact gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 2. Timeline Scrubber & Forecast Player */}
      <div className="bg-wash border-b border-line px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">

        {/* Playback Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 rounded-[4px] bg-paper border border-line text-ink flex items-center justify-center hover:border-muted transition-colors"
            title={isPlaying ? 'Pause Timeline' : 'Play Forecast Animation'}
          >
            {isPlaying ? <Pause className="w-4 h-4" strokeWidth={1.5} /> : <Play className="w-4 h-4" strokeWidth={1.5} />}
          </button>

          <button
            onClick={() => { setIsPlaying(false); setTimeIndex(0); }}
            className="w-8 h-8 rounded-[4px] bg-paper border border-line text-muted hover:text-ink flex items-center justify-center transition-colors"
            title="Reset to Live Current"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>

          <div className="flex flex-col">
            <span className="text--eyebrow text-muted">Forecast interval</span>
            <span className="text--body-medium text-ink flex items-center gap-1.5 mt-1">
              <Clock className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
              {currentForecast.label}
            </span>
          </div>
        </div>

        {/* Interval Buttons Bar */}
        <div className="flex-1 max-w-2xl">
          <div className="flex items-stretch overflow-x-auto no-scrollbar border-t border-l border-line">
            {forecasts.map((f, idx) => {
              const isSelected = idx === timeIndex;
              return (
                <button
                  key={f.timeInterval}
                  onClick={() => { setIsPlaying(false); setTimeIndex(idx); }}
                  className={`flex-1 min-w-[76px] py-2 px-2 text-center border-r border-b transition-colors duration-[250ms] ${
                    isSelected
                      ? 'bg-wash-strong border-line'
                      : 'bg-paper border-line hover:bg-wash'
                  }`}
                  style={isSelected ? { boxShadow: 'inset 0 -2px 0 0 var(--ink)' } : undefined}
                >
                  <div className={`text--footnote tabular-nums ${isSelected ? 'text-ink font-medium' : 'text-subtle'}`}>
                    {f.timeInterval}
                  </div>
                  <div className="text--footnote text-muted tabular-nums">{f.failedAssetsCount} failed</div>
                  {/* 4px track: failed assets, scaled to the peak across the horizon */}
                  <div className="h-1 bg-wash mt-1.5 rounded-[1px] overflow-hidden">
                    <div
                      className="h-full bg-ink"
                      style={{ width: `${Math.round((f.failedAssetsCount / peakFailedAssets) * 100)}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text--footnote text-muted mt-1.5">
            Bar length = failed assets, scaled to the horizon peak of <span className="tabular-nums">{peakFailedAssets}</span>
          </p>
        </div>

        {/* Current Interval Metrics Summary */}
        <div className="flex items-center gap-5 bg-paper border border-line rounded-[4px] px-4 py-2 flex-shrink-0">
          <div>
            <span className="text--eyebrow text-muted block">Flooded area</span>
            {/* Submerged area — hydrological reading */}
            <span className="text--body-medium text-info-strong tabular-nums transition-colors duration-[250ms]">{currentForecast.floodedAreaSqKm} sq km</span>
          </div>
          <div className="hidden sm:block border-l border-line pl-5">
            <span className="text--eyebrow text-muted block">At-risk pop.</span>
            <span className="text--body-medium text-ink tabular-nums">{currentForecast.atRiskPopulation.toLocaleString()}</span>
          </div>
        </div>

      </div>

      {/* 3. Main Navigation Tab Selector */}
      <div className="px-6 pt-4 border-b border-line bg-paper flex items-center gap-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('graph')}
          className={`pb-3 text--eyebrow border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'graph' ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          <GitBranch className="w-4 h-4" strokeWidth={1.5} />
          <span>Dependency graph &amp; cascades ({predictions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('strategies')}
          className={`pb-3 text--eyebrow border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'strategies' ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          <Award className="w-4 h-4" strokeWidth={1.5} />
          <span>Response strategy optimizer ({strategies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('whatif')}
          className={`pb-3 text--eyebrow border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'whatif' ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          <Sliders className="w-4 h-4" strokeWidth={1.5} />
          <span>What-if scenario lab</span>
        </button>

        <button
          onClick={() => setActiveTab('report')}
          className={`pb-3 text--eyebrow border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'report' ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          <FileText className="w-4 h-4" strokeWidth={1.5} />
          <span>Explainable AI report</span>
        </button>
      </div>

      {/* 4. Tab Contents */}
      <div className="p-6 flex-1 min-h-0">

        {/* TAB 1: DEPENDENCY GRAPH & FAILURE CASCADES */}
        {activeTab === 'graph' && (
          <InteractiveTopologyMap
            nodes={nodes}
            edges={edges}
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
            onUpdateNode={handleUpdateNode}
            onAddNode={handleAddNode}
            onAddEdge={handleAddEdge}
            onUpdateEdge={handleUpdateEdge}
            onDeleteEdge={handleDeleteEdge}
            onTriggerNodeCascade={handleTriggerNodeCascade}
            onIsolateNode={handleIsolateNode}
          />
        )}

        {/* TAB 2: RESPONSE STRATEGY OPTIMIZER */}
        {activeTab === 'strategies' && (
          <DynamicStrategyOptimizer
            strategies={strategies}
            approvedStrategyId={approvedStrategyId}
            nodes={nodes}
            onApproveStrategy={handleApproveStrategy}
            onAddCustomStrategy={handleAddCustomStrategy}
          />
        )}

        {/* TAB 3: WHAT-IF SCENARIO LAB */}
        {activeTab === 'whatif' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* Left Controls Column */}
            <div className="lg:col-span-5 panel p-5 space-y-5">

              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-ink" strokeWidth={1.5} />
                  <span className="text--subtitle3 text-ink">What-if disaster parameters</span>
                </div>
                <button
                  onClick={handleResetWhatIf}
                  className="cta cta--tertiary gap-1.5"
                >
                  <RotateCcw className="w-3 h-3" strokeWidth={1.5} />
                  <span>Reset</span>
                </button>
              </div>

              {/* Slider 1: Intensity Parameter */}
              <div className="space-y-2">
                <div className="flex justify-between text--footnote">
                  <span className="text-subtle">{paramMeta.param1Label}</span>
                  <span className={`font-medium tabular-nums transition-colors duration-[250ms] ${
                    hydro.param1 ? 'text-info-strong' : 'text-ink'
                  }`}>
                    +{whatIfParams.rainfallIncreasePct}{paramMeta.param1Unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={paramMeta.param1Min}
                  max={paramMeta.param1Max}
                  step={paramMeta.param1Step}
                  value={whatIfParams.rainfallIncreasePct}
                  onChange={(e) => handleCalculateSimulation({ ...whatIfParams, rainfallIncreasePct: Number(e.target.value) })}
                  className="w-full accent-ink bg-wash-strong h-1 cursor-pointer"
                />
                <div className="h-1 bg-wash rounded-[1px] overflow-hidden">
                  <div
                    className={`h-full transition-colors duration-[250ms] ${hydro.param1 ? 'bg-info' : 'bg-ink'}`}
                    style={{
                      width: `${Math.round(((whatIfParams.rainfallIncreasePct - paramMeta.param1Min) / Math.max(1, paramMeta.param1Max - paramMeta.param1Min)) * 100)}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text--footnote text-muted tabular-nums">
                  <span>{paramMeta.param1Min}{paramMeta.param1Unit}</span>
                  <span>{paramMeta.param1Max}{paramMeta.param1Unit}</span>
                </div>
              </div>

              {/* Slider 2: Disaster Specific Flow / Rate */}
              <div className="space-y-2">
                <div className="flex justify-between text--footnote">
                  <span className="text-subtle">{paramMeta.param2Label}</span>
                  <span className={`font-medium tabular-nums transition-colors duration-[250ms] ${
                    hydro.param2 ? 'text-info-strong' : 'text-ink'
                  }`}>
                    {whatIfParams.damDischargeRateM3s}{paramMeta.param2Unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={paramMeta.param2Min}
                  max={paramMeta.param2Max}
                  step={paramMeta.param2Step}
                  value={whatIfParams.damDischargeRateM3s}
                  onChange={(e) => handleCalculateSimulation({ ...whatIfParams, damDischargeRateM3s: Number(e.target.value) })}
                  className="w-full accent-ink bg-wash-strong h-1 cursor-pointer"
                />
                <div className="h-1 bg-wash rounded-[1px] overflow-hidden">
                  <div
                    className={`h-full transition-colors duration-[250ms] ${hydro.param2 ? 'bg-info' : 'bg-ink'}`}
                    style={{
                      width: `${Math.round(((whatIfParams.damDischargeRateM3s - paramMeta.param2Min) / Math.max(1, paramMeta.param2Max - paramMeta.param2Min)) * 100)}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text--footnote text-muted tabular-nums">
                  <span>{paramMeta.param2Min}{paramMeta.param2Unit}</span>
                  <span>{paramMeta.param2Max}{paramMeta.param2Unit}</span>
                </div>
              </div>

              {/* Input track legend — every track is named, and the ones that
                  carry water/flow readings show the blue telemetry accent */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text--footnote text-muted">
                <span className="flex items-center gap-2">
                  <span className="inline-block w-6 h-1 bg-info rounded-[1px]" />
                  Hydrological input — rainfall, discharge, surge
                </span>
                <span className="flex items-center gap-2">
                  <span className="inline-block w-6 h-1 bg-ink rounded-[1px]" />
                  Non-hydrological input
                </span>
                <span className="flex items-center gap-2">
                  <span className="inline-block w-6 h-1 bg-wash rounded-[1px]" />
                  Track — full parameter range
                </span>
              </div>

              {/* Critical Asset Disruption Toggles */}
              <div className="space-y-2 pt-4 border-t border-line">
                <span className="text--eyebrow text-muted block">
                  Simulate critical asset failures / closures
                </span>

                <div className="max-h-48 overflow-y-auto no-scrollbar border-t border-line">
                  {nodes.map((node) => {
                    const isPower = node.category === 'Power Stations';
                    const isHospital = node.category === 'Hospitals';
                    const isChecked = isPower
                      ? whatIfParams.disabledPowerStations.includes(node.id)
                      : isHospital
                      ? whatIfParams.disabledHospitals.includes(node.id)
                      : whatIfParams.closedBridges.includes(node.id);

                    const toggleNode = () => {
                      if (isPower) handleTogglePower(node.id);
                      else if (isHospital) handleToggleHospital(node.id);
                      else handleToggleBridge(node.id);
                    };

                    return (
                      <label
                        key={node.id}
                        className={`flex items-center justify-between gap-2 py-2.5 px-2 border-b border-line cursor-pointer transition-colors duration-[250ms] ${
                          isChecked ? 'bg-wash sev-row--critical' : 'hover:bg-wash'
                        }`}
                      >
                        <span className="truncate pr-2">
                          <span className="text--body-medium text-ink">{node.name}</span>{' '}
                          <span className="text--footnote text-muted">({node.category})</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={toggleNode}
                          className="accent-ink flex-shrink-0"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Custom Operator Prompt / AI Query */}
              <div className="space-y-2 pt-4 border-t border-line">
                <span className="text--eyebrow text-muted block">
                  Custom operator scenario query
                </span>
                <textarea
                  rows={2}
                  value={whatIfParams.customNotes || ''}
                  onChange={(e) => setWhatIfParams({ ...whatIfParams, customNotes: e.target.value })}
                  placeholder="e.g., What happens if Velachery hospital generator fails at 2 AM under peak flood?"
                  className="w-full bg-paper border border-line rounded-[4px] text--body text-ink p-2.5 outline-none focus:border-ink placeholder:text-muted resize-none transition-colors"
                />
              </div>

              <div className="pt-4 border-t border-line">
                <button
                  onClick={() => handleCalculateSimulation(whatIfParams)}
                  disabled={isSimulating}
                  className="cta cta--primary cta--compact w-full gap-2 disabled:opacity-50"
                >
                  <span>{isSimulating ? 'Analysing N-th order cascades...' : 'Run AI cascading simulation'}</span>
                  <span className="cta__arrow">→</span>
                </button>
              </div>

            </div>

            {/* Right Comparison & Recalculated Output Column */}
            <div className="lg:col-span-7 panel p-5 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-ink" strokeWidth={1.5} />
                  <span className="text--subtitle3 text-ink">Simulated impact delta vs. baseline</span>
                </div>
                <span className="text--footnote text-muted">
                  Confidence <span className="text-ink font-medium tabular-nums">{explainReport.confidenceRatingPct}%</span>
                </span>
              </div>

              {/* Delta Comparison Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 border-t border-l border-line">
                <div className="p-3 border-r border-b border-line">
                  <span className="text--eyebrow text-muted block mb-1.5">Flooded area</span>
                  <span className="text--subtitle3 text-info-strong tabular-nums block transition-colors duration-[250ms]">{currentForecast.floodedAreaSqKm} sq km</span>
                  <span className="text--footnote text-subtle mt-1 block tabular-nums">
                    +{Math.round((whatIfParams.rainfallIncreasePct / 20) * 10) / 10} sq km vs baseline
                  </span>
                </div>

                <div className="p-3 border-r border-b border-line">
                  <span className="text--eyebrow text-muted block mb-1.5">Failed assets</span>
                  <span className="text--subtitle3 text-ink tabular-nums block">{currentForecast.failedAssetsCount} nodes</span>
                  <span className="text--footnote text-subtle mt-1 block tabular-nums">
                    {whatIfParams.disabledPowerStations.length + whatIfParams.closedBridges.length} manually disabled
                  </span>
                </div>

                <div className="p-3 border-r border-b border-line col-span-2 sm:col-span-1">
                  <span className="text--eyebrow text-muted block mb-1.5">At-risk citizens</span>
                  <span className="text--subtitle3 text-ink tabular-nums block">{currentForecast.atRiskPopulation.toLocaleString()}</span>
                  <span className="text--footnote text-subtle mt-1 block">Escalated risk level</span>
                </div>
              </div>

              {/* Simulation Explanation Summary */}
              <div className="panel--wash p-4 space-y-2">
                <span className="text--eyebrow text-muted block">
                  AI cascading impact summary
                </span>
                <p className="text--body text-subtle leading-relaxed">
                  {explainReport.summary}
                </p>
              </div>

              {/* Top Ranked Strategy Under Scenario */}
              {strategies.length > 0 && (
                <div className="panel sev-row--critical p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text--eyebrow text-muted flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" strokeWidth={1.5} />
                      Recommended strategy under scenario
                    </span>
                    <span className="text--body-medium text-ink">{strategies[0].name}</span>
                  </div>
                  <p className="text--body text-subtle">
                    {strategies[0].description}
                  </p>
                </div>
              )}

            </div>

          </div>
        )}

        {/* TAB 4: EXPLAINABLE AI REPORT */}
        {activeTab === 'report' && (
          <div className="panel p-8 space-y-8 max-w-4xl mx-auto">

            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
              <div>
                <span className="text--eyebrow text-muted block mb-1.5">Decision audit</span>
                <h2 className="text--subtitle2 text-ink flex items-center gap-2">
                  <FileText className="w-5 h-5" strokeWidth={1.5} />
                  Explainable AI decision &amp; preventative report
                </h2>
                <p className="text--footnote text-muted mt-1.5">
                  Generated at {explainReport.timestamp} · Evidence-backed causal explanations
                </p>
              </div>
              <span className="badge badge--advisory">
                Confidence {explainReport.confidenceRatingPct}%
              </span>
            </div>

            {/* Root Causes */}
            <div className="space-y-2">
              <h3 className="text--eyebrow text-muted">
                1 — Primary disaster root causes
              </h3>
              <ul className="border-t border-line">
                {explainReport.rootCauses?.map((cause, i) => (
                  <li key={i} className="flex items-start gap-2.5 py-3 border-b border-line">
                    <span className="sev-mark sev-mark--info mt-1" />
                    <span className="text--body text-subtle">{cause}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Chain Reaction Timeline */}
            <div className="space-y-2">
              <h3 className="text--eyebrow text-muted">
                2 — N-th order causal chain reaction
              </h3>
              <div className="panel--wash p-4 text--body text-subtle leading-relaxed">
                {explainReport.chainReactionDescription}
              </div>
            </div>

            {/* Strategy Recommendation Justification */}
            <div className="space-y-2">
              <h3 className="text--eyebrow text-muted">
                3 — Strategy recommendation rationale
              </h3>
              <p className="text--body text-subtle leading-relaxed panel--wash p-4">
                {explainReport.strategyRecommendationJustification}
              </p>
            </div>

            {/* Tradeoff Analysis */}
            <div className="space-y-2">
              <h3 className="text--eyebrow text-muted">
                4 — Key resource &amp; mortality trade-off analysis
              </h3>
              <p className="text--body text-subtle leading-relaxed panel--wash p-4">
                {explainReport.keyTradeoffAnalysis}
              </p>
            </div>

            {/* Preventative Action Items */}
            <div className="space-y-2">
              <h3 className="text--eyebrow text-muted">
                5 — Immediate action recommendations
              </h3>
              <ul className="border-t border-line">
                {explainReport.preventativeActionItems?.map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 py-3 border-b border-line">
                    <CheckCircle2 className="w-4 h-4 text-ink flex-shrink-0" strokeWidth={1.5} />
                    <span className="text--body text-subtle">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        )}

      </div>

      {/* System Architecture Modal */}
      {showInfographic && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="panel max-w-5xl w-full p-6 space-y-6 relative">
            <button
              onClick={() => setShowInfographic(false)}
              className="absolute top-4 right-4 text-muted hover:text-ink"
              aria-label="Close"
            >
              <XCircle className="w-5 h-5" strokeWidth={1.5} />
            </button>

            <div className="border-b border-line pb-4">
              <span className="text--eyebrow text-muted block mb-1.5">System architecture</span>
              <h2 className="text--subtitle2 text-ink">
                AI-powered multi-disaster cascading impact prediction
              </h2>
              <p className="text--footnote text-muted mt-1.5">
                GNN topology · Hydrodynamic cascade modelling · Dynamic response optimisation engine
              </p>
            </div>

            {/* Three-stage pipeline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* STAGE 1: Primary Trigger */}
              <div className="panel p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="badge badge--quiet">Stage 1 · Primary trigger</span>
                  <span className="text--footnote text-muted">Seismic / meteorological</span>
                </div>

                <div className="panel--wash p-3 flex items-center gap-3">
                  <Activity className="w-5 h-5 text-ink flex-shrink-0" strokeWidth={1.5} />
                  <div>
                    <div className="text--body-medium text-ink">Earthquake mag 7.2 / surge</div>
                    <div className="text--footnote text-muted tabular-nums">Ground acceleration 320 m/s²</div>
                  </div>
                </div>

                <p className="text--body text-subtle leading-relaxed">
                  Initiating physical shockwave across critical river basins, causing high-pressure dam discharge and ground tremors.
                </p>

                <div className="flex items-center justify-between text--footnote text-muted pt-3 border-t border-line">
                  <span>Trigger confidence <span className="text-ink tabular-nums">98.4%</span></span>
                  <span>Zone Alpha</span>
                </div>
              </div>

              {/* STAGE 2: Prediction Engine */}
              <div className="panel p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="badge badge--quiet">Stage 2 · Prediction engine</span>
                  <span className="text--footnote text-muted">GNN cascade graph</span>
                </div>

                <div className="panel--wash p-3">
                  {[
                    { label: 'Dam breach (P 0.89)', at: 'T+15m', severity: 'critical' },
                    { label: 'Flash flood inundation', at: 'T+30m', severity: 'advisory' },
                    { label: '110kV grid failure', at: 'T+45m', severity: 'critical' },
                    { label: 'ICU power & telecom trip', at: 'T+60m', severity: 'advisory' }
                  ].map((step) => (
                    <div
                      key={step.label}
                      className={`flex items-center justify-between gap-2 py-1.5 pl-2.5 ${
                        step.severity === 'critical' ? 'sev-row--critical' : 'sev-row--advisory'
                      }`}
                    >
                      <span className={`text--footnote ${step.severity === 'critical' ? 'sev-text--critical' : 'sev-text--advisory'}`}>
                        {step.label}
                      </span>
                      <span className="text--footnote text-muted tabular-nums">{step.at}</span>
                    </div>
                  ))}
                </div>

                <p className="text--body text-subtle leading-relaxed">
                  N-th order graph neural network maps interdependent infrastructure node failures before the physical breach occurs.
                </p>

                <div className="flex items-center justify-between text--footnote text-muted pt-3 border-t border-line">
                  <span>Cascade depth <span className="text-ink">Level 4</span></span>
                  <span className="tabular-nums">9 infrastructure assets</span>
                </div>
              </div>

              {/* STAGE 3: Response Optimizer */}
              <div className="panel p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="badge badge--quiet">Stage 3 · Response optimizer</span>
                  <span className="text--footnote text-muted">Dynamic dispatch</span>
                </div>

                <div className="panel--wash p-3">
                  {[
                    { label: 'Aerial supply drones', value: '12 active' },
                    { label: 'Evacuation route vector', value: 'Bypassing flyover' },
                    { label: 'Mobile genset deploy', value: 'Apollo ICU' }
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-2 py-1.5">
                      <span className="text--footnote text-subtle">{row.label}</span>
                      <span className="text--footnote text-ink font-medium">{row.value}</span>
                    </div>
                  ))}
                </div>

                <p className="text--body text-subtle leading-relaxed">
                  Autonomous dispatch optimizer reroutes emergency fleets over unflooded arterial roads and pre-positions power generators.
                </p>

                <div className="flex items-center justify-between text--footnote text-muted pt-3 border-t border-line">
                  <span>Lives protected <span className="text-safe-strong tabular-nums">14,200 est.</span></span>
                  <span className="tabular-nums">Optimised 94%</span>
                </div>
              </div>

            </div>

            {/* GIS layer summary */}
            <div className="panel--wash p-4 space-y-3">
              <span className="text--eyebrow text-muted block">
                GIS layer simulation &amp; infrastructure topology
              </span>
              <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-line">
                {[
                  { label: 'Inundation layer', value: 'Chembarambakkam Basin' },
                  { label: 'Grid dependency', value: 'Velachery 110kV' },
                  { label: 'Corridor bypass', value: 'GST arterial route' },
                  { label: 'Priority safe zone', value: 'Anna University shelter' }
                ].map((cell) => (
                  <div key={cell.label} className="p-3 bg-paper border-r border-b border-line">
                    <span className="text--eyebrow text-muted block mb-1">{cell.label}</span>
                    <span className="text--body-medium text-ink">{cell.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowInfographic(false)}
                className="cta cta--primary cta--compact"
              >
                Close Architecture Guide
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Export Report Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="panel p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text--subtitle3 text-ink flex items-center gap-2">
                <Download className="w-4 h-4" strokeWidth={1.5} />
                Export decision report
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-muted hover:text-ink"
                aria-label="Close"
              >
                <XCircle className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <p className="text--body text-subtle leading-relaxed">
              Download the complete cascading impact graph, infrastructure failure predictions and ranked strategy analysis as an official PDF or JSON telemetry package for emergency command records.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ explainReport, predictions, strategies, nodes }, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", `cascading_impact_report_${Date.now()}.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                  setShowExportModal(false);
                }}
                className="cta cta--primary cta--compact w-full gap-2"
              >
                <Download className="w-4 h-4" strokeWidth={1.5} />
                <span>Download JSON Telemetry</span>
              </button>

              <button
                onClick={() => { window.print(); setShowExportModal(false); }}
                className="cta cta--secondary cta--compact w-full gap-2"
              >
                <FileText className="w-4 h-4" strokeWidth={1.5} />
                <span>Print Executive Briefing</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
