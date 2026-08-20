import React, { useState, useEffect } from 'react';
import LandingPage from './landing/LandingPage';
import DashboardApp from './dashboard/DashboardApp';
import { AgencyRole } from './shared/types';

export type DashboardTab = 
  | 'dashboard' 
  | 'cascading_impact' 
  | 'incidents' 
  | 'twin_map' 
  | 'resources' 
  | 'shelters' 
  | 'hospitals' 
  | 'multi_agent' 
  | 'simulation' 
  | 'citizen_portal' 
  | 'analytics' 
  | 'facility_safety'
  | 'settings';

interface RouteState {
  view: 'landing' | 'dashboard';
  tab: DashboardTab;
  role: AgencyRole;
}

function getRouteFromPath(path: string): RouteState {
  const cleanPath = path.toLowerCase().replace(/\/$/, '') || '/';

  switch (cleanPath) {
    case '/citizen':
      return { view: 'dashboard', tab: 'twin_map', role: 'citizen' };
    case '/citizen/reports':
      return { view: 'dashboard', tab: 'citizen_portal', role: 'citizen' };
    case '/authority':
    case '/command':
      return { view: 'dashboard', tab: 'multi_agent', role: 'authority' };
    case '/simulation':
      return { view: 'dashboard', tab: 'simulation', role: 'authority' };
    case '/analytics':
    case '/fusion':
      return { view: 'dashboard', tab: 'analytics', role: 'authority' };
    case '/shelters':
      return { view: 'dashboard', tab: 'shelters', role: 'authority' };
    case '/resources':
      return { view: 'dashboard', tab: 'resources', role: 'authority' };
    case '/hospitals':
      return { view: 'dashboard', tab: 'hospitals', role: 'authority' };
    case '/incidents':
      return { view: 'dashboard', tab: 'incidents', role: 'authority' };
    case '/overview':
      return { view: 'dashboard', tab: 'dashboard', role: 'authority' };
    case '/cascading':
      return { view: 'dashboard', tab: 'cascading_impact', role: 'authority' };
    case '/facility':
    case '/facility-safety':
    case '/blueprint':
      return { view: 'dashboard', tab: 'facility_safety', role: 'authority' };
    case '/settings':
      return { view: 'dashboard', tab: 'settings', role: 'authority' };
    case '/dashboard':
    case '/twin':
    case '/map':
      return { view: 'dashboard', tab: 'twin_map', role: 'authority' };
    case '/':
    default:
      return { view: 'landing', tab: 'twin_map', role: 'authority' };
  }
}

export default function App() {
  const [route, setRoute] = useState<RouteState>(() => getRouteFromPath(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => {
      setRoute(getRouteFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string, customRole?: AgencyRole, customTab?: DashboardTab) => {
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    const derived = getRouteFromPath(path);
    setRoute({
      view: derived.view,
      tab: customTab || derived.tab,
      role: customRole || derived.role
    });
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  if (route.view === 'dashboard') {
    return (
      <DashboardApp
        initialTab={route.tab}
        initialRole={route.role}
        onBackToLanding={() => navigateTo('/')}
        onNavigateTab={(tab) => {
          const tabPathMap: Record<string, string> = {
            dashboard: '/overview',
            cascading_impact: '/cascading',
            twin_map: '/dashboard',
            incidents: '/incidents',
            resources: '/resources',
            shelters: '/shelters',
            hospitals: '/hospitals',
            multi_agent: '/authority',
            simulation: '/simulation',
            citizen_portal: '/citizen/reports',
            analytics: '/analytics',
            facility_safety: '/facility',
            settings: '/settings'
          };
          const targetPath = tabPathMap[tab] || '/dashboard';
          if (window.location.pathname !== targetPath) {
            window.history.pushState(null, '', targetPath);
          }
          setRoute(prev => ({ ...prev, view: 'dashboard', tab: tab as DashboardTab }));
        }}
      />
    );
  }

  return (
    <LandingPage
      onLaunchDashboard={(role?: 'authority' | 'citizen', tab?: string) => {
        if (role === 'citizen') {
          navigateTo('/citizen', 'citizen', (tab as DashboardTab) || 'twin_map');
        } else {
          const targetTab = (tab as DashboardTab) || 'twin_map';
          const pathMap: Record<string, string> = {
            twin_map: '/dashboard',
            multi_agent: '/authority',
            dashboard: '/overview'
          };
          navigateTo(pathMap[targetTab] || '/dashboard', 'authority', targetTab);
        }
      }}
    />
  );
}
