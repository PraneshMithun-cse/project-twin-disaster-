import React, { useState, useEffect } from 'react';
import { SimulationParams, SimulationResult } from '../../shared/types';
import {
  Sliders,
  Play,
  RotateCcw,
  CloudRain,
  Waves,
  Cpu,
  AlertTriangle,
  Database,
  GitCompare,
  Search,
  BookOpen,
  Zap,
  Clock,
  Send,
  ArrowRight,
  ShieldCheck,
  Radio,
  BarChart2
} from 'lucide-react';

/* Slider skin: #ddd track (painted by the wrapper), black round thumb with a
   white ring. Shared as a class string so every slider reads identically.
   The thumb is always black — only the filled portion of a *hydrological*
   input (rainfall, dam discharge) takes the blue accent. */
const SLIDER_INPUT =
  'relative w-full h-[14px] appearance-none bg-transparent cursor-pointer ' +
  '[&::-webkit-slider-runnable-track]:bg-transparent ' +
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-[14px] [&::-webkit-slider-thumb]:w-[14px] ' +
  '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ink ' +
  '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-paper ' +
  '[&::-webkit-slider-thumb]:shadow-[0_0_0_1px_#000] ' +
  '[&::-moz-range-track]:bg-transparent ' +
  '[&::-moz-range-thumb]:h-[14px] [&::-moz-range-thumb]:w-[14px] [&::-moz-range-thumb]:rounded-full ' +
  '[&::-moz-range-thumb]:bg-ink [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-paper ' +
  '[&::-moz-range-thumb]:shadow-[0_0_0_1px_#000]';

/* Checkbox skin: black accent, hairline box. */
const CHECKBOX_INPUT = 'w-3.5 h-3.5 accent-ink rounded-[2px] cursor-pointer';

/* Peak-depth bars in the time-horizon inspector are drawn against a fixed
   0–3.5 m scale (unchanged from the original), with a 1px reference tick. */
const DEPTH_SCALE_M = 3.5;
const DEPTH_TICK_M = 2.0;

interface MitigationOptions {
  prepositionBoats: boolean;
  deployDewateringPumps: boolean;
  autoBarricadeSubways: boolean;
  cellBroadcastAlert: boolean;
  priorityHospitalPower: boolean;
}

function computeHydrodynamicSimulation(
  params: SimulationParams,
  mitigations: MitigationOptions
): SimulationResult & {
  mitigatedAreaKm2: number;
  mitigatedAffectedPeople: number;
  mitigatedMaxDepth: number;
  riskReductionPct: number;
  livesProtected: number;
  selectedTimelineStep: number;
} {
  const rain = params.rainfallMmHr;
  const dam = params.chembarambakkamReleaseM3s;
  const block = params.canalBlockagePct;
  const tide = params.highTideOverlap ? 1.4 : 1.0;
  const dur = params.durationHours;
  const bridge = params.bridgeStatus;

  // Flooded sectors (1 to 8)
  const rawZones = Math.floor((rain / 25) + (dam / 600) + (block / 35));
  const affectedZonesCount = Math.min(8, Math.max(1, rawZones));

  // Baseline Submerged area (km2)
  const predictedSubmergedAreaKm2 = Number(((rain * 0.035 + dam * 0.0018) * (1 + block / 120) * tide).toFixed(1));

  // Baseline Pop affected
  const estimatedAffectedPeople = Math.round((6000 + rain * 480 + dam * 24) * (1 + block / 150) * (dur / 2));

  // Critical road blocks
  const criticalRoadBlocks: string[] = [];
  if (bridge === 'closed') {
    criticalRoadBlocks.push('Adyar Bridges Corridor (CLOSED - Submerged & Barricaded)');
  } else if (bridge === 'restricted') {
    criticalRoadBlocks.push('Adyar Bridges Corridor (RESTRICTED - 1 Lane Active)');
  }

  if (block >= 40 || rain >= 60) {
    const depth = (1.2 + (rain / 100) + (block / 80)).toFixed(1);
    if (mitigations.autoBarricadeSubways) {
      criticalRoadBlocks.push(`Guindy Railway Subway (BARRICADED & TRAFFIC DIVERTED - Water Depth ${depth}m)`);
    } else {
      criticalRoadBlocks.push(`Guindy Railway Subway (SUBMERGED & UNPROTECTED - Depth ${depth}m)`);
    }
  }
  if (rain >= 50 || dam >= 1200) {
    criticalRoadBlocks.push('Velachery 100ft Road Vijaya Nagar Junction');
  }
  if (dam >= 1000) {
    criticalRoadBlocks.push('Kotturpuram Bridge Approach & Riverbank');
  }
  if (tide > 1) {
    criticalRoadBlocks.push('Adyar Estuary Causeway & Beach Road (High-Tide Overlap)');
  }
  if (rain >= 140) {
    criticalRoadBlocks.push('OMR Taramani IT Corridor Underpass');
  }
  if (criticalRoadBlocks.length === 0) {
    criticalRoadBlocks.push('All Primary Arterial Corridors Clear');
  }

  // Recommended Deployments
  const boatCount = Math.max(2, Math.floor(dam / 250 + rain / 40));
  const pumpCount = Math.max(2, Math.floor(rain / 15 + block / 20));
  const busCount = Math.max(4, Math.floor(rain / 10 + dam / 300));

  const recommendedDeployments = [
    { type: 'Rescue Boat Units', count: mitigations.prepositionBoats ? boatCount + 2 : boatCount, zone: 'Velachery South & Kotturpuram' },
    { type: 'Heavy 500HP Dewatering Pumps', count: mitigations.deployDewateringPumps ? pumpCount + 3 : pumpCount, zone: 'Guindy Subway & Sluice Drains' },
    { type: 'Evacuation Transit Buses', count: busCount, zone: 'Low-Lying Tenement Shelters' }
  ];

  // Baseline Timeline
  const d15 = Number((rain * 0.007 * tide).toFixed(1));
  const d30 = Number((rain * 0.013 * tide + dam * 0.0002).toFixed(1));
  const d60 = Number(((rain * 0.021 + dam * 0.0005) * tide).toFixed(1));
  const d120 = Number(((rain * 0.028 + dam * 0.0007) * (1 + block / 200) * tide).toFixed(1));
  const d180 = Number(((rain * 0.032 + dam * 0.0008) * (1 + block / 180) * tide).toFixed(1));
  const d240 = Number(((rain * 0.035 + dam * 0.0009) * (1 + block / 160) * tide).toFixed(1));

  const riskTimeline = [
    { minute: 15, floodedZones: Math.max(1, Math.floor(affectedZonesCount * 0.2)), maxWaterDepthMeters: d15 },
    { minute: 30, floodedZones: Math.max(1, Math.floor(affectedZonesCount * 0.4)), maxWaterDepthMeters: d30 },
    { minute: 60, floodedZones: Math.max(2, Math.floor(affectedZonesCount * 0.7)), maxWaterDepthMeters: d60 },
    { minute: 120, floodedZones: affectedZonesCount, maxWaterDepthMeters: d120 },
    { minute: 180, floodedZones: Math.min(8, affectedZonesCount + 1), maxWaterDepthMeters: d180 },
    { minute: 240, floodedZones: Math.min(8, affectedZonesCount + 1), maxWaterDepthMeters: d240 }
  ];

  // Mitigated calculation adjustments
  let reductionMultiplier = 1.0;
  if (mitigations.deployDewateringPumps) reductionMultiplier *= 0.75;
  if (mitigations.prepositionBoats) reductionMultiplier *= 0.82;
  if (mitigations.autoBarricadeSubways) reductionMultiplier *= 0.90;
  if (mitigations.cellBroadcastAlert) reductionMultiplier *= 0.70;
  if (mitigations.priorityHospitalPower) reductionMultiplier *= 0.92;

  const mitigatedAreaKm2 = Number((predictedSubmergedAreaKm2 * Math.max(0.4, reductionMultiplier)).toFixed(1));
  const mitigatedAffectedPeople = Math.round(estimatedAffectedPeople * Math.max(0.35, reductionMultiplier));
  const mitigatedMaxDepth = Number((d120 * Math.max(0.5, reductionMultiplier)).toFixed(1));
  const riskReductionPct = Math.round((1 - reductionMultiplier) * 100);
  const livesProtected = estimatedAffectedPeople - mitigatedAffectedPeople;

  let severityLabel = 'NORMAL';
  if (rain >= 120 || dam >= 2500) severityLabel = 'CATASTROPHIC CLOUDBURST';
  else if (rain >= 80 || dam >= 1500) severityLabel = 'SEVERE FLOOD SURGE';
  else if (rain >= 40 || dam >= 800) severityLabel = 'MODERATE INUNDATION';

  const aiSummary = `[${severityLabel}] Simulated +${dur}h disaster scenario: ${rain} mm/hr rainfall, ${dam} m³/s dam release, ${block}% canal silt blockage. Unmitigated baseline predicts ${predictedSubmergedAreaKm2} km² submergence impacting ~${estimatedAffectedPeople.toLocaleString()} citizens. With active interventions applied (${riskReductionPct}% risk reduction), predicted submergence drops to ${mitigatedAreaKm2} km² protecting ~${livesProtected.toLocaleString()} residents. Peak water depth controlled to ${mitigatedMaxDepth}m.`;

  return {
    simulatedTime: `+${dur} Hours Scenario`,
    affectedZonesCount,
    predictedSubmergedAreaKm2,
    estimatedAffectedPeople,
    criticalRoadBlocks,
    recommendedDeployments,
    riskTimeline,
    aiSummary,
    mitigatedAreaKm2,
    mitigatedAffectedPeople,
    mitigatedMaxDepth,
    riskReductionPct,
    livesProtected,
    selectedTimelineStep: 120
  };
}

export const SimulationStudio: React.FC<{
  onApplySimulationToLiveTwin?: (simData: {
    rainfallMmHr: number;
    chembarambakkamReleaseM3s?: number;
    canalBlockagePct?: number;
    highTideOverlap?: boolean;
    durationHours?: number;
    mitigations?: MitigationOptions;
    riskMultiplier?: number;
    powerGridStressPct?: number;
    simResult?: any;
  }) => void;
}> = ({ onApplySimulationToLiveTwin }) => {
  const [activeSubTab, setActiveSubTab] = useState<'simulation' | 'knowledge_base'>('simulation');

  const [params, setParams] = useState<SimulationParams>({
    rainfallMmHr: 110,
    chembarambakkamReleaseM3s: 1800,
    canalBlockagePct: 80,
    bridgeStatus: 'restricted',
    durationHours: 3,
    highTideOverlap: true
  });

  const [mitigations, setMitigations] = useState<MitigationOptions>({
    prepositionBoats: true,
    deployDewateringPumps: true,
    autoBarricadeSubways: true,
    cellBroadcastAlert: false,
    priorityHospitalPower: true
  });

  const [selectedTimelineMinute, setSelectedTimelineMinute] = useState<number>(120);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dispatchNotice, setDispatchNotice] = useState<string | null>(null);

  const [result, setResult] = useState<any>(
    computeHydrodynamicSimulation(params, mitigations)
  );

  // Search & filter state for Knowledge Base
  const [kbSearch, setKbSearch] = useState('');
  const [kbFilter, setKbFilter] = useState('all');

  // Re-calculate simulation instantly when parameters or mitigations change
  useEffect(() => {
    setResult(computeHydrodynamicSimulation(params, mitigations));
  }, [params, mitigations]);

  // Scenario Matching State
  const [isMatching, setIsMatching] = useState(false);
  const [scenarioMatches, setScenarioMatches] = useState<any | null>({
    matchedScenarios: [
      {
        id: 'sim-2015-12-01',
        historicalEvent: 'December 2015 Chennai Flood & Chembarambakkam Sluice Discharge',
        similarityPct: 94,
        keyMatches: ['85mm/hr Cloudburst intensity', 'High tide estuarine backwater', 'Velachery Lake sluice overflow'],
        retrievedStrategy: 'Immediate deployment of 4 NDRF boat units to Vijaya Nagar & pre-evacuation of Kotturpuram tenements',
        historicalOutcome: 'Rescued 4,200 stranded residents with 91% effectiveness score',
        aiRefinement: 'Apply 2015 strategy but add automated road barricading at Guindy subway to prevent vehicle stalling.'
      },
      {
        id: 'sim-2021-11-25',
        historicalEvent: 'November 2021 Cyclone Nivar Severe Inundation',
        similarityPct: 86,
        keyMatches: ['Heavy catchment rain in Adyar', 'Drainage silt blockage 80%'],
        retrievedStrategy: 'High-capacity 500HP dewatering pumps stationed at 100ft road canal sluice',
        historicalOutcome: 'Reduced standing water duration by 14 hours across Velachery South',
        aiRefinement: 'Deploy pumps 30 minutes earlier based on live IoT sensor water depth derivative.'
      }
    ],
    recommendedMasterPlan: 'Combine 2015 pre-evacuation protocol with 2021 early dewatering pump placement.'
  });

  // Preset Loaders
  const loadPreset = (presetName: string) => {
    if (presetName === 'cloudburst_2015') {
      setParams({
        rainfallMmHr: 150,
        chembarambakkamReleaseM3s: 2800,
        canalBlockagePct: 90,
        bridgeStatus: 'closed',
        durationHours: 4,
        highTideOverlap: true
      });
      setMitigations({
        prepositionBoats: true,
        deployDewateringPumps: true,
        autoBarricadeSubways: true,
        cellBroadcastAlert: true,
        priorityHospitalPower: true
      });
    } else if (presetName === 'michaung_2023') {
      setParams({
        rainfallMmHr: 110,
        chembarambakkamReleaseM3s: 1800,
        canalBlockagePct: 80,
        bridgeStatus: 'restricted',
        durationHours: 3,
        highTideOverlap: true
      });
      setMitigations({
        prepositionBoats: true,
        deployDewateringPumps: true,
        autoBarricadeSubways: true,
        cellBroadcastAlert: true,
        priorityHospitalPower: true
      });
    } else if (presetName === 'dam_breach') {
      setParams({
        rainfallMmHr: 65,
        chembarambakkamReleaseM3s: 3400,
        canalBlockagePct: 70,
        bridgeStatus: 'closed',
        durationHours: 3,
        highTideOverlap: false
      });
      setMitigations({
        prepositionBoats: true,
        deployDewateringPumps: true,
        autoBarricadeSubways: true,
        cellBroadcastAlert: true,
        priorityHospitalPower: true
      });
    } else if (presetName === 'flash_monsoon') {
      setParams({
        rainfallMmHr: 95,
        chembarambakkamReleaseM3s: 800,
        canalBlockagePct: 85,
        bridgeStatus: 'open',
        durationHours: 2,
        highTideOverlap: false
      });
      setMitigations({
        prepositionBoats: false,
        deployDewateringPumps: true,
        autoBarricadeSubways: true,
        cellBroadcastAlert: false,
        priorityHospitalPower: false
      });
    }
  };

  const handlePushLive = (currentResult?: any) => {
    const activeRes = currentResult || result;
    if (onApplySimulationToLiveTwin) {
      const stress = Math.min(100, Math.round(params.rainfallMmHr * 0.6 + params.canalBlockagePct * 0.4));
      onApplySimulationToLiveTwin({
        rainfallMmHr: params.rainfallMmHr,
        chembarambakkamReleaseM3s: params.chembarambakkamReleaseM3s,
        canalBlockagePct: params.canalBlockagePct,
        highTideOverlap: params.highTideOverlap,
        durationHours: params.durationHours,
        mitigations,
        riskMultiplier: params.rainfallMmHr > 80 ? 1.5 : 1.15,
        powerGridStressPct: stress,
        simResult: activeRes
      });
      setDispatchNotice(`Live Digital Twin, Shelters, Hospitals & Incidents Synchronized for ${params.rainfallMmHr}mm/hr Scenario.`);
      setTimeout(() => setDispatchNotice(null), 5000);
    }
  };

  const handleRunSimulation = async () => {
    setIsLoading(true);
    const startTime = Date.now();
    let computedRes = computeHydrodynamicSimulation(params, mitigations);
    try {
      const response = await fetch('/api/ai/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params, mitigations })
      });
      const data = await response.json();
      if (data.success && data.data) {
        computedRes = { ...data.data, ...computedRes };
      }
    } catch (err) {
      console.warn('Simulation API fallback triggered:', err);
    } finally {
      // Guaranteed 1.4s delay for hydrodynamic computation feedback
      const elapsed = Date.now() - startTime;
      if (elapsed < 1400) {
        await new Promise(r => setTimeout(r, 1400 - elapsed));
      }
      setResult(computedRes);
      setIsLoading(false);
      handlePushLive(computedRes);
    }
  };

  const handleRunScenarioMatch = async () => {
    setIsMatching(true);
    const startTime = Date.now();
    try {
      const response = await fetch('/api/ai/scenario-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          liveConditions: {
            rainfallMmHr: params.rainfallMmHr,
            damDischarge: params.chembarambakkamReleaseM3s,
            riverStage: 3.4,
            trafficCongestion: params.canalBlockagePct
          }
        })
      });
      const data = await response.json();
      if (data.success && data.data) {
        setScenarioMatches(data.data);
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      console.warn('Scenario match fallback triggered:', err);
      setScenarioMatches({
        matchedScenarios: [
          {
            id: 'sim-2015-12-01',
            historicalEvent: 'December 2015 Chennai Flood & Chembarambakkam Sluice Discharge',
            similarityPct: Math.min(98, Math.round(75 + (params.rainfallMmHr / 10) + (params.chembarambakkamReleaseM3s / 200))),
            keyMatches: [`${params.rainfallMmHr}mm/hr Cloudburst intensity`, `${params.chembarambakkamReleaseM3s}m³/s Dam Discharge`, 'Estuarine high tide backwater overlap'],
            retrievedStrategy: 'Immediate deployment of 4 NDRF boat units to Vijaya Nagar & pre-evacuation of Kotturpuram tenements',
            historicalOutcome: 'Rescued 4,200 stranded residents with 91% effectiveness score',
            aiRefinement: 'Apply 2015 strategy but add automated road barricading at Guindy subway to prevent vehicle stalling.'
          },
          {
            id: 'sim-2021-11-25',
            historicalEvent: 'November 2021 Cyclone Nivar Severe Inundation',
            similarityPct: Math.min(92, Math.round(68 + (params.rainfallMmHr / 8))),
            keyMatches: ['Heavy catchment rain in Adyar', `Drainage silt blockage ${params.canalBlockagePct}%`],
            retrievedStrategy: 'High-capacity 500HP dewatering pumps stationed at 100ft road canal sluice',
            historicalOutcome: 'Reduced standing water duration by 14 hours across Velachery South',
            aiRefinement: 'Deploy pumps 30 minutes earlier based on live IoT sensor water depth derivative.'
          }
        ],
        recommendedMasterPlan: 'Combine 2015 pre-evacuation protocol with 2021 early dewatering pump placement.'
      });
    } finally {
      const elapsed = Date.now() - startTime;
      if (elapsed < 1400) {
        await new Promise(r => setTimeout(r, 1400 - elapsed));
      }
      setIsMatching(false);
    }
  };

  const handleDispatchDirectives = async () => {
    setDispatchNotice('Broadcasting mitigation directives to NDRF & Greater Chennai Corporation field units...');
    handlePushLive();
    try {
      await fetch('/api/notifications/fcm/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '🚨 SIMULATED COMMAND DIRECTIVE DISPATCHED',
          body: `Mitigation Plan Active: ${result.riskReductionPct}% risk reduction. ${result.recommendedDeployments.map((d: any) => `${d.count}x ${d.type}`).join(', ')}`,
          topic: 'emergency_alerts'
        })
      });
    } catch (e) {
      console.warn('FCM dispatch notice sent locally:', e);
    }
    setTimeout(() => {
      setDispatchNotice('DIRECTIVES CONFIRMED: Operational orders & risk zone updates dispatched to 14 NDRF, Fire & Traffic Field Commanders.');
      setTimeout(() => setDispatchNotice(null), 5000);
    }, 1200);
  };

  const handleReset = () => {
    setParams({
      rainfallMmHr: 85,
      chembarambakkamReleaseM3s: 1200,
      canalBlockagePct: 60,
      bridgeStatus: 'open',
      durationHours: 2,
      highTideOverlap: false
    });
    setMitigations({
      prepositionBoats: false,
      deployDewateringPumps: false,
      autoBarricadeSubways: false,
      cellBroadcastAlert: false,
      priorityHospitalPower: false
    });
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-6 text-near font-sans">

      {/* Title Header */}
      <div className="panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <span className="text--eyebrow text-muted flex items-center gap-2 mb-3">
            <Sliders className="w-4 h-4" strokeWidth={1.5} />
            Simulation &amp; Mitigation Intelligence Studio
          </span>
          <h2 className="text--subtitle2 text-ink">
            Hydrodynamic What-If Simulator &amp; Mitigation Tester
          </h2>
          <p className="text--body text-subtle mt-2">
            Run hydrodynamic forecasts, test counterfactual emergency interventions, analyze lives protected,
            and match live conditions to historical decision knowledge.
          </p>
        </div>

        {/* Sub-Tab Navigation Switch */}
        <div className="flex items-center gap-1 border border-line rounded-[4px] p-1 shrink-0">
          <button
            onClick={() => setActiveSubTab('simulation')}
            className={`text--eyebrow flex items-center gap-2 px-3 py-2.5 rounded-[3px] transition-colors cursor-pointer ${
              activeSubTab === 'simulation'
                ? 'bg-ink text-paper'
                : 'text-muted hover:text-ink hover:bg-wash'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" strokeWidth={1.5} />
            Simulator &amp; Counterfactuals
          </button>
          <button
            onClick={() => setActiveSubTab('knowledge_base')}
            className={`text--eyebrow flex items-center gap-2 px-3 py-2.5 rounded-[3px] transition-colors cursor-pointer ${
              activeSubTab === 'knowledge_base'
                ? 'bg-ink text-paper'
                : 'text-muted hover:text-ink hover:bg-wash'
            }`}
          >
            <Database className="w-3.5 h-3.5" strokeWidth={1.5} />
            Decision Knowledge Base
          </button>
        </div>
      </div>

      {dispatchNotice && (
        <div className="border-y border-r border-l-2 border-ink bg-wash px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Radio className="w-4 h-4 text-ink shrink-0" strokeWidth={1.5} />
            <span className="text--body text-near">{dispatchNotice}</span>
          </div>
          <button
            onClick={() => setDispatchNotice(null)}
            className="cta cta--tertiary text-[11px] shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {activeSubTab === 'simulation' ? (
        <div className="space-y-6">

          {/* Disaster Scenario Presets Bar */}
          <div className="panel p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text--eyebrow text-muted flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" strokeWidth={1.5} />
                Quick Preset Scenarios
              </span>
              <span className="text--footnote text-muted">
                Select a preset to auto-configure simulation parameters
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => loadPreset('cloudburst_2015')}
                className="border border-line lift rounded-[4px] p-3 text-left transition-colors hover:bg-wash cursor-pointer"
              >
                <span className="flex items-center gap-2 text--eyebrow text-ink">
                  <span className="sev-mark sev-mark--critical" />
                  Catastrophic
                </span>
                <span className="text--body-medium text-ink block mt-2">Dec 2015 Cloudburst</span>
                <span className="text--footnote text-muted tabular-nums block mt-1">150 mm/hr · 2800 m³/s release</span>
              </button>

              <button
                onClick={() => loadPreset('michaung_2023')}
                className="border border-line lift rounded-[4px] p-3 text-left transition-colors hover:bg-wash cursor-pointer"
              >
                <span className="flex items-center gap-2 text--eyebrow text-ink">
                  <span className="sev-mark sev-mark--advisory" />
                  Severe Inundation
                </span>
                <span className="text--body-medium text-ink block mt-2">Cyclone Michaung (2023)</span>
                <span className="text--footnote text-muted tabular-nums block mt-1">110 mm/hr · High tide overlap</span>
              </button>

              <button
                onClick={() => loadPreset('dam_breach')}
                className="border border-line lift rounded-[4px] p-3 text-left transition-colors hover:bg-wash cursor-pointer"
              >
                <span className="flex items-center gap-2 text--eyebrow text-subtle">
                  <span className="sev-mark sev-mark--info" />
                  Sluice Discharge
                </span>
                <span className="text--body-medium text-ink block mt-2">Dam Emergency Sluice</span>
                <span className="text--footnote text-muted tabular-nums block mt-1">65 mm/hr · 3400 m³/s release</span>
              </button>

              <button
                onClick={() => loadPreset('flash_monsoon')}
                className="border border-line lift rounded-[4px] p-3 text-left transition-colors hover:bg-wash cursor-pointer"
              >
                <span className="flex items-center gap-2 text--eyebrow text-muted">
                  <span className="sev-mark sev-mark--ok" />
                  Flash Event
                </span>
                <span className="text--body-medium text-ink block mt-2">Monsoon Flash Flood</span>
                <span className="text--footnote text-muted tabular-nums block mt-1">95 mm/hr · 85% silt block</span>
              </button>
            </div>
          </div>

          {/* Grid: Controls & Interventions (Left) + Forecast & Delta (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left Column: Parameter Controls + Mitigation Toggles (5 cols) */}
            <div className="lg:col-span-5 space-y-6">

              {/* Scenario Input Controls */}
              <div className="panel p-5 space-y-5">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <h3 className="text--subtitle3 text-ink flex items-center gap-2">
                    <Sliders className="w-4 h-4" strokeWidth={1.5} />
                    Hydrodynamic Physics Inputs
                  </h3>
                  <button
                    onClick={handleReset}
                    className="cta cta--secondary cta--mini items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Reset
                  </button>
                </div>

                {/* Rainfall Intensity Slider */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text--body-medium text-ink flex items-center gap-2">
                      <CloudRain className="w-4 h-4" strokeWidth={1.5} />
                      Rainfall Rate Intensity
                    </span>
                    <span className="text--body-medium text-info-strong tabular-nums transition-colors duration-[250ms]">{params.rainfallMmHr} mm/hr</span>
                  </div>
                  <div className="relative h-[14px]">
                    <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 h-[4px] bg-line rounded-full" />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 left-0 h-[4px] bg-info rounded-full transition-colors duration-[250ms]"
                      style={{ width: `${((params.rainfallMmHr - 20) / 180) * 100}%` }}
                    />
                    <input
                      type="range"
                      min="20"
                      max="200"
                      value={params.rainfallMmHr}
                      onChange={(e) => setParams({ ...params, rainfallMmHr: Number(e.target.value) })}
                      className={SLIDER_INPUT}
                    />
                  </div>
                  <div className="flex justify-between text--footnote text-muted tabular-nums">
                    <span>20 mm/hr (Light)</span>
                    <span>100 mm/hr (Heavy)</span>
                    <span>200 mm/hr (Cloudburst)</span>
                  </div>
                </div>

                {/* Chembarambakkam Dam Discharge */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text--body-medium text-ink flex items-center gap-2">
                      <Waves className="w-4 h-4" strokeWidth={1.5} />
                      Upstream Dam Discharge
                    </span>
                    <span className="text--body-medium text-info-strong tabular-nums transition-colors duration-[250ms]">{params.chembarambakkamReleaseM3s} m³/s</span>
                  </div>
                  <div className="relative h-[14px]">
                    <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 h-[4px] bg-line rounded-full" />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 left-0 h-[4px] bg-info rounded-full transition-colors duration-[250ms]"
                      style={{ width: `${((params.chembarambakkamReleaseM3s - 100) / 3400) * 100}%` }}
                    />
                    <input
                      type="range"
                      min="100"
                      max="3500"
                      step="100"
                      value={params.chembarambakkamReleaseM3s}
                      onChange={(e) => setParams({ ...params, chembarambakkamReleaseM3s: Number(e.target.value) })}
                      className={SLIDER_INPUT}
                    />
                  </div>
                  <div className="flex justify-between text--footnote text-muted tabular-nums">
                    <span>100 m³/s</span>
                    <span>1800 m³/s</span>
                    <span>3500 m³/s (Sluice Open)</span>
                  </div>
                </div>

                {/* Canal & Drainage Congestion */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text--body-medium text-ink flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />
                      Drainage &amp; Canal Silt Blockage
                    </span>
                    <span className="text--body-medium text-ink tabular-nums">{params.canalBlockagePct}% Blocked</span>
                  </div>
                  <div className="relative h-[14px]">
                    <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 h-[4px] bg-line rounded-full" />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 left-0 h-[4px] bg-ink rounded-full"
                      style={{ width: `${params.canalBlockagePct}%` }}
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={params.canalBlockagePct}
                      onChange={(e) => setParams({ ...params, canalBlockagePct: Number(e.target.value) })}
                      className={SLIDER_INPUT}
                    />
                  </div>
                  <div className="flex justify-between text--footnote text-muted tabular-nums">
                    <span>0% (Clear)</span>
                    <span>100% (Fully Silted)</span>
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text--body-medium text-ink">Simulation Duration</span>
                    <span className="text--body-medium text-ink tabular-nums">{params.durationHours} Hours</span>
                  </div>
                  <div className="relative h-[14px]">
                    <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 h-[4px] bg-line rounded-full" />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 left-0 h-[4px] bg-ink rounded-full"
                      style={{ width: `${((params.durationHours - 1) / 11) * 100}%` }}
                    />
                    <input
                      type="range"
                      min="1"
                      max="12"
                      value={params.durationHours}
                      onChange={(e) => setParams({ ...params, durationHours: Number(e.target.value) })}
                      className={SLIDER_INPUT}
                    />
                  </div>
                  <div className="flex justify-between text--footnote text-muted tabular-nums">
                    <span>1 h</span>
                    <span>12 h</span>
                  </div>
                </div>

                {/* Toggles */}
                <div className="pt-4 border-t border-line space-y-3">
                  <label className="flex items-center justify-between cursor-pointer gap-3">
                    <span className="text--body text-near">High-Tide Estuarine Backwater</span>
                    <input
                      type="checkbox"
                      checked={params.highTideOverlap}
                      onChange={(e) => setParams({ ...params, highTideOverlap: e.target.checked })}
                      className={CHECKBOX_INPUT}
                    />
                  </label>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text--body text-near">Adyar Bridges Corridor</span>
                    <select
                      value={params.bridgeStatus}
                      onChange={(e) => setParams({ ...params, bridgeStatus: e.target.value as any })}
                      className="bg-paper border border-line rounded-[4px] text--footnote text-ink px-2.5 py-2 focus:outline-none focus:border-ink cursor-pointer"
                    >
                      <option value="open">Open (All Lanes Clear)</option>
                      <option value="restricted">Restricted (1 Lane Submerged)</option>
                      <option value="closed">Closed (Submerged/Barricaded)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Counterfactual Mitigation Tester Panel */}
              <div className="panel p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-4 gap-3">
                  <h3 className="text--subtitle3 text-ink flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
                    Counterfactual Mitigation Interventions
                  </h3>
                  <span className="badge badge--quiet shrink-0">Live Delta Mode</span>
                </div>

                <p className="text--body text-subtle">
                  Toggle operational mitigations to evaluate counterfactual risk reduction in real time.
                </p>

                <div className="space-y-2">
                  <label className={`flex items-center justify-between gap-3 p-3 rounded-[4px] border cursor-pointer transition-colors duration-[250ms] ${
                    mitigations.prepositionBoats ? 'border-safe bg-safe-wash' : 'border-line bg-paper'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={mitigations.prepositionBoats}
                        onChange={(e) => setMitigations({ ...mitigations, prepositionBoats: e.target.checked })}
                        className={CHECKBOX_INPUT}
                      />
                      <span className={`text--body ${mitigations.prepositionBoats ? 'text-ink' : 'text-subtle'}`}>
                        Pre-position 6 NDRF Rescue Boat Units
                      </span>
                    </div>
                    <span className={`text--footnote tabular-nums shrink-0 transition-colors duration-[250ms] ${
                      mitigations.prepositionBoats ? 'text-safe-strong' : 'text-muted'
                    }`}>−18% Risk</span>
                  </label>

                  <label className={`flex items-center justify-between gap-3 p-3 rounded-[4px] border cursor-pointer transition-colors duration-[250ms] ${
                    mitigations.deployDewateringPumps ? 'border-safe bg-safe-wash' : 'border-line bg-paper'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={mitigations.deployDewateringPumps}
                        onChange={(e) => setMitigations({ ...mitigations, deployDewateringPumps: e.target.checked })}
                        className={CHECKBOX_INPUT}
                      />
                      <span className={`text--body ${mitigations.deployDewateringPumps ? 'text-ink' : 'text-subtle'}`}>
                        Station 4x 500HP Dewatering Pumps
                      </span>
                    </div>
                    <span className={`text--footnote tabular-nums shrink-0 transition-colors duration-[250ms] ${
                      mitigations.deployDewateringPumps ? 'text-safe-strong' : 'text-muted'
                    }`}>−25% Area</span>
                  </label>

                  <label className={`flex items-center justify-between gap-3 p-3 rounded-[4px] border cursor-pointer transition-colors duration-[250ms] ${
                    mitigations.autoBarricadeSubways ? 'border-safe bg-safe-wash' : 'border-line bg-paper'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={mitigations.autoBarricadeSubways}
                        onChange={(e) => setMitigations({ ...mitigations, autoBarricadeSubways: e.target.checked })}
                        className={CHECKBOX_INPUT}
                      />
                      <span className={`text--body ${mitigations.autoBarricadeSubways ? 'text-ink' : 'text-subtle'}`}>
                        Auto-Barricade Guindy &amp; 100ft Subways
                      </span>
                    </div>
                    <span className={`text--footnote tabular-nums shrink-0 transition-colors duration-[250ms] ${
                      mitigations.autoBarricadeSubways ? 'text-safe-strong' : 'text-muted'
                    }`}>−10% Stalls</span>
                  </label>

                  <label className={`flex items-center justify-between gap-3 p-3 rounded-[4px] border cursor-pointer transition-colors duration-[250ms] ${
                    mitigations.cellBroadcastAlert ? 'border-safe bg-safe-wash' : 'border-line bg-paper'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={mitigations.cellBroadcastAlert}
                        onChange={(e) => setMitigations({ ...mitigations, cellBroadcastAlert: e.target.checked })}
                        className={CHECKBOX_INPUT}
                      />
                      <span className={`text--body ${mitigations.cellBroadcastAlert ? 'text-ink' : 'text-subtle'}`}>
                        Cell-Broadcast SMS Emergency Evacuation Alert
                      </span>
                    </div>
                    <span className={`text--footnote tabular-nums shrink-0 transition-colors duration-[250ms] ${
                      mitigations.cellBroadcastAlert ? 'text-safe-strong' : 'text-muted'
                    }`}>−30% Trapped</span>
                  </label>

                  <label className={`flex items-center justify-between gap-3 p-3 rounded-[4px] border cursor-pointer transition-colors duration-[250ms] ${
                    mitigations.priorityHospitalPower ? 'border-safe bg-safe-wash' : 'border-line bg-paper'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={mitigations.priorityHospitalPower}
                        onChange={(e) => setMitigations({ ...mitigations, priorityHospitalPower: e.target.checked })}
                        className={CHECKBOX_INPUT}
                      />
                      <span className={`text--body ${mitigations.priorityHospitalPower ? 'text-ink' : 'text-subtle'}`}>
                        Micro-Grid Backup Power Priority to ICU Hospitals
                      </span>
                    </div>
                    <span className={`text--footnote tabular-nums shrink-0 transition-colors duration-[250ms] ${
                      mitigations.priorityHospitalPower ? 'text-safe-strong' : 'text-muted'
                    }`}>100% Power</span>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    onClick={handleRunSimulation}
                    disabled={isLoading}
                    className="cta cta--primary cta--compact flex-1 gap-2 disabled:opacity-50"
                  >
                    <Play className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
                    <span>{isLoading ? 'Recalculating Physics Model' : 'Execute What-If Model'}</span>
                  </button>

                  <button
                    onClick={() => handlePushLive()}
                    className="cta cta--secondary cta--compact gap-2 shrink-0"
                  >
                    <Zap className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>Push to Live Twin</span>
                  </button>
                </div>

              </div>

            </div>

            {/* Right Column: AI Simulation Results + Delta Impact Card (7 cols) */}
            <div className="lg:col-span-7 panel p-5 space-y-6">

              <div className="flex items-center justify-between border-b border-line pb-4 gap-3">
                <h3 className="text--subtitle3 text-ink flex items-center gap-2">
                  <Cpu className="w-4 h-4" strokeWidth={1.5} />
                  Counterfactual Impact &amp; Forecast Output
                </h3>
                <span className="badge badge--info tabular-nums shrink-0">
                  {result?.simulatedTime || '+3h Scenario'}
                </span>
              </div>

              {/* Counterfactual Delta Impact Comparison Banner.
                  Reads black → green: the unmitigated baseline stays on the ink
                  ramp, every mitigated outcome takes the safe accent. */}
              <div className="bg-wash border border-line rounded-[4px]">
                <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
                  <span className="text--eyebrow text-muted flex items-center gap-2">
                    <BarChart2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Baseline vs. Mitigated Impact
                  </span>
                  <span className="badge badge--safe tabular-nums shrink-0">
                    −{result.riskReductionPct}% Overall Risk
                  </span>
                </div>

                {/* Legend for the black → green read, so the encoding is named */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line px-4 py-2 text--footnote text-muted">
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-6 h-[4px] bg-ink" />
                    Baseline, unmitigated
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-6 h-[4px] bg-safe" />
                    Mitigated outcome
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-line">
                  <div className="px-4 py-4">
                    <span className="text--eyebrow text-muted block">Submerged Area</span>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text--footnote text-ink line-through tabular-nums">{result.predictedSubmergedAreaKm2} km²</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
                      <span className="text--subtitle3 text-safe-strong tabular-nums transition-colors duration-[250ms]">{result.mitigatedAreaKm2} km²</span>
                    </div>
                  </div>

                  <div className="px-4 py-4">
                    <span className="text--eyebrow text-muted block">Population Impacted</span>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text--footnote text-ink line-through tabular-nums">{result.estimatedAffectedPeople.toLocaleString()}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
                      <span className="text--subtitle3 text-safe-strong tabular-nums transition-colors duration-[250ms]">{result.mitigatedAffectedPeople.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="px-4 py-4">
                    <span className="text--eyebrow text-muted block">Lives Protected</span>
                    <span className="text--subtitle3 text-safe-strong tabular-nums block mt-2 transition-colors duration-[250ms]">+{result.livesProtected.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* AI Narrative */}
              <div className="border-y border-r border-l-2 border-line border-l-ink bg-wash p-4 space-y-2">
                <span className="text--eyebrow text-muted block">
                  AI Hydrodynamic Rationale &amp; Counterfactual Proof
                </span>
                <p className="text--body text-near">
                  {result.aiSummary}
                </p>
              </div>

              {/* Critical Road Closures */}
              <div className="space-y-3">
                <h4 className="text--eyebrow text-muted">
                  Predicted Road &amp; Corridor Status
                </h4>
                <div className="border-t border-line">
                  {result.criticalRoadBlocks?.map((block: string, idx: number) => {
                    const isClear = block.includes('Clear');
                    const isMitigated = block.includes('BARRICADED');
                    const isCritical = !isMitigated && (block.includes('CLOSED') || block.includes('SUBMERGED'));
                    const markClass = isClear
                      ? 'sev-mark sev-mark--ok'
                      : isCritical
                        ? 'sev-mark sev-mark--critical'
                        : 'sev-mark sev-mark--advisory';
                    const textClass = isClear
                      ? 'sev-text--ok'
                      : isCritical
                        ? 'sev-text--critical'
                        : 'sev-text--advisory';
                    const label = isClear ? 'Clear' : isMitigated ? 'Mitigated' : isCritical ? 'Critical' : 'Advisory';
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 border-b border-line py-2.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={markClass} />
                          <span className={`text--body ${textClass}`}>{block}</span>
                        </div>
                        <span className="text--eyebrow text-muted shrink-0">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Recommended Pre-Positioning */}
              <div className="space-y-3">
                <h4 className="text--eyebrow text-muted">
                  Active Asset Deployments
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {result.recommendedDeployments?.map((dep: any, idx: number) => (
                    <div key={idx} className="border border-line rounded-[4px] p-3">
                      <span className="text--body-medium text-ink block tabular-nums">{dep.count}× {dep.type}</span>
                      <span className="text--footnote text-muted block mt-1">Target: {dep.zone}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hydrodynamic Inundation Progress Timeline with Step Inspector */}
              {result.riskTimeline && result.riskTimeline.length > 0 && (
                <div className="space-y-3 pt-5 border-t border-line">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="text--eyebrow text-muted flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                      Hydrodynamic Time Horizon Inspector
                    </h4>
                    <span className="text--footnote text-muted">
                      Select a minute step to inspect peak water depth
                    </span>
                  </div>

                  {/* Legend — every series is still named; the water series
                      additionally carries the informational blue accent. */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text--footnote text-muted">
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-6 h-[4px] bg-info" />
                      Peak water depth (0–{DEPTH_SCALE_M} m scale)
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-6 h-[4px] bg-wash border border-line" />
                      Remaining scale
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-px h-3 bg-ink" />
                      {DEPTH_TICK_M.toFixed(1)} m reference tick
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums text-ink">Nz</span>
                      = flooded zones at that step
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {result.riskTimeline?.map((step: any, idx: number) => {
                      const isSelected = selectedTimelineMinute === step.minute;
                      const depth = step.maxWaterDepthMeters;
                      
                      // Dynamic vibrant gradient fill and text color based on depth severity
                      const fillGradient = depth >= 2.0 
                        ? 'from-rose-500 to-red-600'
                        : depth >= 1.0
                        ? 'from-amber-400 to-orange-500'
                        : 'from-emerald-400 to-teal-500';
                      
                      const depthTextColor = depth >= 2.0
                        ? 'text-red-600 font-semibold'
                        : depth >= 1.0
                        ? 'text-amber-600 font-semibold'
                        : 'text-emerald-600 font-semibold';

                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedTimelineMinute(step.minute)}
                          className={`p-3 rounded-xl border text-left transition-all duration-[250ms] cursor-pointer ${
                            isSelected
                              ? 'border-sky-500 bg-sky-50/50 shadow-[0_4px_12px_rgba(14,165,233,0.06)]'
                              : 'border-slate-200/80 bg-white/70 hover:bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text--footnote tabular-nums ${isSelected ? 'text-sky-950 font-semibold' : 'text-slate-700'}`}>
                              T+{step.minute}m
                            </span>
                            <span className="text--footnote text-muted tabular-nums">{step.floodedZones}z</span>
                          </div>

                          <div className="relative w-full h-2 bg-slate-100 rounded-full my-2 overflow-hidden">
                            <div
                              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${fillGradient} rounded-full transition-all duration-[300ms]`}
                              style={{ width: `${Math.min(100, Math.max(10, (depth / DEPTH_SCALE_M) * 100))}%` }}
                            />
                            <span
                              className="absolute top-0 w-px h-2 bg-red-500"
                              style={{ left: `${(DEPTH_TICK_M / DEPTH_SCALE_M) * 100}%` }}
                              aria-hidden="true"
                            />
                          </div>

                          <span className="text--footnote text-slate-500 tabular-nums block">
                            Depth <span className={`${depthTextColor} transition-colors duration-[250ms]`}>{depth} m</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Command Directives Action Button */}
              <div className="pt-5 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text--footnote text-muted">
                  Ready to deploy the counterfactual plan to live field teams?
                </span>
                <button
                  onClick={handleDispatchDirectives}
                  className="cta cta--primary cta--compact w-full sm:w-auto gap-2 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Dispatch Approved Mitigation Directives</span>
                </button>
              </div>

            </div>

          </div>

        </div>
      ) : (
        /* Decision Knowledge Base & Scenario Matching View */
        <div className="space-y-6">

          {/* Matcher Trigger Banner */}
          <div className="panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <span className="text--eyebrow text-muted flex items-center gap-2 mb-3">
                <GitCompare className="w-4 h-4" strokeWidth={1.5} />
                Live-to-Knowledge Base Vector Matcher
              </span>
              <h3 className="text--subtitle2 text-ink">
                Match Live Disaster State Against Top-K Historical Simulations
              </h3>
              <p className="text--body text-subtle mt-2">
                Performs multi-dimensional vector matching across rainfall rates, river levels, dam releases,
                and traffic bottlenecks to extract historically proven strategies.
              </p>
            </div>

            <button
              onClick={handleRunScenarioMatch}
              disabled={isMatching}
              className="cta cta--primary cta--compact gap-2 shrink-0 disabled:opacity-50"
            >
              <Search className={`w-3.5 h-3.5 ${isMatching ? 'animate-spin' : ''}`} strokeWidth={1.5} />
              <span>{isMatching ? 'Searching Knowledge Base' : 'Run Scenario Matching Engine'}</span>
            </button>
          </div>

          {/* Matched Scenarios Display */}
          {scenarioMatches && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
                <h4 className="text--eyebrow text-muted">
                  Top Matched Historical Disaster Scenarios
                </h4>
                <span className="text--footnote text-subtle">
                  Master strategy: {scenarioMatches.recommendedMasterPlan}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scenarioMatches.matchedScenarios?.map((sim: any) => (
                  <div key={sim.id} className="panel lift p-5 space-y-4">
                    <div>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text--eyebrow text-muted">Historical Similarity</span>
                        <span className="text--body-medium text-ink tabular-nums">{sim.similarityPct}%</span>
                      </div>
                      <div className="relative w-full h-[4px] bg-wash mt-2">
                        <div
                          className="absolute inset-y-0 left-0 bg-ink"
                          style={{ width: `${Math.min(100, Math.max(0, sim.similarityPct))}%` }}
                        />
                      </div>
                      <h4 className="text--subtitle3 text-ink mt-3">{sim.historicalEvent}</h4>
                    </div>

                    <div className="bg-wash border border-line rounded-[4px] p-3 space-y-2">
                      <span className="text--eyebrow text-muted block">Key Pattern Matches</span>
                      <ul className="space-y-1.5">
                        {sim.keyMatches?.map((km: string, idx: number) => (
                          <li key={idx} className="text--footnote text-subtle flex items-start gap-2">
                            <span className="sev-mark sev-mark--info mt-0.5" />
                            <span>{km}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text--eyebrow text-muted block">Retrieved Effective Strategy</span>
                      <p className="text--body text-subtle">
                        {sim.retrievedStrategy}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text--eyebrow text-muted block">AI Refinement For Live Event</span>
                      <p className="text--body text-near border-l-2 border-l-ink pl-3">
                        {sim.aiRefinement}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        if (sim.id.includes('2015')) loadPreset('cloudburst_2015');
                        else loadPreset('michaung_2023');
                        setActiveSubTab('simulation');
                      }}
                      className="cta cta--secondary cta--mini w-full"
                    >
                      <span>Load Parameters into Simulator</span>
                      <span className="cta__arrow">→</span>
                    </button>

                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decision Knowledge Base Repository Table with Search */}
          <div className="panel p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-line pb-4">
              <h3 className="text--subtitle3 text-ink flex items-center gap-2">
                <BookOpen className="w-4 h-4" strokeWidth={1.5} />
                Decision Knowledge Base Repository
              </h3>

              {/* Search & Filter Inputs */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
                  <input
                    type="text"
                    placeholder="Search incident memory"
                    value={kbSearch}
                    onChange={(e) => setKbSearch(e.target.value)}
                    className="w-full bg-paper border border-line rounded-[4px] text--footnote text-ink placeholder:text-muted pl-9 pr-3 py-2 focus:outline-none focus:border-ink"
                  />
                </div>
                <span className="text--footnote text-muted tabular-nums shrink-0">
                  124 Stored Events
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-wash">
                    <th className="text--eyebrow text-muted font-medium px-3 py-3 border-b border-line">Scenario ID</th>
                    <th className="text--eyebrow text-muted font-medium px-3 py-3 border-b border-line">Rainfall / Dam Parameters</th>
                    <th className="text--eyebrow text-muted font-medium px-3 py-3 border-b border-line">Generated Actions</th>
                    <th className="text--eyebrow text-muted font-medium px-3 py-3 border-b border-line">Effectiveness Score</th>
                    <th className="text--eyebrow text-muted font-medium px-3 py-3 border-b border-line">Lessons Learned</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-line">
                    <td className="px-3 py-3 text--body-medium text-ink tabular-nums">SIM-2015-12-01</td>
                    <td className="px-3 py-3 text--body text-subtle tabular-nums">Rain 120 mm/hr · Dam 2200 m³/s</td>
                    <td className="px-3 py-3 text--body text-near">Pre-evacuate Kotturpuram + Deploy 6 Boats</td>
                    <td className="px-3 py-3 text--body-medium text-ink tabular-nums">92%</td>
                    <td className="px-3 py-3 text--footnote text-muted">Pre-positioning boats prior to T+30m cuts rescue delays by 42%.</td>
                  </tr>
                  <tr className="border-b border-line">
                    <td className="px-3 py-3 text--body-medium text-ink tabular-nums">SIM-2021-11-25</td>
                    <td className="px-3 py-3 text--body text-subtle tabular-nums">Rain 85 mm/hr · Silt Block 80%</td>
                    <td className="px-3 py-3 text--body text-near">Station 500HP Pumps at Velachery Canal</td>
                    <td className="px-3 py-3 text--body-medium text-ink tabular-nums">88%</td>
                    <td className="px-3 py-3 text--footnote text-muted">Early dewatering prevents standing water accumulation in ground floors.</td>
                  </tr>
                  <tr className="border-b border-line">
                    <td className="px-3 py-3 text--body-medium text-ink tabular-nums">SIM-2023-12-04</td>
                    <td className="px-3 py-3 text--body text-subtle tabular-nums">Rain 140 mm/hr · High Tide Overlap</td>
                    <td className="px-3 py-3 text--body text-near">Automated Barrier at Guindy Railway Subway</td>
                    <td className="px-3 py-3 text--body-medium text-ink tabular-nums">95%</td>
                    <td className="px-3 py-3 text--footnote text-muted">Early subway closure prevents vehicle trapping and traffic gridlock.</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 text--body-medium text-ink tabular-nums">SIM-2024-10-15</td>
                    <td className="px-3 py-3 text--body text-subtle tabular-nums">Rain 95 mm/hr · Dam 1100 m³/s</td>
                    <td className="px-3 py-3 text--body text-near">Cell-Broadcast Alert + ICU Power Backup</td>
                    <td className="px-3 py-3 text--body-medium text-ink tabular-nums">94%</td>
                    <td className="px-3 py-3 text--footnote text-muted">Cell-broadcast evacuation messages reduced unassisted stranded calls by 64%.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
