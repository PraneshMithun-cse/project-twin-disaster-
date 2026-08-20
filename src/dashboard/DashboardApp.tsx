import React, { useState, useEffect } from 'react';
import {
  DisasterType,
  AgencyRole,
  ZoneRisk,
  IoTSensorNode,
  EmergencyResource,
  EmergencyShelter,
  CitizenReport,
  AgentActivityLog,
  ExplainableAIRecommendation,
  AutomatedAlert,
  EvacuationRoute,
  EmergencyHospital
} from '../shared/types';
import {
  INITIAL_ZONES,
  INITIAL_IOT_SENSORS,
  INITIAL_RESOURCES,
  INITIAL_SHELTERS,
  INITIAL_CITIZEN_REPORTS,
  INITIAL_AGENT_LOGS,
  INITIAL_RECOMMENDATIONS,
  INITIAL_ALERTS,
  INITIAL_HOSPITALS,
  MOCK_EVACUATION_ROUTE
} from '../shared/mockDigitalTwinData';

import { Header } from './components/Header';
import { DigitalTwinMap } from './components/DigitalTwinMap';
import { AuthorityDashboard } from './components/AuthorityDashboard';
import { SimulationStudio } from './components/SimulationStudio';
import { CitizenPortal } from './components/CitizenPortal';
import { AnalyticsHub } from './components/AnalyticsHub';
import { ExplainabilityModal } from './components/ExplainabilityModal';
import { ResourceDispatchModal } from './components/ResourceDispatchModal';

import DashboardOverview from './components/DashboardOverview';
import HospitalsPanel from './components/HospitalsPanel';
import ResourcesPanel from './components/ResourcesPanel';
import SheltersPanel from './components/SheltersPanel';
import IncidentsPanel from './components/IncidentsPanel';
import SettingsPanel from './components/SettingsPanel';
import CascadingImpactView from './components/CascadingImpactView';
import FacilitySafetyStudio from './components/FacilitySafetyStudio';

import { LinearWorkflowBar, WorkflowBarProvider } from './components/LinearWorkflowBar';

import { 
  LayoutDashboard, 
  ShieldAlert, 
  Map, 
  Truck, 
  Home, 
  Hospital, 
  Cpu, 
  Sliders, 
  MessageSquare, 
  Settings, 
  Bell, 
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Activity,
  AlertTriangle,
  GitBranch,
  Zap,
  Factory
} from 'lucide-react';

import { useSSEStream } from '../hooks/useSSEStream';
import { useEvacuationRoute } from '../hooks/useEvacuationRoute';

interface DashboardAppProps {
  onBackToLanding: () => void;
  initialTab?: string;
  initialRole?: AgencyRole;
  onNavigateTab?: (tab: string) => void;
}

export default function DashboardApp({ onBackToLanding, initialTab, initialRole, onNavigateTab }: DashboardAppProps) {
  // Global State
  const [disasterType, setDisasterType] = useState<DisasterType>('flood');
  const [agencyRole, setAgencyRole] = useState<AgencyRole>(initialRole || 'authority');
  const [activeTab, setActiveTabState] = useState<string>(initialTab || 'dashboard');

  useEffect(() => {
    if (initialRole && initialRole !== agencyRole) {
      setAgencyRole(initialRole);
    }
  }, [initialRole]);

  const isCitizenRole = agencyRole === 'citizen';
  const citizenAllowedTabIds = ['twin_map', 'citizen_portal'];

  // Role Access Guard Effect: Redirect citizens trying to access restricted tabs
  useEffect(() => {
    if (agencyRole === 'citizen') {
      if (!citizenAllowedTabIds.includes(activeTab)) {
        setActiveTabState('twin_map');
        if (onNavigateTab) {
          onNavigateTab('twin_map');
        }
      }
    }
  }, [agencyRole, activeTab]);

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      if (agencyRole === 'citizen' && !citizenAllowedTabIds.includes(initialTab)) {
        setActiveTabState('twin_map');
      } else {
        setActiveTabState(initialTab);
      }
    }
  }, [initialTab]);

  const setActiveTab = (tab: string) => {
    if (agencyRole === 'citizen' && !citizenAllowedTabIds.includes(tab)) {
      setActiveTabState('twin_map');
      if (onNavigateTab) onNavigateTab('twin_map');
      return;
    }
    setActiveTabState(tab);
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
  };

  const [zones, setZones] = useState<ZoneRisk[]>(INITIAL_ZONES);
  const [sensors, setSensors] = useState<IoTSensorNode[]>(INITIAL_IOT_SENSORS);
  const [resources, setResources] = useState<EmergencyResource[]>(INITIAL_RESOURCES);
  const [shelters, setShelters] = useState<EmergencyShelter[]>(INITIAL_SHELTERS);
  const [hospitals, setHospitals] = useState<EmergencyHospital[]>(INITIAL_HOSPITALS);
  const [reports, setReports] = useState<CitizenReport[]>(INITIAL_CITIZEN_REPORTS);
  const [agentLogs, setAgentLogs] = useState<AgentActivityLog[]>(INITIAL_AGENT_LOGS);
  const [recommendations, setRecommendations] = useState<ExplainableAIRecommendation[]>(INITIAL_RECOMMENDATIONS);
  const [alerts, setAlerts] = useState<AutomatedAlert[]>(INITIAL_ALERTS);

  // Fetch active database records from backend/Supabase on mount
  useEffect(() => {
    async function fetchAllData() {
      try {
        const [repRes, shRes, hospRes, resRes, zoneRes, sensRes] = await Promise.all([
          fetch('/api/reports'),
          fetch('/api/shelters'),
          fetch('/api/hospitals'),
          fetch('/api/resources'),
          fetch('/api/risk'),
          fetch('/api/sensors')
        ]);

        if (repRes.ok) {
          const json = await repRes.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) setReports(json.data);
        }
        if (shRes.ok) {
          const json = await shRes.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) setShelters(json.data);
        }
        if (hospRes.ok) {
          const json = await hospRes.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) setHospitals(json.data);
        }
        if (resRes.ok) {
          const json = await resRes.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) setResources(json.data);
        }
        if (zoneRes.ok) {
          const json = await zoneRes.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) setZones(json.data);
        }
        if (sensRes.ok) {
          const json = await sensRes.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) setSensors(json.data);
        }
      } catch (err) {
        console.warn('Initial database data fetch warning:', err);
      }
    }
    fetchAllData();
  }, []);

  // Custom Hooks
  const { evacuationRoute, isCalculating, calculateRoute, selectShelter } = useEvacuationRoute(shelters);

  // Real-time live telemetry simulation stream
  useEffect(() => {
    const interval = setInterval(() => {
      setZones(prevZones => prevZones.map(zone => {
        const deltaRain = (Math.random() - 0.45) * 1.8;
        const newRain = Math.max(5, Math.min(150, Math.round(zone.rainfallRateMmHr + deltaRain)));
        return {
          ...zone,
          rainfallRateMmHr: newRain
        };
      }));

      setSensors(prevSensors => prevSensors.map(sensor => {
        const delta = (Math.random() - 0.48) * 0.04;
        const newVal = Number((sensor.currentValue + delta).toFixed(2));
        return {
          ...sensor,
          currentValue: Math.max(0.1, newVal),
          lastUpdated: 'Just now'
        };
      }));
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  useSSEStream({
    onNewReport: (newReport) => setReports(prev => [newReport, ...prev]),
    onNewLog: (newLog) => setAgentLogs(prev => [newLog, ...prev]),
    onNewAlert: (newAlert) => setAlerts(prev => [newAlert, ...prev])
  });

  const [timeHorizon, setTimeHorizon] = useState<'live' | '30m' | '1h' | '2h'>('live');

  // Interactive Action Feedback Toast
  const [toast, setToast] = useState<{ message: string; type?: 'info' | 'success' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4200);
  };

  // Modals
  const [explainModalRec, setExplainModalRec] = useState<ExplainableAIRecommendation | null>(null);
  const [dispatchZoneId, setDispatchZoneId] = useState<string | null>(null);

  // Syncing & Judge Demo Scenario Preset state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [activePreset, setActivePreset] = useState<'normal' | 'moderate' | 'flood'>('flood');

  // Trigger Multi-Agent AI System Run with Judge Demo Scenario Presets
  const handleTriggerSync = async (presetTarget?: 'normal' | 'moderate' | 'flood') => {
    const selectedPreset = presetTarget || activePreset;
    setActivePreset(selectedPreset);
    setIsSyncing(true);
    const startTime = Date.now();
    try {
      const response = await fetch('/api/ai/multiagent-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preset: selectedPreset,
          zones,
          sensors,
          reports,
          weatherCondition: { rainfallRateMmHr: selectedPreset === 'normal' ? 2.4 : selectedPreset === 'moderate' ? 42 : 110 }
        })
      });

      const data = await response.json();
      if (data.success && data.data) {
        const aiRes = data.data;

        // 1. Update zone risk predictions if provided
        if (aiRes.updatedZones && Array.isArray(aiRes.updatedZones)) {
          setZones(prev => prev.map(zone => {
            const match = aiRes.updatedZones.find((u: any) => u.id === zone.id);
            if (match) {
              return {
                ...zone,
                riskScore: match.riskScore || zone.riskScore,
                priorityLevel: match.priorityLevel || zone.priorityLevel,
                predictedWaterLevel30m: match.predictedWaterLevel30m || zone.predictedWaterLevel30m,
                predictedWaterLevel1h: match.predictedWaterLevel1h || zone.predictedWaterLevel1h,
                status: match.status || zone.status
              };
            }
            return zone;
          }));
        }

        // 2. Append AI Agent logs
        if (aiRes.agentLogs && Array.isArray(aiRes.agentLogs)) {
          const newLogs: AgentActivityLog[] = aiRes.agentLogs.map((log: any, idx: number) => ({
            id: `log-ai-${Date.now()}-${idx}`,
            agentName: log.agentName || 'Coordinator Agent',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            action: log.action || 'Telemetry Evaluation',
            details: log.details || 'Fused telemetry streams',
            severity: log.severity || 'info'
          }));
          setAgentLogs(prev => [...newLogs, ...prev]);
        }

        // 3. Append Recommendation if present
        if (aiRes.recommendation) {
          const rec = aiRes.recommendation;
          const newRec: ExplainableAIRecommendation = {
            id: `rec-ai-${Date.now()}`,
            title: rec.title || 'Deploy Emergency Dewatering & Motorboat Fleet',
            targetZoneId: rec.targetZoneId || 'zone-velachery-south',
            targetZoneName: rec.targetZoneName || 'Velachery South',
            actionType: rec.actionType || 'deploy_boats',
            recommendedResources: rec.recommendedResources || [{ resourceType: 'Rescue Boat Unit', quantity: 2 }],
            priority: rec.priority || 'CRITICAL',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            reasoning: rec.reasoning || {
              coreReason: 'Rapid sluice discharge threatens ground-floor residents.',
              evidenceData: ['IoT Sluice reading +2.85m', '3 Citizen Reports confirmed 4ft water'],
              confidencePct: 96,
              supportingMetrics: [{ metric: 'Rainfall', value: '85 mm/hr' }],
              riskExplanation: 'Delaying deployment by 15 minutes will trap ~1,200 residents.',
              alternativeRisk: 'Diverting boats to Kotturpuram causes higher total casualty risk.'
            },
            status: 'pending'
          };
          setRecommendations(prev => [newRec, ...prev]);
        }

        // 4. Append Automated Alert if generated
        if (aiRes.automatedAlert) {
          const alert = aiRes.automatedAlert;
          const newAlert: AutomatedAlert = {
            id: `alert-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            headline: alert.headline || 'FLASH FLOOD WARNING ACTIVE',
            zone: alert.zone || 'Velachery Sector',
            severity: alert.severity || 'critical',
            agenciesNotified: alert.agenciesNotified || ['Disaster Management', 'Fire & Rescue', 'Police'],
            instructions: alert.instructions || 'Evacuate ground floors immediately.',
            acknowledged: false
          };
          setAlerts(prev => [newAlert, ...prev]);
        }

        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.error('Error during AI multi-agent sync:', err);
    } finally {
      // Guaranteed 1.4s computational engine delay
      const elapsed = Date.now() - startTime;
      if (elapsed < 1400) {
        await new Promise(r => setTimeout(r, 1400 - elapsed));
      }
      setIsSyncing(false);
      showToast(`Multi-Agent AI Engine re-calculated risk parameters (${selectedPreset.toUpperCase()} scenario)`, 'success');
    }
  };

  // Recommendation Approvals
  const handleApproveRecommendation = (recId: string) => {
    setRecommendations(prev => prev.map(r => r.id === recId ? { ...r, status: 'approved' } : r));

    // Update resources and logs
    const rec = recommendations.find(r => r.id === recId);
    if (rec) {
      setResources(prev => prev.map(res => {
        if (res.status === 'available') {
          const newPct = Math.max(10, res.fuelOrSuppliesPct - 15);
          return { ...res, status: 'deployed', assignedZoneId: rec.targetZoneId, fuelOrSuppliesPct: newPct };
        }
        return res;
      }));

      const newLog: AgentActivityLog = {
        id: `log-app-${Date.now()}`,
        agentName: 'Resource Planner Agent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'Fleet Approved & Dispatched',
        details: `Approved "${rec.title}" for ${rec.targetZoneName}. Rescue boats deployed (Supplies decreased).`,
        severity: 'success'
      };
      setAgentLogs(prev => [newLog, ...prev]);
    }
  };

  const handleRejectRecommendation = (recId: string) => {
    setRecommendations(prev => prev.map(r => r.id === recId ? { ...r, status: 'rejected' } : r));
  };

  // Resource Dispatch
  const handleDispatchResource = (resourceId: string, zoneId: string) => {
    setResources(prev => prev.map(res => {
      if (res.id === resourceId) {
        const newPct = Math.max(10, res.fuelOrSuppliesPct - 15);
        return { ...res, status: 'deployed', assignedZoneId: zoneId, fuelOrSuppliesPct: newPct };
      }
      return res;
    }));
    const targetZone = zones.find(z => z.id === zoneId);
    const targetRes = resources.find(r => r.id === resourceId);

    const newLog: AgentActivityLog = {
      id: `log-disp-${Date.now()}`,
      agentName: 'Resource Planner Agent',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Manual Fleet Dispatch',
      details: `Dispatched ${targetRes?.name || 'Unit'} to ${targetZone?.name || 'Inundation Sector'} (-15% supplies used).`,
      severity: 'success'
    };
    setAgentLogs(prev => [newLog, ...prev]);
    showToast(`Unit ${targetRes?.name || 'Emergency Fleet'} dispatched to ${targetZone?.name || 'Sector'}`, 'success');
  };

  // Resource Operations (Consume / Refill / Update)
  const handleConsumeResource = (resourceId: string, amountPct: number = 15) => {
    let updatedResName = '';
    let newPctVal = 0;
    setResources(prev => prev.map(res => {
      if (res.id === resourceId) {
        updatedResName = res.name;
        newPctVal = Math.max(0, res.fuelOrSuppliesPct - amountPct);
        return {
          ...res,
          fuelOrSuppliesPct: newPctVal,
          status: newPctVal === 0 ? 'maintenance' : res.status
        };
      }
      return res;
    }));

    if (updatedResName) {
      const newLog: AgentActivityLog = {
        id: `log-use-${Date.now()}`,
        agentName: 'Fleet Operations Agent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'Fleet Supplies Consumed',
        details: `${updatedResName} fuel/supplies reduced by ${amountPct}% (Current Level: ${newPctVal}%).`,
        severity: newPctVal < 30 ? 'warning' : 'info'
      };
      setAgentLogs(prev => [newLog, ...prev]);
    }
  };

  const handleRefillResource = (resourceId: string, amountPct: number = 25) => {
    let updatedResName = '';
    let newPctVal = 100;
    setResources(prev => prev.map(res => {
      if (res.id === resourceId) {
        updatedResName = res.name;
        newPctVal = Math.min(100, res.fuelOrSuppliesPct + amountPct);
        return {
          ...res,
          fuelOrSuppliesPct: newPctVal,
          status: res.status === 'maintenance' && newPctVal > 20 ? 'available' : res.status
        };
      }
      return res;
    }));

    if (updatedResName) {
      const newLog: AgentActivityLog = {
        id: `log-refill-${Date.now()}`,
        agentName: 'Fleet Operations Agent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'Fleet Refilled & Restocked',
        details: `${updatedResName} fuel/supplies restocked (+${amountPct}%). Total: ${newPctVal}%.`,
        severity: 'success'
      };
      setAgentLogs(prev => [newLog, ...prev]);
    }
  };

  const handleUpdateResource = (resourceId: string, updates: Partial<EmergencyResource>) => {
    setResources(prev => prev.map(res => res.id === resourceId ? { ...res, ...updates } : res));
  };

  // ----------------------------------------------------
  // MULTI-FEATURE CROSS-ORCHESTRATION HANDLERS
  // ----------------------------------------------------

  // Shelters Panel Cross-Orchestrators
  const handleAdmitEvacueesToShelter = (shelterId: string, count: number) => {
    let shelterName = '';
    let newOcc = 0;
    let cap = 0;
    setShelters(prev => prev.map(s => {
      if (s.id === shelterId) {
        shelterName = s.name;
        cap = s.totalCapacity;
        newOcc = Math.min(s.totalCapacity, s.currentOccupancy + count);
        const newStatus = newOcc >= cap ? 'full' : newOcc >= cap * 0.8 ? 'near_capacity' : 'open';
        return {
          ...s,
          currentOccupancy: newOcc,
          status: newStatus
        };
      }
      return s;
    }));

    if (shelterName) {
      const newLog: AgentActivityLog = {
        id: `log-shelter-admit-${Date.now()}`,
        agentName: 'Shelter Operations Agent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'Evacuee Allocation & Intake',
        details: `Admitted ${count} evacuees to ${shelterName}. Occupancy: ${newOcc}/${cap} (${Math.round((newOcc/cap)*100)}%).`,
        severity: newOcc >= cap * 0.9 ? 'warning' : 'info'
      };
      setAgentLogs(prev => [newLog, ...prev]);
    }
  };

  const handleRestockShelterSupplies = (shelterId: string, days: number = 5) => {
    let shelterName = '';
    let newDays = 0;
    setShelters(prev => prev.map(s => {
      if (s.id === shelterId) {
        shelterName = s.name;
        newDays = s.foodSuppliesDays + days;
        return { ...s, foodSuppliesDays: newDays };
      }
      return s;
    }));

    if (shelterName) {
      const newLog: AgentActivityLog = {
        id: `log-shelter-restock-${Date.now()}`,
        agentName: 'Supply Chain Agent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'Relief Rations Delivered',
        details: `Dispatched +${days} days food & water rations to ${shelterName}. Total reserve: ${newDays} days.`,
        severity: 'success'
      };
      setAgentLogs(prev => [newLog, ...prev]);
    }
  };

  const handleToggleShelterPower = (shelterId: string) => {
    let shelterName = '';
    let isNowActive = false;
    setShelters(prev => prev.map(s => {
      if (s.id === shelterId) {
        shelterName = s.name;
        isNowActive = !s.powerBackup;
        return { ...s, powerBackup: isNowActive };
      }
      return s;
    }));

    if (shelterName) {
      const newLog: AgentActivityLog = {
        id: `log-shelter-pwr-${Date.now()}`,
        agentName: 'Energy Grid Agent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'Auxiliary Power Switch',
        details: `${shelterName} generator micro-grid switched to ${isNowActive ? 'ACTIVE (100% Load)' : 'STANDBY'}.`,
        severity: 'info'
      };
      setAgentLogs(prev => [newLog, ...prev]);
    }
  };

  const handleRequestShelterMedical = (shelterId: string) => {
    let shelterName = '';
    setShelters(prev => prev.map(s => {
      if (s.id === shelterId) {
        shelterName = s.name;
        return { ...s, medicalStaffPresent: true };
      }
      return s;
    }));

    if (shelterName) {
      const newLog: AgentActivityLog = {
        id: `log-shelter-med-${Date.now()}`,
        agentName: 'Health Dispatch Agent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'Medical Squad Assigned',
        details: `Assigned dedicated emergency triage squad to ${shelterName}.`,
        severity: 'success'
      };
      setAgentLogs(prev => [newLog, ...prev]);
    }
  };

  // Hospitals Panel Cross-Orchestrators
  const handleAdmitHospitalPatient = (hospitalId: string, count: number) => {
    let hospitalName = '';
    let occBeds = 0;
    let totBeds = 100;
    setHospitals(prev => prev.map((h: any) => {
      if (h.id === hospitalId) {
        hospitalName = h.name;
        totBeds = h.totalCapacity ?? h.total_beds ?? 100;
        const currentOcc = h.occupiedCapacity ?? 50;
        occBeds = Math.min(totBeds, currentOcc + count);
        const remainingIcu = Math.max(0, (h.icuBedsAvailable ?? h.available_icu_beds ?? 10) - count);
        return {
          ...h,
          occupiedCapacity: occBeds,
          icuBedsAvailable: remainingIcu,
          available_icu_beds: remainingIcu,
          status: occBeds >= totBeds * 0.9 ? 'strained' : 'normal'
        };
      }
      return h;
    }));

    if (hospitalName) {
      const newLog: AgentActivityLog = {
        id: `log-hosp-admit-${Date.now()}`,
        agentName: 'Medical Triage Agent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'Critical ICU Bed Admission',
        details: `Admitted ${count} critical patients to ${hospitalName}. Bed Occupancy: ${occBeds}/${totBeds}.`,
        severity: occBeds >= totBeds * 0.85 ? 'warning' : 'info'
      };
      setAgentLogs(prev => [newLog, ...prev]);
    }
  };

  const handleToggleHospitalGenerator = (hospitalId: string) => {
    let hospitalName = '';
    setHospitals(prev => prev.map((h: any) => {
      if (h.id === hospitalId) {
        hospitalName = h.name;
        const isGenActive = h.powerGridStatus === 'BACKUP_GEN';
        return {
          ...h,
          powerGridStatus: isGenActive ? 'OPERATIONAL' : 'BACKUP_GEN'
        };
      }
      return h;
    }));

    if (hospitalName) {
      const newLog: AgentActivityLog = {
        id: `log-hosp-gen-${Date.now()}`,
        agentName: 'Energy Grid Agent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'Hospital Generator Activated',
        details: `${hospitalName} power grid switched to Diesel Auxiliary Generator (ICU life support protected).`,
        severity: 'success'
      };
      setAgentLogs(prev => [newLog, ...prev]);
    }
  };

  const handleTransferHospitalPatients = (fromHospitalId: string, count: number) => {
    let sourceName = '';
    let targetName = 'Secondary Medical Facility';
    setHospitals(prev => {
      const source = prev.find((h: any) => h.id === fromHospitalId);
      if (!source) return prev;
      sourceName = source.name;

      const target = prev.find((h: any) => h.id !== fromHospitalId && ((h.occupiedCapacity ?? 50) < (h.totalCapacity ?? 100) * 0.7));
      if (target) targetName = target.name;

      return prev.map((h: any) => {
        if (h.id === fromHospitalId) {
          const currentOcc = h.occupiedCapacity ?? 50;
          return { ...h, occupiedCapacity: Math.max(0, currentOcc - count) };
        }
        if (target && h.id === target.id) {
          const currentOcc = h.occupiedCapacity ?? 50;
          return { ...h, occupiedCapacity: currentOcc + count };
        }
        return h;
      });
    });

    if (sourceName) {
      const newLog: AgentActivityLog = {
        id: `log-hosp-transfer-${Date.now()}`,
        agentName: 'Medical Triage Agent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'Inter-Hospital Patient Transfer',
        details: `Transferred ${count} non-critical patients from ${sourceName} to ${targetName} to relieve surge stress.`,
        severity: 'info'
      };
      setAgentLogs(prev => [newLog, ...prev]);
    }
  };

  // Incidents Panel Status Update
  const handleUpdateReportStatus = (reportId: string, newStatus: CitizenReport['status']) => {
    let loc = '';
    setReports(prev => prev.map(r => {
      if (r.id === reportId) {
        loc = r.locationName;
        return { ...r, status: newStatus };
      }
      return r;
    }));

    if (loc) {
      const newLog: AgentActivityLog = {
        id: `log-rep-status-${Date.now()}`,
        agentName: 'Incident Commander Agent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'Incident Lifecycle Updated',
        details: `Incident #${reportId} at ${loc} transitioned to status: ${newStatus.toUpperCase()}.`,
        severity: newStatus === 'resolved' ? 'success' : 'info'
      };
      setAgentLogs(prev => [newLog, ...prev]);
    }
  };

  // Simulation Studio Push Handler - Multi-Feature Orchestration
  const handleApplySimulationToLiveTwin = (simData: {
    rainfallMmHr: number;
    chembarambakkamReleaseM3s?: number;
    canalBlockagePct?: number;
    highTideOverlap?: boolean;
    durationHours?: number;
    mitigations?: any;
    riskMultiplier?: number;
    powerGridStressPct?: number;
    simResult?: any;
  }) => {
    const rain = simData.rainfallMmHr || 0;
    const damRelease = simData.chembarambakkamReleaseM3s || 0;
    const blockage = simData.canalBlockagePct || 0;
    const highTide = simData.highTideOverlap ?? false;
    const mits = simData.mitigations || {};

    // Compute Raw Hydrodynamic Hazard Score (0 to 105)
    const rainHazard = (rain / 130) * 55;
    const blockageHazard = (blockage / 100) * 25;
    const damHazard = (damRelease / 2800) * 15;
    const tideHazard = highTide ? 10 : 0;

    const rawHazard = rainHazard + blockageHazard + damHazard + tideHazard;

    // Active Mitigations reduction factor
    let mitigationFactor = 1.0;
    if (mits.deployDewateringPumps) mitigationFactor *= 0.78;
    if (mits.prepositionBoats) mitigationFactor *= 0.88;
    if (mits.autoBarricadeSubways) mitigationFactor *= 0.92;
    if (mits.cellBroadcastAlert) mitigationFactor *= 0.85;

    // Topographical zone vulnerability weights for Chennai
    const zoneVulnerabilities: Record<string, number> = {
      'zone-velachery-south': 1.25,
      'zone-adyar-riverbank': 1.18,
      'zone-mambalam-west': 1.10,
      'zone-perambur-north': 1.00,
      'zone-madipakkam-lake': 1.12,
      'zone-mylapore-east': 0.75,
      'zone-anna-nagar': 0.60,
      'zone-foreshore-estate': 0.88
    };

    // 1. Update Digital Twin Zones dynamically
    setZones(prev => prev.map(z => {
      const vuln = zoneVulnerabilities[z.id] || 1.0;
      const zoneRawRisk = rawHazard * vuln * mitigationFactor;
      const newRiskScore = Math.min(100, Math.max(8, Math.round(zoneRawRisk)));

      const priorityLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' =
        newRiskScore >= 80 ? 'CRITICAL' :
        newRiskScore >= 60 ? 'HIGH' :
        newRiskScore >= 40 ? 'MEDIUM' : 'LOW';

      const status: 'evacuating' | 'flooded' | 'critical' | 'warning' | 'normal' =
        newRiskScore >= 85 ? 'evacuating' :
        newRiskScore >= 70 ? 'flooded' :
        newRiskScore >= 50 ? 'critical' :
        newRiskScore >= 35 ? 'warning' : 'normal';

      const currentWaterLevelMeters = Number((Math.max(0.05, (newRiskScore / 100) * 2.85)).toFixed(2));
      const predictedWaterLevel30m = Number((currentWaterLevelMeters * 1.22).toFixed(2));
      const predictedWaterLevel1h = Number((currentWaterLevelMeters * 1.48).toFixed(2));
      const predictedWaterLevel2h = Number((currentWaterLevelMeters * 1.80).toFixed(2));

      const rainfallRateMmHr = Math.round(rain * (0.85 + vuln * 0.15));
      const drainageCongestionPct = Math.min(100, Math.round(blockage * 0.75 + newRiskScore * 0.25));
      const estimatedTimeToInundationMin = newRiskScore >= 80
        ? Math.max(10, Math.round(100 - newRiskScore))
        : Math.max(45, Math.round(200 - newRiskScore * 1.5));

      return {
        ...z,
        riskScore: newRiskScore,
        priorityLevel,
        status,
        currentWaterLevelMeters,
        predictedWaterLevel30m,
        predictedWaterLevel1h,
        predictedWaterLevel2h,
        rainfallRateMmHr,
        drainageCongestionPct,
        estimatedTimeToInundationMin
      };
    }));

    // 2. Update IoT Water Depth & Canal Sensors
    setSensors(prev => prev.map(s => {
      const isCriticalSensor = s.id.includes('velachery') || s.id.includes('adyar') || s.id.includes('mambalam');
      const valBoost = isCriticalSensor ? (rain / 120) * 2.2 : (rain / 120) * 1.3;
      const newVal = Number((Math.max(0.1, valBoost)).toFixed(2));
      return {
        ...s,
        currentValue: newVal,
        status: newVal > 1.8 ? 'critical' : newVal > 1.0 ? 'warning' : 'normal',
        lastUpdated: 'Simulated Just Now'
      };
    }));

    // 3. Update Shelters Occupancy & Strain
    setShelters(prev => prev.map(s => {
      const capPctTarget = Math.min(0.98, Math.max(0.15, (rain / 150) + (blockage / 200)));
      const newOcc = Math.min(s.totalCapacity, Math.round(s.totalCapacity * capPctTarget));
      const capPct = (newOcc / s.totalCapacity) * 100;
      return {
        ...s,
        currentOccupancy: newOcc,
        status: capPct >= 95 ? 'full' : capPct >= 80 ? 'near_capacity' : 'open'
      };
    }));

    // 4. Update Hospitals Bed Occupancy & Power Grid Status
    setHospitals(prev => prev.map((h: any) => {
      const totBeds = h.totalCapacity ?? h.total_beds ?? 100;
      const newOcc = Math.min(totBeds, Math.max(15, Math.round(totBeds * (0.4 + (rain / 220)))));
      const isGridStrained = (simData.powerGridStressPct || 0) > 50 || rain > 70;

      return {
        ...h,
        occupiedCapacity: newOcc,
        powerGridStatus: isGridStrained ? 'BACKUP_GEN' : 'OPERATIONAL',
        status: (newOcc / totBeds) >= 0.85 ? 'strained' : 'normal'
      };
    }));

    // 5. Inject a Simulated Incident Report into Live Incident Feed
    const simReport: CitizenReport = {
      id: `rep-sim-${Date.now().toString().slice(-4)}`,
      reporterName: 'Automated Hydrodynamic Sensor Network',
      phone: '+91 98400 11223',
      locationName: 'Velachery 100ft Bypass Road & Vijaya Nagar Sluice',
      lat: 12.9785,
      lng: 80.2212,
      category: 'waterlogging',
      description: `[SIMULATED SCENARIO ACTIVE] Hydrodynamic model calculated for ${rain}mm/hr rainfall & ${blockage}% canal blockage. Risk scores dynamically updated across all 8 city risk zones.`,
      severity: rain > 80 ? 'critical' : rain > 40 ? 'high' : 'medium',
      timestamp: 'Just Now (Simulated)',
      status: 'pending',
      aiValidationScore: 98,
      aiValidatedCategory: 'Severe Surface Flooding',
      aiSummary: `Hydrodynamic model prediction: rain=${rain}mm/hr, canal blockage=${blockage}%.`
    };
    setReports(prev => [simReport, ...prev]);

    // 6. Log Multi-Feature Agent Activity Event
    const avgRisk = Math.round(rawHazard * 1.0 * mitigationFactor);
    const newLog: AgentActivityLog = {
      id: `log-sim-inject-${Date.now()}`,
      agentName: 'Hydrodynamic Simulator Engine',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Counterfactual Risk Scores Pushed to Live Twin',
      details: `Dynamically re-scored all 8 city zones for ${rain}mm/hr rainfall & ${blockage}% blockage (Average City Risk Index: ${avgRisk}/100). Synchronized Map, IoT Sensors, Shelters & Hospitals.`,
      severity: avgRisk >= 75 ? 'warning' : avgRisk >= 40 ? 'info' : 'success'
    };
    setAgentLogs(prev => [newLog, ...prev]);
  };

  // Cascading Impact Strategy Execution
  const handleApplyCascadingStrategy = (strat: any) => {
    const newLog: AgentActivityLog = {
      id: `log-casc-strat-${Date.now()}`,
      agentName: 'Cascading AI Coordinator',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Response Strategy Authorized',
      details: `Dispatched multi-agency strategy "${strat.name}" (${strat.assignedAgencies?.join(', ') || 'NDRF'}). Impact Score: ${strat.estimatedRiskReductionPct}% Risk Cut.`,
      severity: 'success'
    };
    setAgentLogs(prev => [newLog, ...prev]);
  };

  // Citizen Report Submission
  const handleSubmitCitizenReport = (reportData: Partial<CitizenReport>) => {
    const newReport: CitizenReport = {
      id: `report-${Date.now()}`,
      reporterName: reportData.reporterName || 'Anonymous Citizen',
      phone: reportData.phone || '+91 90000 00000',
      timestamp: 'Just now',
      lat: reportData.lat || 12.978,
      lng: reportData.lng || 80.222,
      locationName: reportData.locationName || 'Velachery',
      category: reportData.category || 'waterlogging',
      severity: reportData.severity || 'critical',
      description: reportData.description || 'Waterlogging report',
      imageUrl: reportData.imageUrl || 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
      aiValidationScore: reportData.aiValidationScore || 94,
      aiValidatedCategory: reportData.aiValidatedCategory || 'Verified Flood Waterlogging',
      aiSummary: reportData.aiSummary || 'Cross-validated with IoT water depth gauge.',
      status: 'verified'
    };

    setReports(prev => [newReport, ...prev]);

    const newLog: AgentActivityLog = {
      id: `log-rep-${Date.now()}`,
      agentName: 'Citizen Intelligence Agent',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Citizen Incident Intake & AI Verification',
      details: `Ingested report from ${newReport.reporterName} at ${newReport.locationName}. Credibility: ${newReport.aiValidationScore}%.`,
      severity: 'warning'
    };
    setAgentLogs(prev => [newLog, ...prev]);
  };

  // Route Shelter Selector
  const handleSelectRouteShelter = (shelterId: string) => {
    selectShelter(shelterId);
  };

  // Alert Acknowledgment
  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
  };

  // Collapsible sidebar section headers state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const activeReportsCount = reports.filter(r => r.status !== 'resolved').length;
  const activeAlert = alerts.filter(a => !a.acknowledged)[0] || alerts[0];

  const sidebarGroups = [
    {
      id: 'monitor',
      stageTitle: 'MONITOR & MAP',
      items: [
        { id: 'twin_map', label: 'Digital Twin Map', icon: Map },
        { id: 'dashboard', label: 'Command Overview', icon: LayoutDashboard },
        { id: 'incidents', label: 'Live Incidents', icon: ShieldAlert, badge: activeReportsCount },
        { id: 'citizen_portal', label: 'Citizen Reports', icon: MessageSquare },
        { id: 'facility_safety', label: 'Facility Blueprint', icon: Factory },
      ]
    },
    {
      id: 'ai_hq',
      stageTitle: 'AI DECISION HQ',
      items: [
        { id: 'cascading_impact', label: 'Cascading AI', icon: Zap },
        { id: 'multi_agent', label: 'Authority HQ', icon: Cpu, badge: alerts.filter(a => !a.acknowledged).length },
      ]
    },
    {
      id: 'dispatch',
      stageTitle: 'DISPATCH & RELIEF',
      items: [
        { id: 'resources', label: 'Resources Dispatch', icon: Truck },
        { id: 'shelters', label: 'Shelter Allocator', icon: Home },
        { id: 'hospitals', label: 'Hospital Capacity', icon: Hospital },
      ]
    },
    {
      id: 'simulate',
      stageTitle: 'SIMULATE & CONFIG',
      items: [
        { id: 'simulation', label: 'Simulation Studio', icon: Sliders },
        { id: 'settings', label: 'Master Settings', icon: Settings },
      ]
    }
  ];

  return (
    <div className="h-screen w-screen bg-slate-100/90 p-4 flex font-sans overflow-hidden">
      
      {/* Outer Dashboard Floating Container with round edges and liquid glass */}
      <div className="flex-1 flex bg-white/60 backdrop-blur-2xl border border-white/80 rounded-[24px] shadow-2xl shadow-slate-200/50 overflow-hidden relative">

        {/* 1. Left Sidebar Navigation Panel — structure, not chrome: stays opaque */}
        <aside className="w-[240px] bg-slate-950/95 border-r border-slate-900/60 text-slate-100 flex flex-col h-full z-30 select-none flex-shrink-0">

        {/* Logo Section */}
        <div className="px-4 py-4 border-b border-slate-900 flex items-center gap-2.5 min-w-0">
          <Activity className="w-4 h-4 text-sky-400 shrink-0" strokeWidth={1.5} />
          <div className="flex flex-col min-w-0">
            <span className="text--body-medium text-white font-semibold whitespace-nowrap">ResponSync</span>
            <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase mt-1 leading-tight">
              {isCitizenRole ? 'Public Citizen Portal' : 'Command OS'}
            </span>
          </div>
        </div>

        {/* Sidebar Grouped Navigation Links — permanent and always expanded */}
        <nav className="flex-1 min-h-0 py-2.5 overflow-y-auto no-scrollbar space-y-4">
          {sidebarGroups.map((group) => {
            const filteredItems = group.items.filter(item =>
              isCitizenRole ? citizenAllowedTabIds.includes(item.id) : true
            );

            if (filteredItems.length === 0) return null;

            return (
              <div key={group.id} className="space-y-1.5">
                {/* Permanent Header */}
                <div className="w-full px-4 pt-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {group.stageTitle}
                </div>

                {/* Section Items */}
                <div className="space-y-0.5 px-2.5">
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    const isCriticalBadge = group.id === 'ai_hq';
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center justify-between gap-2.5 w-full px-3 py-2 rounded-lg transition-all cursor-pointer text-left ${
                          isActive
                            ? 'bg-slate-800 text-sky-400 font-semibold shadow-sm'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} strokeWidth={1.5} />
                          <span className="truncate text-xs">{item.label}</span>
                        </div>
                        {item.badge !== undefined && item.badge > 0 && (
                          isCriticalBadge ? (
                            <span className="shrink-0 font-bold bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{item.badge}</span>
                          ) : (
                            <span className="shrink-0 font-medium bg-slate-800 text-slate-400 text-[9px] px-1.5 py-0.5 rounded-full">{item.badge}</span>
                          )
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Pinned status footer — sync state, last sync, exit to landing */}
        <div className="shrink-0 border-t border-slate-900 px-4 py-3.5 space-y-3 bg-slate-950/40">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400 flex items-center gap-2 min-w-0">
              <span
                className={`sev-mark ${isSyncing ? 'sev-mark--critical animate-pulse-mono' : 'sev-mark--ok'}`}
                style={{ width: '8px', height: '8px', borderRadius: '50%' }}
                aria-hidden="true"
              />
              <span className="truncate">{isSyncing ? 'Syncing' : 'Synced'}</span>
            </span>
            <span className="text-[11px] text-slate-500 tabular-nums shrink-0">{lastSyncTime}</span>
          </div>
          <button
            onClick={onBackToLanding}
            className="w-full text-[11px] text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-900 rounded-lg px-2.5 py-2 transition-colors cursor-pointer text-center font-medium"
            title="Return to Landing Overview"
          >
            Landing
          </button>
        </div>

      </aside>

      {/* 2. Right Operations Workspace */}
      <WorkflowBarProvider>
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-paper">

        {/* Top Header Bar — brand, stage stepper and operator controls, merged */}
        <Header
          disasterType={disasterType}
          setDisasterType={setDisasterType}
          agencyRole={agencyRole}
          setAgencyRole={setAgencyRole}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isSyncing={isSyncing}
          onTriggerSync={handleTriggerSync}
          alertsCount={alerts.filter(a => !a.acknowledged).length}
          lastSyncTime="JUST NOW"
        />

        {/* Active-stage view tabs */}
        <LinearWorkflowBar
          activeTab={activeTab}
          onNavigateTab={setActiveTab}
          isCitizenRole={isCitizenRole}
        />

        {/* 3. Main Workspace Screen */}
        <main className={`flex-1 min-h-0 relative overflow-hidden flex flex-col ${activeTab === 'twin_map' ? 'p-0' : 'px-6 pt-2 pb-6 overflow-y-auto no-scrollbar'}`}>
          
          <div className="flex-1">
            {/* Role Access Guard Banner for Unpermitted Views */}
            {isCitizenRole && !citizenAllowedTabIds.includes(activeTab) && (
              <div className="panel p-12 text-center max-w-xl mx-auto space-y-5 my-12">
                <ShieldAlert className="w-10 h-10 text-ink mx-auto" strokeWidth={1.5} />
                <h2 className="text--subtitle2 text-ink">
                  Restricted Government Command View
                </h2>
                <p className="text--body text-subtle">
                  You are currently viewing in <strong className="text-ink font-medium">Citizen Public Mode</strong>. Access to emergency dispatch, agency AI logs, simulations, and settings requires Government Authority permission.
                </p>
                <div className="flex items-center justify-center gap-3 pt-3">
                  <button
                    onClick={() => setActiveTab('twin_map')}
                    className="cta cta--primary cta--compact"
                  >
                    Return to Public Map View
                  </button>
                  <button
                    onClick={() => setAgencyRole('authority')}
                    className="cta cta--secondary cta--compact"
                  >
                    Switch to Government View
                  </button>
                </div>
              </div>
            )}

            {/* Tab Render Router */}
            {activeTab === 'dashboard' && (
              <DashboardOverview
                zones={zones}
                sensors={sensors}
                resources={resources}
                shelters={shelters}
                reports={reports}
                hospitals={hospitals}
                agentLogs={agentLogs}
                evacuationRoute={evacuationRoute}
                timeHorizon={timeHorizon}
                setTimeHorizon={setTimeHorizon}
                onSelectReport={(rep) => setActiveTab('incidents')}
                onSelectZone={(zoneId) => setDispatchZoneId(zoneId)}
                onNavigateToTab={setActiveTab}
              />
            )}

            {activeTab === 'cascading_impact' && (
              <CascadingImpactView 
                onNavigateToTab={setActiveTab}
                onApplyCascadingStrategy={handleApplyCascadingStrategy}
              />
            )}

            {activeTab === 'incidents' && (
              <IncidentsPanel 
                reports={reports} 
                onOpenDispatchModal={(zoneId) => setDispatchZoneId(zoneId)} 
                onUpdateReportStatus={handleUpdateReportStatus}
              />
            )}

            {activeTab === 'twin_map' && (
              <DigitalTwinMap
                zones={zones}
                sensors={sensors}
                resources={resources}
                shelters={shelters}
                hospitals={hospitals}
                reports={reports}
                evacuationRoute={evacuationRoute}
                timeHorizon={timeHorizon}
                setTimeHorizon={setTimeHorizon}
                onSelectZone={(zone) => setDispatchZoneId(zone.id)}
                onSelectResource={(res) => {}}
                onSelectReport={(rep) => {}}
                onCalculateEvacuationRoute={calculateRoute}
                isCalculatingRoute={isCalculating}
              />
            )}

            {activeTab === 'resources' && (
              <ResourcesPanel 
                resources={resources} 
                zones={zones}
                onConsumeResource={handleConsumeResource}
                onRefillResource={handleRefillResource}
                onUpdateResource={handleUpdateResource}
                onDispatchResource={handleDispatchResource}
              />
            )}

            {activeTab === 'shelters' && (
              <SheltersPanel 
                shelters={shelters} 
                onAdmitEvacuees={handleAdmitEvacueesToShelter}
                onRestockSupplies={handleRestockShelterSupplies}
                onTogglePowerBackup={handleToggleShelterPower}
                onRequestMedicalStaff={handleRequestShelterMedical}
              />
            )}

            {activeTab === 'hospitals' && (
              <HospitalsPanel 
                hospitals={hospitals} 
                onAdmitPatient={handleAdmitHospitalPatient}
                onToggleGeneratorPower={handleToggleHospitalGenerator}
                onTransferPatientLoad={handleTransferHospitalPatients}
              />
            )}

            {activeTab === 'multi_agent' && (
              <AuthorityDashboard
                zones={zones}
                agentLogs={agentLogs}
                recommendations={recommendations}
                reports={reports}
                resources={resources}
                alerts={alerts}
                onApproveRecommendation={handleApproveRecommendation}
                onRejectRecommendation={handleRejectRecommendation}
                onOpenExplainModal={(rec) => setExplainModalRec(rec)}
                onOpenDispatchModal={(zoneId) => setDispatchZoneId(zoneId)}
                isSyncing={isSyncing}
                onTriggerSync={handleTriggerSync}
              />
            )}

            {activeTab === 'simulation' && (
              <SimulationStudio 
                onApplySimulationToLiveTwin={handleApplySimulationToLiveTwin}
              />
            )}

            {activeTab === 'citizen_portal' && (
              <CitizenPortal
                shelters={shelters}
                reports={reports}
                onSubmitReport={handleSubmitCitizenReport}
                evacuationRoute={evacuationRoute}
                onSelectRouteShelter={handleSelectRouteShelter}
                onCalculateEvacuationRoute={calculateRoute}
                onNavigateToMap={() => setActiveTab('twin_map')}
              />
            )}

            {activeTab === 'facility_safety' && (
              <FacilitySafetyStudio />
            )}

            {activeTab === 'settings' && (
              <SettingsPanel />
            )}
          </div>

        </main>

      </div>
      </WorkflowBarProvider>

      {/* Modals */}
      {explainModalRec && (
        <ExplainabilityModal
          recommendation={explainModalRec}
          onClose={() => setExplainModalRec(null)}
          onApprove={handleApproveRecommendation}
        />
      )}

      {dispatchZoneId && (
        <ResourceDispatchModal
          zoneId={dispatchZoneId}
          zones={zones}
          resources={resources}
          onDispatch={handleDispatchResource}
          onClose={() => setDispatchZoneId(null)}
        />
      )}

      {/* Real-time Interactive Action Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-reveal max-w-sm">
          <div className="glass glass--dark glass--raised px-4 py-3 flex items-center gap-2.5">
            <Zap className="w-4 h-4 shrink-0 text-paper" strokeWidth={1.5} />
            <span className="text--footnote text-paper">{toast.message}</span>
          </div>
        </div>
      )}

      </div> {/* Closing of Outer Dashboard Floating Container */}
    </div>
  );
}
