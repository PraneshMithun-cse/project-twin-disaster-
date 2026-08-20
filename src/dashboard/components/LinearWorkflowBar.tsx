import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  Map,
  ShieldAlert,
  MessageSquare,
  Zap,
  Cpu,
  Truck,
  Home,
  Hospital,
  Sliders,
  Settings,
  LayoutDashboard
} from 'lucide-react';

export interface WorkflowStage {
  id: string;
  title: string;
  subtitle: string;
  defaultTab: string;
  tabs: { id: string; label: string; icon: React.FC<{ className?: string }> }[];
}

export const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    id: 'monitor',
    title: 'Monitor & Map',
    subtitle: 'Awareness & Feeds',
    defaultTab: 'twin_map',
    tabs: [
      { id: 'twin_map', label: 'Digital Twin Map', icon: Map },
      { id: 'dashboard', label: 'Command Overview', icon: LayoutDashboard },
      { id: 'incidents', label: 'Live Incidents', icon: ShieldAlert },
      { id: 'citizen_portal', label: 'Citizen Reports', icon: MessageSquare },
    ],
  },
  {
    id: 'ai_hq',
    title: 'AI Decision HQ',
    subtitle: 'Cascading Risks',
    defaultTab: 'cascading_impact',
    tabs: [
      { id: 'cascading_impact', label: 'Cascading AI', icon: Zap },
      { id: 'multi_agent', label: 'Authority HQ', icon: Cpu },
    ],
  },
  {
    id: 'dispatch',
    title: 'Dispatch & Relief',
    subtitle: 'Resources & Evacuation',
    defaultTab: 'resources',
    tabs: [
      { id: 'resources', label: 'Resources Dispatch', icon: Truck },
      { id: 'shelters', label: 'Shelter Allocator', icon: Home },
      { id: 'hospitals', label: 'Hospital Capacity', icon: Hospital },
    ],
  },
  {
    id: 'simulate',
    title: 'Simulate & Control',
    subtitle: 'Hydro Models & Config',
    defaultTab: 'simulation',
    tabs: [
      { id: 'simulation', label: 'Simulation Studio', icon: Sliders },
      { id: 'settings', label: 'Master Settings', icon: Settings },
    ],
  },
];

/** The stage that owns a given view id (falls back to the first stage). */
export const findWorkflowStage = (tabId: string): WorkflowStage =>
  WORKFLOW_STAGES.find((stage) => stage.tabs.some((t) => t.id === tabId)) || WORKFLOW_STAGES[0];

/* ── Collapse state ──────────────────────────────────────────────────
   The stage stepper now lives in the sticky glass Header, while the view
   tabs live here, so the collapse/expand chevron has to drive both. The
   state is shared through context rather than through props so no
   component's public prop contract changes. */

interface WorkflowBarState {
  /** True while the view-tab row is hidden (the old "minimized" state). */
  collapsed: boolean;
  toggle: () => void;
}

const WorkflowBarContext = createContext<WorkflowBarState | null>(null);

const WORKFLOW_BAR_FALLBACK: WorkflowBarState = { collapsed: false, toggle: () => {} };

export const WorkflowBarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = useCallback(() => setCollapsed((v) => !v), []);
  const value = useMemo(() => ({ collapsed, toggle }), [collapsed, toggle]);
  return <WorkflowBarContext.Provider value={value}>{children}</WorkflowBarContext.Provider>;
};

/** Safe outside a provider — reads as permanently expanded. */
export const useWorkflowBar = (): WorkflowBarState =>
  useContext(WorkflowBarContext) ?? WORKFLOW_BAR_FALLBACK;

interface LinearWorkflowBarProps {
  activeTab: string;
  onNavigateTab: (tabId: string) => void;
  isCitizenRole?: boolean;
}

/**
 * Row 3 of the dashboard chrome: the views belonging to the active stage,
 * as a slim left-aligned glass segmented control. The stage stepper itself
 * is rendered by `Header`.
 */
export const LinearWorkflowBar: React.FC<LinearWorkflowBarProps> = ({
  activeTab,
  onNavigateTab,
  isCitizenRole = false,
}) => {
  const { collapsed } = useWorkflowBar();

  const currentStage = findWorkflowStage(activeTab);

  if (isCitizenRole || collapsed) {
    return null;
  }

  return (
    <div className="shrink-0 px-4 pb-2 flex items-center">
      <div
        className="glass glass-pill inline-flex items-center gap-0.5 p-1 max-w-full overflow-x-auto no-scrollbar"
        role="tablist"
        aria-label={`${currentStage.title} views`}
      >
        {currentStage.tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onNavigateTab(tab.id)}
              className={`glass-seg rounded-full text--footnote flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 cursor-pointer ${
                isActive ? 'glass-seg--active' : 'text-subtle hover:text-ink'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
