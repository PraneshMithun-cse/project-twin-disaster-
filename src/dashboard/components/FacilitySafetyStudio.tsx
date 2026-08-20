import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Factory, MousePointer2, Square, Radio, Flag, Route as RouteIcon, Save, Plus,
  Users, Flame, ClipboardCheck, Loader2, Trash2, AlertTriangle, RefreshCw, Building2
} from 'lucide-react';
import {
  Facility, FacilityBlueprint, FacilityZone, BlueprintSensor, MusterHub, ExitRoute,
  Employee, FacilityIncident, WhatsAppDispatch, HazardClass, FacilityZoneKind
} from '../../shared/facilityTypes';
import * as facilityApi from '../../services/facilityApi';
import BlueprintCanvas, { BlueprintTool, BlueprintSelection, BlueprintLegend } from './facility/BlueprintCanvas';
import EmployeeRosterPanel from './facility/EmployeeRosterPanel';
import AlertConsole from './facility/AlertConsole';

type StudioTab = 'blueprint' | 'roster' | 'alerts' | 'readiness';

const TOOLS: { id: BlueprintTool; label: string; icon: any; hint: string }[] = [
  { id: 'select', label: 'Select', icon: MousePointer2, hint: 'Click to select. Drag sensors and hubs to reposition.' },
  { id: 'zone', label: 'Zone', icon: Square, hint: 'Drag a rectangle to add a shed, store or yard.' },
  { id: 'sensor', label: 'Sensor', icon: Radio, hint: 'Click inside a zone to drop a detector.' },
  { id: 'hub', label: 'Muster hub', icon: Flag, hint: 'Click anywhere to place an assembly point.' },
  { id: 'route', label: 'Exit route', icon: RouteIcon, hint: 'Click a zone, then click its destination hub.' }
];

const HAZARD_OPTIONS: HazardClass[] = ['explosive', 'flammable', 'toxic', 'standard'];
const KIND_OPTIONS: FacilityZoneKind[] = ['production', 'storage', 'chemical', 'office', 'utility', 'open_yard', 'corridor'];
const SENSOR_TYPES: BlueprintSensor['type'][] = ['smoke', 'heat', 'flame', 'gas_leak', 'spark_detector', 'manual_call_point'];

/** Shared field styling — white surface, hairline border, black focus ring. */
const FIELD =
  'w-full bg-paper border border-line px-3 py-2 text--footnote text-ink placeholder:text-muted outline-none focus:border-ink';
const FIELD_LABEL = 'block text--eyebrow text-muted mb-1.5';

const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export default function FacilitySafetyStudio() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [blueprint, setBlueprint] = useState<FacilityBlueprint | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [incident, setIncident] = useState<FacilityIncident | null>(null);
  const [dispatches, setDispatches] = useState<WhatsAppDispatch[]>([]);
  const [readiness, setReadiness] = useState<facilityApi.FacilityReadiness | null>(null);
  const [providerStatus, setProviderStatus] = useState<facilityApi.WhatsAppProviderStatus | null>(null);

  const [tab, setTab] = useState<StudioTab>('blueprint');
  const [tool, setTool] = useState<BlueprintTool>('select');
  const [selection, setSelection] = useState<BlueprintSelection>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newFacility, setNewFacility] = useState({ name: '', industry: '', address: '', safetyOfficer: '', safetyOfficerPhone: '' });

  const facility = useMemo(() => facilities.find(f => f.id === activeId) || null, [facilities, activeId]);

  // ---- data loading -------------------------------------------------------

  const loadFacilityData = useCallback(async (id: string) => {
    if (!id) return;
    const [fac, roster, active, log, ready] = await Promise.all([
      facilityApi.fetchFacility(id),
      facilityApi.fetchEmployees(id),
      facilityApi.fetchActiveIncident(id),
      facilityApi.fetchDispatches(id),
      facilityApi.fetchReadiness(id)
    ]);
    setFacilities(prev => prev.map(f => (f.id === id ? fac : f)));
    setBlueprint(fac.blueprint);
    setEmployees(roster);
    setIncident(active);
    setDispatches(log);
    setReadiness(ready);
    setDirty(false);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [list, provider] = await Promise.all([
          facilityApi.fetchFacilities(),
          facilityApi.fetchProviderStatus()
        ]);
        setFacilities(list);
        setProviderStatus(provider);
        if (list.length) {
          setActiveId(list[0].id);
          await loadFacilityData(list[0].id);
        }
      } catch (err: any) {
        setError(err?.message || 'Could not reach the facility service');
      } finally {
        setLoading(false);
      }
    })();
  }, [loadFacilityData]);

  useEffect(() => {
    if (activeId) loadFacilityData(activeId).catch(e => setError(e?.message));
  }, [activeId, loadFacilityData]);

  // Keep the live incident view fresh while an evacuation is running.
  useEffect(() => {
    if (!activeId || !incident || incident.phase === 'resolved') return;
    const timer = setInterval(() => {
      facilityApi.fetchActiveIncident(activeId).then(setIncident).catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeId, incident]);

  // ---- blueprint editing --------------------------------------------------

  const patchBlueprint = (fn: (bp: FacilityBlueprint) => FacilityBlueprint) => {
    setBlueprint(prev => (prev ? fn(structuredClone(prev)) : prev));
    setDirty(true);
  };

  const handleDrawZone = (rect: { x: number; y: number; w: number; h: number }) => {
    const zone: FacilityZone = {
      id: uid('z'),
      name: `New Zone ${(blueprint?.zones.length || 0) + 1}`,
      kind: 'production',
      hazardClass: 'standard',
      x: Math.round(rect.x), y: Math.round(rect.y),
      w: Math.round(rect.w), h: Math.round(rect.h),
      headcount: 0
    };
    patchBlueprint(bp => ({ ...bp, zones: [...bp.zones, zone] }));
    setSelection({ kind: 'zone', id: zone.id });
    setTool('select');
  };

  const handlePlaceSensor = (point: { x: number; y: number; zoneId: string }) => {
    const sensor: BlueprintSensor = {
      id: uid('sen'),
      name: `Detector ${(blueprint?.sensors.length || 0) + 1}`,
      type: 'smoke',
      zoneId: point.zoneId,
      x: point.x, y: point.y,
      status: 'normal',
      currentValue: 0.3,
      unit: '%obs/m',
      thresholdCritical: 3.5,
      batteryPct: 100,
      lastUpdated: new Date().toISOString()
    };
    patchBlueprint(bp => ({ ...bp, sensors: [...bp.sensors, sensor] }));
    setSelection({ kind: 'sensor', id: sensor.id });
    setTool('select');
  };

  const handlePlaceHub = (point: { x: number; y: number }) => {
    const hub: MusterHub = {
      id: uid('hub'),
      name: `Hub ${String.fromCharCode(65 + (blueprint?.hubs.length || 0))} — Assembly Point`,
      x: point.x, y: point.y,
      capacity: 60,
      safeRadiusM: 40,
      isPrimary: (blueprint?.hubs.length || 0) === 0
    };
    patchBlueprint(bp => ({ ...bp, hubs: [...bp.hubs, hub] }));
    setSelection({ kind: 'hub', id: hub.id });
    setTool('select');
  };

  const handleLinkRoute = (zoneId: string, hubId: string) => {
    if (!blueprint) return;
    const zone = blueprint.zones.find(z => z.id === zoneId);
    const hub = blueprint.hubs.find(h => h.id === hubId);
    if (!zone || !hub) return;

    const start = { x: zone.x + zone.w / 2, y: zone.y + zone.h / 2 };
    const route: ExitRoute = {
      id: uid('rt'),
      name: `${zone.name} → ${hub.name.replace(/^Hub /, '')}`,
      fromZoneId: zoneId,
      toHubId: hubId,
      waypoints: [{ x: Math.round((start.x + hub.x) / 2), y: Math.round((start.y + hub.y) / 2) }],
      widthM: 3,
      distanceM: Math.round(Math.hypot(hub.x - start.x, hub.y - start.y)),
      isPrimary: !blueprint.routes.some(r => r.fromZoneId === zoneId && r.isPrimary)
    };
    patchBlueprint(bp => ({ ...bp, routes: [...bp.routes, route] }));
    setSelection({ kind: 'route', id: route.id });
    setTool('select');
  };

  const handleMoveSensor = (sensorId: string, point: { x: number; y: number; zoneId: string }) =>
    patchBlueprint(bp => ({
      ...bp,
      sensors: bp.sensors.map(s =>
        s.id === sensorId ? { ...s, x: point.x, y: point.y, zoneId: point.zoneId || s.zoneId } : s
      )
    }));

  const handleMoveHub = (hubId: string, point: { x: number; y: number }) =>
    patchBlueprint(bp => ({
      ...bp,
      hubs: bp.hubs.map(h => (h.id === hubId ? { ...h, x: point.x, y: point.y } : h))
    }));

  const deleteSelected = () => {
    if (!selection) return;
    patchBlueprint(bp => {
      if (selection.kind === 'zone') {
        return {
          ...bp,
          zones: bp.zones.filter(z => z.id !== selection.id),
          sensors: bp.sensors.filter(s => s.zoneId !== selection.id),
          routes: bp.routes.filter(r => r.fromZoneId !== selection.id)
        };
      }
      if (selection.kind === 'sensor') return { ...bp, sensors: bp.sensors.filter(s => s.id !== selection.id) };
      if (selection.kind === 'hub') {
        return {
          ...bp,
          hubs: bp.hubs.filter(h => h.id !== selection.id),
          routes: bp.routes.filter(r => r.toHubId !== selection.id)
        };
      }
      return { ...bp, routes: bp.routes.filter(r => r.id !== selection.id) };
    });
    setSelection(null);
  };

  const handleSaveBlueprint = async () => {
    if (!facility || !blueprint) return;
    setSaving(true);
    setError(null);
    try {
      await facilityApi.saveBlueprint(facility.id, blueprint);
      await loadFacilityData(facility.id);
    } catch (err: any) {
      setError(err?.message || 'Blueprint save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFacility = async () => {
    if (!newFacility.name.trim()) {
      setError('Give the facility a name');
      return;
    }
    try {
      const created = await facilityApi.createFacility(newFacility);
      setFacilities(prev => [...prev, created]);
      setActiveId(created.id);
      setShowCreate(false);
      setNewFacility({ name: '', industry: '', address: '', safetyOfficer: '', safetyOfficerPhone: '' });
      setTool('zone');
      setTab('blueprint');
    } catch (err: any) {
      setError(err?.message || 'Could not create facility');
    }
  };

  const handleDeleteFacility = async () => {
    if (!facility) return;
    await facilityApi.deleteFacility(facility.id);
    const remaining = facilities.filter(f => f.id !== facility.id);
    setFacilities(remaining);
    setActiveId(remaining[0]?.id || '');
    if (!remaining.length) setBlueprint(null);
  };

  // ---- selection inspector ------------------------------------------------

  const renderInspector = () => {
    if (!blueprint || !selection) {
      return (
        <p className="text--footnote text-subtle leading-relaxed">
          {TOOLS.find(t => t.id === tool)?.hint}
          <br /><br />
          Double-click any detector on the plan to fire it immediately.
        </p>
      );
    }

    const input = FIELD;
    const label = FIELD_LABEL;

    if (selection.kind === 'zone') {
      const zone = blueprint.zones.find(z => z.id === selection.id);
      if (!zone) return null;
      const patch = (p: Partial<FacilityZone>) =>
        patchBlueprint(bp => ({ ...bp, zones: bp.zones.map(z => (z.id === zone.id ? { ...z, ...p } : z)) }));
      return (
        <div className="space-y-3">
          <div><span className={label}>Zone name</span>
            <input className={input} value={zone.name} onChange={e => patch({ name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><span className={label}>Kind</span>
              <select className={input} value={zone.kind} onChange={e => patch({ kind: e.target.value as FacilityZoneKind })}>
                {KIND_OPTIONS.map(k => <option key={k} value={k}>{k.replace('_', ' ')}</option>)}
              </select></div>
            <div><span className={label}>Hazard class</span>
              <select className={input} value={zone.hazardClass} onChange={e => patch({ hazardClass: e.target.value as HazardClass })}>
                {HAZARD_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
              </select></div>
            <div><span className={label}>Headcount</span>
              <input type="number" className={`${input} tabular-nums`} value={zone.headcount} onChange={e => patch({ headcount: Number(e.target.value) })} /></div>
            <div><span className={label}>Width (m)</span>
              <input type="number" className={`${input} tabular-nums`} value={zone.w} onChange={e => patch({ w: Number(e.target.value) })} /></div>
          </div>
          <div><span className={label}>Notes</span>
            <textarea rows={3} className={input} value={zone.notes || ''} onChange={e => patch({ notes: e.target.value })} /></div>
        </div>
      );
    }

    if (selection.kind === 'sensor') {
      const sensor = blueprint.sensors.find(s => s.id === selection.id);
      if (!sensor) return null;
      const patch = (p: Partial<BlueprintSensor>) =>
        patchBlueprint(bp => ({ ...bp, sensors: bp.sensors.map(s => (s.id === sensor.id ? { ...s, ...p } : s)) }));
      return (
        <div className="space-y-3">
          <div><span className={label}>Detector name</span>
            <input className={input} value={sensor.name} onChange={e => patch({ name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><span className={label}>Type</span>
              <select className={input} value={sensor.type} onChange={e => patch({ type: e.target.value as BlueprintSensor['type'] })}>
                {SENSOR_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select></div>
            <div><span className={label}>Zone</span>
              <select className={input} value={sensor.zoneId} onChange={e => patch({ zoneId: e.target.value })}>
                {blueprint.zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select></div>
            <div><span className={label}>Critical threshold</span>
              <input type="number" className={`${input} tabular-nums`} value={sensor.thresholdCritical} onChange={e => patch({ thresholdCritical: Number(e.target.value) })} /></div>
            <div><span className={label}>Unit</span>
              <input className={input} value={sensor.unit} onChange={e => patch({ unit: e.target.value })} /></div>
          </div>
        </div>
      );
    }

    if (selection.kind === 'hub') {
      const hub = blueprint.hubs.find(h => h.id === selection.id);
      if (!hub) return null;
      const patch = (p: Partial<MusterHub>) =>
        patchBlueprint(bp => ({ ...bp, hubs: bp.hubs.map(h => (h.id === hub.id ? { ...h, ...p } : h)) }));
      return (
        <div className="space-y-3">
          <div><span className={label}>Hub name</span>
            <input className={input} value={hub.name} onChange={e => patch({ name: e.target.value })} /></div>
          <div><span className={label}>Landmark told to employees</span>
            <input className={input} value={hub.landmark || ''} onChange={e => patch({ landmark: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><span className={label}>Capacity</span>
              <input type="number" className={`${input} tabular-nums`} value={hub.capacity} onChange={e => patch({ capacity: Number(e.target.value) })} /></div>
            <div><span className={label}>Safe radius (m)</span>
              <input type="number" className={`${input} tabular-nums`} value={hub.safeRadiusM} onChange={e => patch({ safeRadiusM: Number(e.target.value) })} /></div>
          </div>
          <label className="flex items-center gap-2 text--footnote text-near">
            <input type="checkbox" className="accent-black" checked={hub.isPrimary} onChange={e => patch({ isPrimary: e.target.checked })} />
            Primary assembly point
          </label>
        </div>
      );
    }

    const route = blueprint.routes.find(r => r.id === selection.id);
    if (!route) return null;
    const patch = (p: Partial<ExitRoute>) =>
      patchBlueprint(bp => ({ ...bp, routes: bp.routes.map(r => (r.id === route.id ? { ...r, ...p } : r)) }));
    return (
      <div className="space-y-3">
        <div><span className={label}>Route name</span>
          <input className={input} value={route.name} onChange={e => patch({ name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><span className={label}>Distance (m)</span>
            <input type="number" className={`${input} tabular-nums`} value={route.distanceM} onChange={e => patch({ distanceM: Number(e.target.value) })} /></div>
          <div><span className={label}>Width (m)</span>
            <input type="number" className={`${input} tabular-nums`} value={route.widthM} onChange={e => patch({ widthM: Number(e.target.value) })} /></div>
        </div>
        <label className="flex items-center gap-2 text--footnote text-near">
          <input type="checkbox" className="accent-black" checked={route.isPrimary} onChange={e => patch({ isPrimary: e.target.checked })} />
          Primary egress for this zone
        </label>
      </div>
    );
  };

  // ---- render -------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-muted gap-2 text--body">
        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} /> Loading facility blueprints…
      </div>
    );
  }

  const fireZoneId = incident && incident.phase !== 'resolved' ? incident.zoneId : undefined;
  const fireSensor = fireZoneId ? blueprint?.sensors.find(s => s.id === incident!.sensorId) : undefined;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="panel p-6 flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text--eyebrow text-muted">Industrial Safety</span>
            <span className="flex items-center gap-2 text--eyebrow">
              <span className={providerStatus?.live ? 'sev-mark sev-mark--ok' : 'sev-mark sev-mark--info'} />
              <span className={providerStatus?.live ? 'sev-text--ok' : 'sev-text--info'}>
                WhatsApp {providerStatus?.live ? `Live via ${providerStatus.provider}` : 'Simulation mode'}
              </span>
            </span>
          </div>
          <h2 className="text--subtitle2 font-light text-ink">
            Facility Safety Blueprint &amp; WhatsApp Evacuation
          </h2>
          <p className="text--footnote text-subtle max-w-2xl">
            Draw the plant floor plan, place detectors and muster hubs, import the employee register,
            and drive the full fire response: sensor trips → every employee is messaged → rescue team
            arrives at a hub → everyone is re-directed to that hub.
          </p>
        </div>
        <div className="w-10 h-10 border border-line flex items-center justify-center text-ink shrink-0">
          <Factory className="w-[18px] h-[18px]" strokeWidth={1.5} />
        </div>
      </div>

      {/* Facility selector */}
      <div className="panel p-4 flex items-center gap-3 flex-wrap">
        <Building2 className="w-4 h-4 text-muted" strokeWidth={1.5} />
        <select
          value={activeId}
          onChange={e => setActiveId(e.target.value)}
          className="bg-paper border border-line px-3 py-2 text--footnote text-ink outline-none focus:border-ink min-w-[280px]"
        >
          {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          {facilities.length === 0 && <option value="">No facilities yet</option>}
        </select>
        {facility && (
          <span className="text--footnote text-muted truncate max-w-md">{facility.address}</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => activeId && loadFacilityData(activeId)}
            className="cta cta--secondary cta--mini flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" strokeWidth={1.5} /> Refresh
          </button>
          <button
            onClick={() => setShowCreate(v => !v)}
            className="cta cta--primary cta--mini flex items-center gap-1.5"
          >
            <Plus className="w-3 h-3" strokeWidth={1.5} /> New facility
          </button>
          {facility && facilities.length > 1 && (
            <button
              onClick={handleDeleteFacility}
              aria-label="Delete facility"
              className="cta cta--secondary cta--mini"
            >
              <Trash2 className="w-3 h-3" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="panel p-4 space-y-3">
          <h3 className="text--body-medium text-ink">Create a new facility service</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input placeholder="Facility name (e.g. Sai Fireworks)" value={newFacility.name}
              onChange={e => setNewFacility({ ...newFacility, name: e.target.value })}
              className={FIELD} />
            <input placeholder="Industry" value={newFacility.industry}
              onChange={e => setNewFacility({ ...newFacility, industry: e.target.value })}
              className={FIELD} />
            <input placeholder="Address" value={newFacility.address}
              onChange={e => setNewFacility({ ...newFacility, address: e.target.value })}
              className={FIELD} />
            <input placeholder="Safety officer" value={newFacility.safetyOfficer}
              onChange={e => setNewFacility({ ...newFacility, safetyOfficer: e.target.value })}
              className={FIELD} />
            <input placeholder="Safety officer phone" value={newFacility.safetyOfficerPhone}
              onChange={e => setNewFacility({ ...newFacility, safetyOfficerPhone: e.target.value })}
              className={FIELD} />
            <button onClick={handleCreateFacility} className="cta cta--primary cta--compact">
              Create &amp; start drawing
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text--footnote text-ink panel--wash p-3 sev-row--critical">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={1.5} />
          <span><span className="sev-text--critical">Error — </span>{error}</span>
        </div>
      )}

      {/* Sub tabs */}
      <div className="flex items-center gap-6 border-b border-line">
        {([
          { id: 'blueprint', label: 'Blueprint Studio', icon: Square },
          { id: 'roster', label: `Employees (${employees.length})`, icon: Users },
          { id: 'alerts', label: 'Alert & Rescue Console', icon: Flame },
          { id: 'readiness', label: 'Readiness Audit', icon: ClipboardCheck }
        ] as { id: StudioTab; label: string; icon: any }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 py-3 -mb-px text--footnote border-b-2 transition-colors ${
              tab === t.id
                ? 'border-ink text-ink font-medium'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" strokeWidth={1.5} /> {t.label}
          </button>
        ))}
        {incident && incident.phase !== 'resolved' && (
          <span className="ml-auto mb-2 badge badge--critical">
            {incident.isDrill ? 'Drill' : 'Fire'} active — {incident.zoneName}
          </span>
        )}
      </div>

      {!facility || !blueprint ? (
        <div className="panel p-10 text-center text--body text-muted">
          No facility selected. Create one to start drawing a blueprint.
        </div>
      ) : tab === 'blueprint' ? (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">
          <div className="panel">
            <div className="p-3 border-b border-line flex items-center gap-2 flex-wrap">
              {TOOLS.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTool(t.id); setSelection(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text--eyebrow border transition-colors ${
                    tool === t.id
                      ? 'bg-ink border-ink text-paper'
                      : 'bg-paper border-line text-subtle hover:border-muted hover:text-ink'
                  }`}
                >
                  <t.icon className="w-3 h-3" strokeWidth={1.5} /> {t.label}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-3">
                {dirty && (
                  <span className="flex items-center gap-1.5 text--footnote">
                    <span className="sev-mark sev-mark--advisory" />
                    <span className="sev-text--advisory">Unsaved changes</span>
                  </span>
                )}
                <button
                  onClick={handleSaveBlueprint}
                  disabled={!dirty || saving}
                  className="cta cta--primary cta--mini flex items-center gap-1.5 disabled:opacity-30"
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.5} /> : <Save className="w-3 h-3" strokeWidth={1.5} />} Save blueprint
                </button>
              </div>
            </div>
            <div className="aspect-[8/5] w-full">
              <BlueprintCanvas
                blueprint={blueprint}
                tool={tool}
                selection={selection}
                onSelect={setSelection}
                onDrawZone={handleDrawZone}
                onPlaceSensor={handlePlaceSensor}
                onPlaceHub={handlePlaceHub}
                onLinkRoute={handleLinkRoute}
                onMoveSensor={handleMoveSensor}
                onMoveHub={handleMoveHub}
                fireZoneId={fireZoneId}
                firePoint={fireSensor ? { x: fireSensor.x, y: fireSensor.y } : undefined}
                rescueHubId={incident?.rescue?.hubId}
                onTriggerSensor={sensorId => {
                  if (dirty) { setError('Save the blueprint before firing a detector'); return; }
                  facilityApi
                    .triggerSensor(facility.id, sensorId, { actor: 'Blueprint double-click' })
                    .then(() => loadFacilityData(facility.id))
                    .catch(err => setError(err?.message));
                }}
              />
            </div>
            <div className="p-3 border-t border-line">
              <BlueprintLegend />
            </div>
          </div>

          <div className="panel p-4 space-y-4 h-fit">
            <div className="flex items-center justify-between">
              <h3 className="text--body-medium text-ink capitalize">
                {selection ? `${selection.kind} properties` : 'Inspector'}
              </h3>
              {selection && (
                <button
                  onClick={deleteSelected}
                  aria-label="Delete selection"
                  className="p-1.5 border border-line text-ink hover:border-ink transition-colors"
                >
                  <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                </button>
              )}
            </div>
            {renderInspector()}
            <div className="pt-3 border-t border-line grid grid-cols-2 gap-px bg-line">
              {[
                { label: 'Zones', value: blueprint.zones.length },
                { label: 'Detectors', value: blueprint.sensors.length },
                { label: 'Hubs', value: blueprint.hubs.length },
                { label: 'Routes', value: blueprint.routes.length }
              ].map(stat => (
                <div key={stat.label} className="bg-paper p-3">
                  <div className="text--subtitle3 font-light text-ink tabular-nums">{stat.value}</div>
                  <div className="text--eyebrow text-muted mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : tab === 'roster' ? (
        <EmployeeRosterPanel
          facility={facility}
          employees={employees}
          providerLive={!!providerStatus?.live}
          onRosterChanged={() => loadFacilityData(facility.id)}
        />
      ) : tab === 'alerts' ? (
        <div className="space-y-4">
          <div className="panel p-3">
            <div className="aspect-[8/5] w-full max-h-[420px]">
              <BlueprintCanvas
                blueprint={blueprint}
                tool="select"
                selection={null}
                onSelect={() => undefined}
                readOnly
                fireZoneId={fireZoneId}
                firePoint={fireSensor ? { x: fireSensor.x, y: fireSensor.y } : undefined}
                rescueHubId={incident?.rescue?.hubId}
              />
            </div>
            <div className="pt-3 mt-3 border-t border-line">
              <BlueprintLegend />
            </div>
          </div>
          <AlertConsole
            facility={facility}
            employees={employees}
            incident={incident}
            dispatches={dispatches}
            providerLive={!!providerStatus?.live}
            onRefresh={() => loadFacilityData(facility.id)}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Employees on roster', value: readiness?.employeeCount ?? 0 },
              { label: 'WhatsApp reachable', value: readiness?.reachableCount ?? 0 },
              { label: 'Detectors installed', value: readiness?.sensorCount ?? 0 },
              { label: 'Muster hubs', value: readiness?.hubCount ?? 0 }
            ].map(stat => (
              <div key={stat.label} className="panel p-5">
                <div className="text--subtitle1 font-light text-ink tabular-nums leading-none">{stat.value}</div>
                <div className="text--eyebrow text-muted mt-3">{stat.label}</div>
              </div>
            ))}
          </div>

          {(readiness?.zonesWithoutSensor.length || readiness?.zonesWithoutRoute.length) ? (
            <div className="panel p-4 space-y-2 sev-row--critical">
              <h3 className="text--body-medium text-ink flex items-center gap-2">
                <span className="sev-mark sev-mark--critical" />
                Gaps in the evacuation plan — Critical
              </h3>
              {readiness!.zonesWithoutSensor.length > 0 && (
                <p className="text--footnote text-near">
                  No detector covering: {readiness!.zonesWithoutSensor.join(', ')}
                </p>
              )}
              {readiness!.zonesWithoutRoute.length > 0 && (
                <p className="text--footnote text-near">
                  No egress route defined for: {readiness!.zonesWithoutRoute.join(', ')}
                </p>
              )}
            </div>
          ) : (
            <div className="panel p-4 flex items-center gap-2 text--footnote">
              <span className="sev-mark sev-mark--ok" />
              <span className="sev-text--ok">OK —</span>
              <span className="text-subtle">Every occupied zone has at least one detector and a defined egress route.</span>
            </div>
          )}

          <div className="panel">
            <div className="p-4 border-b border-line">
              <h3 className="text--body-medium text-ink">Zone-by-zone coverage</h3>
            </div>
            <table className="w-full text-left">
              <thead className="bg-wash">
                <tr className="text--eyebrow text-muted">
                  <th className="px-4 py-2.5 font-medium">Zone</th>
                  <th className="px-4 py-2.5 font-medium">Hazard</th>
                  <th className="px-4 py-2.5 font-medium">Planned pax</th>
                  <th className="px-4 py-2.5 font-medium">On roster</th>
                  <th className="px-4 py-2.5 font-medium">Detectors</th>
                  <th className="px-4 py-2.5 font-medium">Egress</th>
                </tr>
              </thead>
              <tbody>
                {(readiness?.zoneCoverage || []).map(z => (
                  <tr key={z.zoneId} className="border-t border-line">
                    <td className="px-4 py-2.5 text--footnote text-ink">{z.zoneName}</td>
                    <td className="px-4 py-2.5 text--eyebrow text-subtle">{z.hazardClass}</td>
                    <td className="px-4 py-2.5 text--footnote text-subtle tabular-nums">{z.plannedHeadcount}</td>
                    <td className="px-4 py-2.5 text--footnote text-subtle tabular-nums">{z.rosterCount}</td>
                    <td className="px-4 py-2.5 text--footnote">
                      <span className="flex items-center gap-2">
                        <span className={`sev-mark ${z.sensorCount === 0 ? 'sev-mark--critical' : 'sev-mark--ok'}`} />
                        <span className={`tabular-nums ${z.sensorCount === 0 ? 'sev-text--critical' : 'sev-text--ok'}`}>
                          {z.sensorCount}
                        </span>
                        {z.sensorCount === 0 && <span className="sev-text--critical">NONE</span>}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text--footnote">
                      <span className="flex items-center gap-2">
                        <span className={`sev-mark ${z.hasEgressRoute ? 'sev-mark--ok' : 'sev-mark--critical'}`} />
                        <span className={z.hasEgressRoute ? 'sev-text--ok' : 'sev-text--critical'}>
                          {z.hasEgressRoute ? 'DEFINED' : 'MISSING'}
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
