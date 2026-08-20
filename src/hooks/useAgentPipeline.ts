import { useState, useCallback } from 'react';
import { runMultiAgentPipeline } from '../services/api';
import { ZoneRisk, CitizenReport, ExplainableAIRecommendation } from '../shared/types';

export interface AgentLog {
  id: string;
  agentName: string;
  action: string;
  details: string;
  timestamp: string;
  severity: 'info' | 'success' | 'warning' | 'alert';
}

const PRESET_MOCK_DATA: Record<'normal' | 'moderate' | 'flood', {
  recommendation: ExplainableAIRecommendation;
  logs: AgentLog[];
}> = {
  flood: {
    recommendation: {
      id: 'rec-flood-1',
      title: 'Emergency Deployment: Velachery High-Water Rescue Fleet',
      actionType: 'deploy_boats',
      priority: 'CRITICAL',
      targetZoneId: 'zone-velachery-south',
      targetZoneName: 'Velachery 100ft Road near Vijaya Nagar Junction',
      recommendedResources: [
        { resourceType: 'Inflatable Rescue Boats', quantity: 6 },
        { resourceType: 'High-Capacity Dewatering Pumps', quantity: 4 },
        { resourceType: 'NDRF Amphibious Vehicles', quantity: 2 },
        { resourceType: 'Emergency Food & Water Packets', quantity: 500 }
      ],
      reasoning: {
        coreReason: 'Overland flow discharge reached 1,850 m³/s from Chembarambakkam sluice gates combined with 110mm/hr intense convective rainfall.',
        riskExplanation: 'Velachery South low-lying topography is inundated to 1.8m depth, trapping 320 households along Lake View Road.',
        confidencePct: 96,
        evidenceData: ['IMD Chennai Doppler Radar', 'Sentinel-1 SAR Flood Inundation Map', 'C-DOT Cell Broadcast Telemetry'],
        supportingMetrics: [
          { metric: 'Rainfall Depth', value: '110 mm/hr' },
          { metric: 'Inundation Depth', value: '1.8 meters' }
        ],
        alternativeRisk: 'Delaying deployment by 30 mins increases localized flood entrapment risk by 45%.'
      },
      status: 'pending',
      timestamp: new Date().toLocaleTimeString()
    },
    logs: [
      {
        id: `log-f-1`,
        agentName: 'Agent 1: Sentinel Risk Engine',
        action: 'CRITICAL RISK',
        details: 'Velachery South risk score escalated to 94.2/100 based on 110mm/hr Doppler radar rainfall & sluice outflow.',
        timestamp: new Date().toLocaleTimeString(),
        severity: 'alert'
      },
      {
        id: `log-f-2`,
        agentName: 'Agent 2: Cascading AI Predictor',
        action: 'CASCADE WARNING',
        details: 'Substation power shutdown imminent in Zone 4 due to rising floodwaters. Grid isolate recommended.',
        timestamp: new Date().toLocaleTimeString(),
        severity: 'warning'
      },
      {
        id: `log-f-3`,
        agentName: 'Agent 3: Fleet Dispatch AI',
        action: 'DISPATCH PLAN',
        details: 'Optimum rescue route calculated via Pallikaranai Bypass to avoid 1.2m submerged Velachery Main Road.',
        timestamp: new Date().toLocaleTimeString(),
        severity: 'success'
      }
    ]
  },
  moderate: {
    recommendation: {
      id: 'rec-mod-1',
      title: 'Pre-position Dewatering Fleet & Pre-alert Relief Shelters in Madipakkam',
      actionType: 'setup_relief',
      priority: 'HIGH',
      targetZoneId: 'zone-madipakkam',
      targetZoneName: 'Madipakkam Lake Basin',
      recommendedResources: [
        { resourceType: 'High-Capacity Dewatering Pumps', quantity: 3 },
        { resourceType: 'NDRF Personnel Squads', quantity: 2 },
        { resourceType: 'Sandbag Bunding Trucks', quantity: 4 }
      ],
      reasoning: {
        coreReason: 'Moderate convective cloud burst detected over South Chennai catchment. Water level rising at 15cm/hr in Madipakkam feeder canals.',
        riskExplanation: 'Feeder canals are at 82% capacity. Early dewatering prevents residential street waterlogging.',
        confidencePct: 91,
        evidenceData: ['Rainfall Gauge Network', 'Canal Flow Sensors'],
        supportingMetrics: [
          { metric: 'Precipitation Rate', value: '45 mm/hr' },
          { metric: 'Feeder Canal Level', value: '82% Capacity' }
        ],
        alternativeRisk: 'Inundation of low-lying street access within 45 minutes if pumps remain staged.'
      },
      status: 'pending',
      timestamp: new Date().toLocaleTimeString()
    },
    logs: [
      {
        id: `log-m-1`,
        agentName: 'Agent 1: Sentinel Risk Engine',
        action: 'ELEVATED RISK',
        details: 'Madipakkam risk index increased to 68/100 due to persistent 45mm/hr precipitation.',
        timestamp: new Date().toLocaleTimeString(),
        severity: 'warning'
      },
      {
        id: `log-m-2`,
        agentName: 'Agent 2: Cascading AI Predictor',
        action: 'STORM SEWER WATCH',
        details: 'Canal runoff capacity projected to reach peak in 45 minutes.',
        timestamp: new Date().toLocaleTimeString(),
        severity: 'info'
      },
      {
        id: `log-m-3`,
        agentName: 'Agent 3: Fleet Dispatch AI',
        action: 'RESOURCE STAGING',
        details: 'Pre-staging 3 Mobile Pump units at Madipakkam Bus Terminus junction.',
        timestamp: new Date().toLocaleTimeString(),
        severity: 'success'
      }
    ]
  },
  normal: {
    recommendation: {
      id: 'rec-norm-1',
      title: 'Standard Monitoring & Routine IoT Telemetry Patrol',
      actionType: 'block_road',
      priority: 'MEDIUM',
      targetZoneId: 'zone-adyar-estuary',
      targetZoneName: 'Adyar Estuary',
      recommendedResources: [
        { resourceType: 'IoT River Gauge Monitoring Unit', quantity: 1 }
      ],
      reasoning: {
        coreReason: 'Rainfall < 5mm/hr. River basin discharge well below flood thresholds at 45 m³/s.',
        riskExplanation: 'Normal tidal and canal flow dynamics observed across all 12 monitored zones.',
        confidencePct: 99,
        evidenceData: ['All IoT Water Level Gauges', 'IMD Satellite Clear Skies Feed'],
        supportingMetrics: [
          { metric: 'Rainfall Depth', value: '< 5 mm/hr' },
          { metric: 'River Discharge', value: '45 m³/s' }
        ],
        alternativeRisk: 'None. All sensors within normal operational thresholds.'
      },
      status: 'pending',
      timestamp: new Date().toLocaleTimeString()
    },
    logs: [
      {
        id: `log-n-1`,
        agentName: 'Agent 1: Sentinel Risk Engine',
        action: 'SYSTEM HEALTHY',
        details: 'All 12 Chennai zones reporting low risk index (< 25/100). No active storm warnings.',
        timestamp: new Date().toLocaleTimeString(),
        severity: 'success'
      },
      {
        id: `log-n-2`,
        agentName: 'Agent 2: Cascading AI Predictor',
        action: 'NOMINAL STATUS',
        details: 'Zero cascading infrastructure threats detected.',
        timestamp: new Date().toLocaleTimeString(),
        severity: 'info'
      }
    ]
  }
};

export function useAgentPipeline() {
  const [isRunning, setIsRunning] = useState(false);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>(PRESET_MOCK_DATA.flood.logs);
  const [activeRecommendation, setActiveRecommendation] = useState<ExplainableAIRecommendation | null>(PRESET_MOCK_DATA.flood.recommendation);
  const [lastPreset, setLastPreset] = useState<'normal' | 'moderate' | 'flood'>('flood');

  const executePipeline = useCallback(async (preset: 'normal' | 'moderate' | 'flood' = 'flood') => {
    setIsRunning(true);
    setLastPreset(preset);
    try {
      const data = await runMultiAgentPipeline({ preset });
      if (data && data.agentLogs) {
        const formattedLogs: AgentLog[] = data.agentLogs.map((log: any, idx: number) => ({
          id: `log-${Date.now()}-${idx}`,
          agentName: log.agentName || 'Agent',
          action: log.action || 'Analysis',
          details: log.details || '',
          timestamp: new Date().toLocaleTimeString(),
          severity: log.severity || 'info'
        }));
        setAgentLogs((prev) => [...formattedLogs, ...prev].slice(0, 50));
      }
      if (data && data.recommendation) {
        setActiveRecommendation(data.recommendation);
      }
      return data;
    } catch (err) {
      console.warn('API multiagent endpoint unavailable, using dynamic preset simulation:', err);
      // Fallback to rich preset mock data so UI updates smoothly
      const fallback = PRESET_MOCK_DATA[preset];
      setAgentLogs((prev) => [...fallback.logs, ...prev].slice(0, 50));
      setActiveRecommendation(fallback.recommendation);
      return fallback;
    } finally {
      setIsRunning(false);
    }
  }, []);

  return {
    isRunning,
    agentLogs,
    activeRecommendation,
    executePipeline,
    lastPreset
  };
}

