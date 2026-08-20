import React, { useMemo, useState } from 'react';
import {
  Flame, Radio, Truck, ShieldCheck, MessageSquare, Clock,
  AlertTriangle, Loader2, PhoneCall, X
} from 'lucide-react';
import {
  Facility, FacilityIncident, WhatsAppDispatch, Employee, BlueprintSensor
} from '../../../shared/facilityTypes';
import * as facilityApi from '../../../services/facilityApi';

interface AlertConsoleProps {
  facility: Facility;
  employees: Employee[];
  incident: FacilityIncident | null;
  dispatches: WhatsAppDispatch[];
  providerLive: boolean;
  onRefresh: () => void;
}

const PHASE_STEPS: { key: FacilityIncident['phase']; label: string }[] = [
  { key: 'detected', label: 'Sensor triggered' },
  { key: 'evacuating', label: 'Evacuation broadcast' },
  { key: 'rescue_on_scene', label: 'Rescue on scene' },
  { key: 'mustering', label: 'Hub consolidation' },
  { key: 'resolved', label: 'All clear' }
];

const phaseIndex = (phase?: FacilityIncident['phase']) =>
  PHASE_STEPS.findIndex(s => s.key === phase);

/** Composer field — white, hairline border, black focus ring. */
const FIELD =
  'bg-paper border border-line px-3 py-2 text--footnote text-ink placeholder:text-muted outline-none focus:border-ink';

/** Hairline chip. Selected inverts to a solid black fill with white type. */
const chip = (selected: boolean) =>
  `px-3 py-1.5 rounded-[3px] text--eyebrow border transition-colors ${
    selected
      ? 'bg-ink border-ink text-paper'
      : 'bg-paper border-line text-subtle hover:border-muted hover:text-ink'
  }`;

/**
 * Delivery status → mark + the word. Two accents, by meaning:
 *   DELIVERED → green  (`--ok`)   the message reached a human
 *   SIMULATED → blue   (`--info`) informational, no live gateway involved
 *   FAILED    → black  (critical) the gravest state stays maximum-contrast
 * The word is always rendered next to the mark, so the colour never carries
 * the meaning on its own.
 */
const dispatchStatus = (status: WhatsAppDispatch['status']) => {
  if (status === 'failed') return { mark: 'sev-mark--critical', text: 'sev-text--critical', word: 'FAILED' };
  if (status === 'simulated') return { mark: 'sev-mark--info', text: 'sev-text--info', word: 'SIMULATED' };
  return { mark: 'sev-mark--ok', text: 'sev-text--ok', word: 'DELIVERED' };
};

/** 0.25s hue transition for labels whose colour changes with state. */
const HUE = 'transition-colors duration-[250ms] ease-[cubic-bezier(.23,1,.32,1)]';

export default function AlertConsole({
  facility,
  employees,
  incident,
  dispatches,
  providerLive,
  onRefresh
}: AlertConsoleProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDrill, setIsDrill] = useState(false);
  const [rescueHubId, setRescueHubId] = useState(facility.blueprint.hubs[0]?.id || '');
  const [teamName, setTeamName] = useState('Sivakasi Fire & Rescue Station');
  const [vehicleCount, setVehicleCount] = useState(2);
  const [contactNumber, setContactNumber] = useState('101');
  const [previewDispatch, setPreviewDispatch] = useState<WhatsAppDispatch | null>(null);

  const active = incident && incident.phase !== 'resolved' ? incident : null;
  const currentStep = phaseIndex(incident?.phase);

  const reachable = employees.filter(e => e.whatsappOptIn).length;

  const incidentDispatches = useMemo(
    () => dispatches.filter(d => !incident || d.incidentId === incident.id || d.stage === 'test'),
    [dispatches, incident]
  );

  const stageCounts = useMemo(() => {
    const counts = { evacuate: 0, muster: 0, all_clear: 0, test: 0 } as Record<string, number>;
    incidentDispatches.forEach(d => { counts[d.stage] = (counts[d.stage] || 0) + 1; });
    return counts;
  }, [incidentDispatches]);

  const run = async (key: string, fn: () => Promise<any>) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
      onRefresh();
    } catch (err: any) {
      setError(err?.message || 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  const handleTrigger = (sensor: BlueprintSensor) =>
    run(`trigger-${sensor.id}`, () =>
      facilityApi.triggerSensor(facility.id, sensor.id, { isDrill, actor: 'Facility Alert Console' })
    );

  const handleRescue = () =>
    run('rescue', () =>
      facilityApi.recordRescueArrival(incident!.id, {
        hubId: rescueHubId,
        teamName,
        vehicleCount,
        contactNumber,
        actor: 'Incident Commander'
      })
    );

  const handleResolve = () => run('resolve', () => facilityApi.resolveIncident(incident!.id, true));

  const handleAck = (employeeId: string) =>
    run(`ack-${employeeId}`, () => facilityApi.acknowledgeEmployee(incident!.id, employeeId));

  return (
    <div className="space-y-4">
      {/* Live incident strip */}
      <div className={`panel p-6 ${active ? 'sev-row--critical' : ''}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Live incident is critical → black. "Plant normal" is an
                  operational all-clear → green. */}
              <span className={`badge ${active ? 'badge--critical' : 'badge--safe'}`}>
                {active ? (incident!.isDrill ? 'Drill in progress' : 'Live fire incident') : 'Plant normal'}
              </span>
              {/* Gateway live = operational (green); simulation = informational (blue). */}
              <span className="flex items-center gap-2 text--eyebrow">
                <span className={`sev-mark ${providerLive ? 'sev-mark--ok' : 'sev-mark--info'}`} />
                <span className={`${HUE} ${providerLive ? 'sev-text--ok' : 'sev-text--info'}`}>
                  WhatsApp gateway {providerLive ? 'Live' : 'Simulation'}
                </span>
              </span>
            </div>
            <h3 className="text--subtitle2 font-light text-ink">
              {active
                ? `${incident!.zoneName} — ${incident!.sensorName}`
                : 'No active incident. Sensors are being polled.'}
            </h3>
            {active && (
              <p className="text--footnote text-subtle">
                Severity <span className="sev-text--critical uppercase">{incident!.severity}</span> ·
                {' '}reading <span className="tabular-nums text-near">{incident!.triggerValue}</span> · started{' '}
                <span className="tabular-nums text-near">{new Date(incident!.startedAt).toLocaleTimeString()}</span> ·
                {' '}<span className="tabular-nums text-near">{reachable}</span> employees notified
              </p>
            )}
          </div>
          {active && (
            <button
              onClick={handleResolve}
              disabled={busy === 'resolve'}
              className="cta cta--primary cta--compact shrink-0 flex items-center gap-2 disabled:opacity-40"
            >
              {busy === 'resolve' ? <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} /> : <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />}
              Declare all clear
            </button>
          )}
        </div>

        {/* Phase tracker */}
        {incident && (
          <div className="mt-6 flex items-start gap-2">
            {PHASE_STEPS.map((step, i) => {
              const reached = currentStep >= i;
              return (
                <div key={step.key} className="flex-1">
                  <div className={reached ? 'h-0.5 bg-ink' : 'h-0.5 bg-line'} />
                  <div className={`mt-2 text--eyebrow ${reached ? 'text-ink' : 'text-muted'}`}>
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 text--footnote text-near panel--wash p-3 sev-row--critical">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={1.5} />
          <span><span className="sev-text--critical">Error — </span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Sensor trigger board */}
        <div className="panel">
          <div className="p-4 border-b border-line flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text--subtitle3 text-ink flex items-center gap-2">
              <Radio className="w-4 h-4 text-ink" strokeWidth={1.5} /> Blueprint Sensor Grid
            </h3>
            <label className={`${chip(isDrill)} cursor-pointer inline-flex items-center gap-2`}>
              <input
                type="checkbox"
                checked={isDrill}
                onChange={e => setIsDrill(e.target.checked)}
                className="sr-only"
              />
              Fire as drill
            </label>
          </div>
          <div className="max-h-[380px] overflow-y-auto">
            {facility.blueprint.sensors.map(sensor => {
              const zone = facility.blueprint.zones.find(z => z.id === sensor.zoneId);
              const triggered = sensor.status === 'triggered';
              return (
                <div key={sensor.id} className="p-3 border-b border-line last:border-b-0 flex items-center justify-between gap-3 hover:bg-wash">
                  <div className="min-w-0">
                    <div className="text--footnote text-ink truncate">{sensor.name}</div>
                    <div className="text--footnote text-muted truncate tabular-nums">
                      {zone?.name} · {sensor.type.replace('_', ' ')} · {sensor.currentValue}{sensor.unit} /
                      crit {sensor.thresholdCritical}{sensor.unit} · batt {sensor.batteryPct}%
                    </div>
                  </div>
                  <button
                    onClick={() => handleTrigger(sensor)}
                    disabled={!!busy || !!active}
                    title={active ? 'Resolve the open incident before triggering another sensor' : 'Simulate this detector firing'}
                    className={`shrink-0 inline-flex items-center gap-1.5 ${
                      triggered
                        ? 'badge badge--critical'
                        : 'cta cta--primary cta--mini disabled:opacity-30'
                    }`}
                  >
                    {busy === `trigger-${sensor.id}` ? <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.5} /> : <Flame className="w-3 h-3" strokeWidth={1.5} />}
                    {triggered ? 'Triggered' : 'Trigger'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rescue arrival + timeline */}
        <div className="space-y-4">
          {/* Broadcast composer — this form is the message that goes out to every employee. */}
          <div className="panel p-5 space-y-4">
            <h3 className="text--subtitle3 text-ink flex items-center gap-2">
              <Truck className="w-4 h-4 text-ink" strokeWidth={1.5} /> Rescue Team Arrival
            </h3>
            <p className="text--footnote text-subtle">
              Mark the hub on the blueprint where the rescue team has physically staged. Every
              employee is immediately re-directed to that hub over WhatsApp.
            </p>

            {/* Channel indicator — WhatsApp is the only wired gateway in this module. */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text--eyebrow text-muted">Channel</span>
              <span className={chip(true)}>WhatsApp</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={rescueHubId}
                onChange={e => setRescueHubId(e.target.value)}
                className={`col-span-2 ${FIELD}`}
              >
                {facility.blueprint.hubs.map(hub => (
                  <option key={hub.id} value={hub.id}>{hub.name}</option>
                ))}
              </select>
              <input
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="Responding team"
                className={`col-span-2 ${FIELD}`}
              />
              <input
                type="number"
                min={1}
                value={vehicleCount}
                onChange={e => setVehicleCount(Number(e.target.value))}
                placeholder="Vehicles"
                className={`${FIELD} tabular-nums`}
              />
              <input
                value={contactNumber}
                onChange={e => setContactNumber(e.target.value)}
                placeholder="Contact number"
                className={`${FIELD} tabular-nums`}
              />
            </div>
            <button
              onClick={handleRescue}
              disabled={!active || busy === 'rescue'}
              className="cta cta--primary cta--compact w-full flex items-center justify-center gap-2 disabled:opacity-30"
            >
              {busy === 'rescue' ? <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} /> : <PhoneCall className="w-3.5 h-3.5" strokeWidth={1.5} />}
              Confirm arrival &amp; redirect all employees
            </button>
            {incident?.rescue && (
              <div className="flex items-start gap-2 text--footnote panel--wash p-3">
                <span className="sev-mark sev-mark--ok mt-0.5" />
                <span className="text-near">
                  <span className="sev-text--ok">STAGED — </span>
                  {incident.rescue.teamName} at <span className="text-ink font-medium">{incident.rescue.hubName}</span> since{' '}
                  <span className="tabular-nums">{new Date(incident.rescue.arrivedAt).toLocaleTimeString()}</span>.
                </span>
              </div>
            )}
          </div>

          <div className="panel">
            <div className="p-4 border-b border-line">
              <h3 className="text--subtitle3 text-ink flex items-center gap-2">
                <Clock className="w-4 h-4 text-ink" strokeWidth={1.5} /> Incident Timeline
              </h3>
            </div>
            <div className="p-4 space-y-3 max-h-56 overflow-y-auto">
              {/* The log is a uniform record, so it stays on a neutral hairline —
                  a colour on every row would be decoration. Only the all-clear
                  entry earns the green: it is the moment the plant became safe. */}
              {(incident?.timeline || []).slice().reverse().map((entry, i) => (
                <div
                  key={i}
                  className={`pl-3 ${HUE} ${
                    entry.phase === 'resolved' ? 'sev-row--ok' : 'border-l border-line'
                  }`}
                >
                  <div className="text--footnote text-ink font-medium">{entry.label}</div>
                  <div className="text--footnote text-subtle">{entry.detail}</div>
                  <div className="text--footnote text-muted mt-0.5 tabular-nums">
                    {new Date(entry.at).toLocaleTimeString()} · {entry.actor}
                  </div>
                </div>
              ))}
              {!incident && (
                <p className="text--footnote text-muted">Timeline populates once a sensor fires.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Headcount reconciliation */}
      {active && (
        <div className="panel">
          <div className="p-4 border-b border-line flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text--subtitle3 text-ink">Muster Headcount</h3>
            <span className="text--footnote text-subtle tabular-nums">
              {incident!.acknowledgedEmployeeIds.length} / {incident!.headcountExpected} confirmed safe
            </span>
          </div>
          <div className="p-3 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 max-h-56 overflow-y-auto">
            {employees.map(emp => {
              const safe = incident!.acknowledgedEmployeeIds.includes(emp.id);
              return (
                <button
                  key={emp.id}
                  onClick={() => !safe && handleAck(emp.id)}
                  disabled={safe}
                  className={`text-left px-3 py-2 rounded-[3px] border text--footnote ${HUE} ${
                    safe ? 'bg-wash border-line' : 'bg-paper border-line hover:border-ink'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {/* Confirmed at the muster point → green. Nobody has heard
                        from them yet → critical, and critical stays black. */}
                    <span className={`sev-mark ${safe ? 'sev-mark--ok' : 'sev-mark--critical'}`} />
                    <span className="truncate text-ink">{emp.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`${HUE} ${safe ? 'sev-text--ok' : 'sev-text--critical'}`}>
                      {safe ? 'SAFE' : 'NO RESPONSE'}
                    </span>
                    <span className="text-muted tabular-nums">{emp.employeeCode}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* WhatsApp dispatch log */}
      <div className="panel">
        <div className="p-4 border-b border-line flex items-center justify-between flex-wrap gap-3">
          <h3 className="text--subtitle3 text-ink flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-ink" strokeWidth={1.5} /> WhatsApp Dispatch Log
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="badge badge--quiet tabular-nums">evacuate {stageCounts.evacuate || 0}</span>
            <span className="badge badge--quiet tabular-nums">muster {stageCounts.muster || 0}</span>
            <span className="badge badge--quiet tabular-nums">all-clear {stageCounts.all_clear || 0}</span>
            <span className="badge badge--quiet tabular-nums">test {stageCounts.test || 0}</span>
          </div>
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          {dispatches.map(d => {
            const status = dispatchStatus(d.status);
            return (
              <button
                key={d.id}
                onClick={() => setPreviewDispatch(d)}
                className="w-full text-left p-3 border-b border-line last:border-b-0 hover:bg-wash flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text--footnote text-ink truncate">
                    {d.employeeName} <span className="text-muted tabular-nums">{d.phone}</span>
                  </div>
                  <div className="text--footnote text-muted truncate">
                    {d.body.split('\n')[0]}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className="flex items-center justify-end gap-2 text--footnote">
                    <span className="text-subtle uppercase">{d.stage}</span>
                    <span className={`sev-mark ${status.mark}`} />
                    <span className={`${HUE} ${status.text}`}>{status.word}</span>
                  </span>
                  <div className="text--footnote text-muted mt-1 tabular-nums">
                    {new Date(d.sentAt).toLocaleTimeString()}
                  </div>
                </div>
              </button>
            );
          })}
          {dispatches.length === 0 && (
            <div className="p-10 text-center text--body text-muted">
              No messages dispatched yet.
            </div>
          )}
        </div>
      </div>

      {/* Message preview modal */}
      {previewDispatch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setPreviewDispatch(null)}
        >
          <div
            className="panel max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-line flex items-center justify-between gap-3">
              <div>
                <div className="text--body-medium text-ink">{previewDispatch.employeeName}</div>
                <div className="text--footnote text-muted tabular-nums">
                  {previewDispatch.phone} · via {previewDispatch.provider}
                </div>
              </div>
              <button
                onClick={() => setPreviewDispatch(null)}
                aria-label="Close preview"
                className="cta cta--inline text-muted hover:text-ink"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
            <div className="p-4">
              <div className="bg-wash border border-line rounded-[4px] p-3">
                <pre className="text--footnote text-near whitespace-pre-wrap font-sans leading-relaxed">
                  {previewDispatch.body}
                </pre>
              </div>
              {previewDispatch.error && (
                <p className="mt-3 flex items-center gap-2 text--footnote">
                  <span className="sev-mark sev-mark--critical" />
                  <span className="sev-text--critical">FAILED —</span>
                  <span className="text-near">{previewDispatch.error}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
