import React from 'react';
import {
  Activity,
  RefreshCw,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { DisasterType, AgencyRole } from '../../shared/types';
import { WORKFLOW_STAGES, findWorkflowStage, useWorkflowBar } from './LinearWorkflowBar';

interface HeaderProps {
  disasterType: DisasterType;
  setDisasterType: (type: DisasterType) => void;
  agencyRole: AgencyRole;
  setAgencyRole: (role: AgencyRole) => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isSyncing: boolean;
  onTriggerSync: (preset?: 'normal' | 'moderate' | 'flood') => void;
  alertsCount: number;
  lastSyncTime: string;
  activePreset?: 'normal' | 'moderate' | 'flood';
}

/**
 * The single piece of top chrome: brand + clock, the four-stage workflow
 * stepper, and the operator controls, all on one sticky glass bar.
 */
export const Header: React.FC<HeaderProps> = ({
  agencyRole,
  setAgencyRole,
  activeTab,
  setActiveTab,
  isSyncing,
  onTriggerSync
}) => {
  const [timeString, setTimeString] = React.useState('');
  const { collapsed, toggle } = useWorkflowBar();

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toISOString().substring(11, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isCitizenRole = agencyRole === 'citizen';

  const currentStage = findWorkflowStage(activeTab);
  const currentStageIndex = WORKFLOW_STAGES.findIndex((s) => s.id === currentStage.id);
  const prevStage = currentStageIndex > 0 ? WORKFLOW_STAGES[currentStageIndex - 1] : null;
  const nextStage =
    currentStageIndex < WORKFLOW_STAGES.length - 1 ? WORKFLOW_STAGES[currentStageIndex + 1] : null;
  const activeViewLabel = currentStage.tabs.find((t) => t.id === activeTab)?.label;

  return (
    <header className="sticky top-0 z-40 shrink-0 px-4 pt-3 pb-2">
      <div className="glass flex items-center justify-between gap-3 px-3 py-2">

        {/* Brand, location & live clock */}
        <button
          type="button"
          onClick={() => setActiveTab('twin_map')}
          className="flex items-center gap-2.5 min-w-0 shrink-0 cursor-pointer text-left"
          title="Digital Twin Map"
        >
          <Activity className="w-[18px] h-[18px] text-ink shrink-0" strokeWidth={1.5} />
          <span className="text--body-medium text-ink whitespace-nowrap">ResponSync</span>
          <span className="hidden xl:flex items-center gap-1.5 text--footnote text-muted whitespace-nowrap">
            <span className="w-px h-3.5 bg-black/10" aria-hidden="true" />
            <MapPin className="w-3 h-3" strokeWidth={1.5} />
            <span>Chennai — Velachery</span>
            <span aria-hidden="true">·</span>
            <Clock className="w-3 h-3" strokeWidth={1.5} />
            <span className="tabular-nums">{timeString}</span>
          </span>
        </button>

        {/* Four-stage workflow stepper — flat track, glass segments (never
            glass inside glass). */}
        {!isCitizenRole && (
          <nav
            className="hidden lg:flex min-w-0 shrink items-center gap-0.5 p-1 rounded-full border border-white/60 bg-white/40 overflow-x-auto no-scrollbar"
            aria-label="Workflow stages"
          >
            {WORKFLOW_STAGES.map((stage, idx) => {
              const isCurrent = stage.id === currentStage.id;
              const isCompleted = idx < currentStageIndex;
              const isReached = isCurrent || isCompleted;

              return (
                <React.Fragment key={stage.id}>
                  <button
                    onClick={() => setActiveTab(stage.defaultTab)}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={`glass-seg rounded-full text--footnote uppercase tracking-[0.08em] flex items-center gap-1.5 whitespace-nowrap px-2 py-1.5 2xl:px-2.5 cursor-pointer ${
                      isCurrent
                        ? 'glass-seg--active'
                        : isReached
                          ? 'text-ink hover:bg-white/50'
                          : 'text-muted hover:text-ink hover:bg-white/50'
                    }`}
                    title={stage.subtitle}
                  >
                    <span
                      className={`sev-mark sev-mark--round ${
                        isReached ? 'sev-mark--critical' : 'sev-mark--neutral'
                      }`}
                      aria-hidden="true"
                    />
                    <span className={isCurrent ? 'inline' : 'hidden 2xl:inline'}>
                      {stage.title}
                    </span>
                  </button>

                  {idx < WORKFLOW_STAGES.length - 1 && (
                    <ChevronRight
                      className="w-3 h-3 shrink-0 text-line"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}

        {/* Role, stage navigation & sync */}
        <div className="flex items-center gap-2 shrink-0">

          {/* While the view row is collapsed the header still names the view */}
          {!isCitizenRole && collapsed && activeViewLabel && (
            <span className="badge badge--quiet hidden md:inline-flex max-w-[180px] truncate">
              {activeViewLabel}
            </span>
          )}

          {/* Functional Role Select */}
          <div className="relative">
            <select
              value={agencyRole}
              aria-label="Agency role"
              title="Agency role"
              onChange={async (e) => {
                const newRole = e.target.value as AgencyRole;
                setAgencyRole(newRole);
                try {
                  const resp = await fetch('/api/auth/switch-role', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ role: newRole })
                  });
                  if (resp.ok) {
                    const data = await resp.json();
                    if (data.token) {
                      localStorage.setItem('jwt_token', data.token);
                      localStorage.setItem('user_payload', JSON.stringify(data.user));
                    }
                  }
                } catch (err) {
                  console.warn('JWT role switch sync error:', err);
                }
              }}
              className="text--footnote appearance-none bg-white/50 text-ink border border-white/70 rounded-full pl-3 pr-7 py-1.5 cursor-pointer hover:bg-white/75 focus:border-ink focus:outline-none transition-colors"
            >
              <option value="authority">Disaster HQ</option>
              <option value="fire_rescue">Fire &amp; Rescue</option>
              <option value="police">Police Traffic</option>
              <option value="health_hospitals">Health &amp; Hospitals</option>
            </select>
            <ChevronDown
              className="w-3.5 h-3.5 text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              strokeWidth={1.5}
            />
          </div>

          {/* Stage navigation */}
          {!isCitizenRole && prevStage && (
            <button
              onClick={() => setActiveTab(prevStage.defaultTab)}
              className="hidden sm:flex text-muted hover:text-ink border border-white/70 bg-white/40 hover:bg-white/70 rounded-full p-1.5 transition-colors cursor-pointer"
              title={`Previous Stage: ${prevStage.title}`}
              aria-label={`Previous stage: ${prevStage.title}`}
            >
              <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          )}

          {!isCitizenRole && nextStage && (
            <button
              onClick={() => setActiveTab(nextStage.defaultTab)}
              className="cta cta--secondary cta--mini hidden sm:inline-flex"
              title={`Next Stage: ${nextStage.title}`}
            >
              <span>Next Stage</span>
              <span className="cta__arrow">&rarr;</span>
            </button>
          )}

          {/* Functional Sync AI Loop Trigger Button */}
          <button
            onClick={() => onTriggerSync()}
            disabled={isSyncing}
            className="cta cta--primary cta--mini gap-1.5 disabled:opacity-50"
            title="Trigger Multi-Agent AI Sync Loop"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} strokeWidth={1.5} />
            <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync AI'}</span>
          </button>

          {/* Collapse / expand the view-tab row */}
          {!isCitizenRole && (
            <button
              onClick={toggle}
              aria-expanded={!collapsed}
              className="text-muted hover:text-ink border border-white/70 bg-white/40 hover:bg-white/70 rounded-full p-1.5 transition-colors cursor-pointer"
              title={collapsed ? 'Expand Workflow Views' : 'Minimize Workflow Views'}
            >
              {collapsed ? (
                <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" strokeWidth={1.5} />
              )}
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
