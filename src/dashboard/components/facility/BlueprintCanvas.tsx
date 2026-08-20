import React, { useMemo, useRef, useState } from 'react';
import {
  FacilityBlueprint,
  FacilityZone,
  BlueprintSensor,
  MusterHub,
  ExitRoute,
  HazardClass
} from '../../../shared/facilityTypes';

export type BlueprintTool = 'select' | 'zone' | 'sensor' | 'hub' | 'route';

export type BlueprintSelection =
  | { kind: 'zone'; id: string }
  | { kind: 'sensor'; id: string }
  | { kind: 'hub'; id: string }
  | { kind: 'route'; id: string }
  | null;

interface BlueprintCanvasProps {
  blueprint: FacilityBlueprint;
  tool: BlueprintTool;
  selection: BlueprintSelection;
  onSelect: (selection: BlueprintSelection) => void;
  onDrawZone?: (rect: { x: number; y: number; w: number; h: number }) => void;
  onPlaceSensor?: (point: { x: number; y: number; zoneId: string }) => void;
  onPlaceHub?: (point: { x: number; y: number }) => void;
  onLinkRoute?: (zoneId: string, hubId: string) => void;
  onMoveSensor?: (sensorId: string, point: { x: number; y: number; zoneId: string }) => void;
  onMoveHub?: (hubId: string, point: { x: number; y: number }) => void;
  /** Live incident overlay */
  fireZoneId?: string;
  firePoint?: { x: number; y: number };
  rescueHubId?: string;
  onTriggerSensor?: (sensorId: string) => void;
  readOnly?: boolean;
}

/**
 * Architectural conventions.
 * Hazard class is carried by hatch pattern + wall weight, never by hue — it
 * stays black so it reads for every kind of colour vision.
 *   explosive → dense 45° hatch, 2px wall   (hazard / blocked)
 *   flammable → 45° hatch, 1.5px wall       (restricted)
 *   toxic     → 45° cross-hatch, 1.5px wall (restricted)
 *   standard  → 3% black fill, 1px wall     (ordinary room)
 */
const HAZARD_FILL: Record<HazardClass, string> = {
  explosive: 'url(#bp-hatch-dense)',
  flammable: 'url(#bp-hatch-45)',
  toxic: 'url(#bp-hatch-cross)',
  standard: 'rgba(0,0,0,0.03)'
};

const HAZARD_WALL: Record<HazardClass, number> = {
  explosive: 2,
  flammable: 1.5,
  toxic: 1.5,
  standard: 1
};

const SENSOR_GLYPH: Record<BlueprintSensor['type'], string> = {
  smoke: 'S',
  heat: 'H',
  flame: 'F',
  gas_leak: 'G',
  spark_detector: 'K',
  manual_call_point: 'M'
};

const INK = '#000000';
const RULE = '#898989';
const GRID = '#ebebeb';

/**
 * Accents. Exactly two exist across the product and each is used only where it
 * carries meaning. On a fire plan the one thing that earns a hue is "where you
 * go to be safe" — egress routes, muster hubs and their safe radii. Hazard
 * stays black: a 2px black hatch is the gravest mark on the sheet and tinting
 * it would weaken it. There is no water/suppression layer in this blueprint
 * model, so the blue `--info` accent is deliberately unused here.
 */
const SAFE = '#0e8a5f';
const SAFE_STRONG = '#0a6b4a';

/** Hue changes get the same 0.25s Squarespace ease as `.sev-mark`. */
const HUE: React.CSSProperties = {
  transition: 'fill 0.25s cubic-bezier(.23,1,.32,1), stroke 0.25s cubic-bezier(.23,1,.32,1)'
};

function pointInZone(zone: FacilityZone, x: number, y: number) {
  return x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h;
}

/** Small swatch used by the plan legend. Patterns are drawn in CSS so the
 *  legend can live outside the SVG next to whichever canvas it describes. */
function Swatch({ style }: { style: React.CSSProperties }) {
  return <span aria-hidden="true" className="inline-block w-5 h-3 shrink-0" style={style} />;
}

const HATCH_45 = 'repeating-linear-gradient(45deg, #000 0 1px, transparent 1px 5px)';
const HATCH_DENSE = 'repeating-linear-gradient(45deg, #000 0 1px, transparent 1px 3px)';
const HATCH_CROSS =
  'repeating-linear-gradient(45deg, #000 0 1px, transparent 1px 5px), repeating-linear-gradient(135deg, #000 0 1px, transparent 1px 5px)';

/**
 * Legend for the floor plan. Required — every pattern *and* every colour has to
 * be named in words. Only two colours appear on this sheet: black (hazard,
 * detectors, structure) and green (egress, muster, safe radius).
 */
export function BlueprintLegend() {
  const items: { swatch: React.CSSProperties; label: string }[] = [
    { swatch: { border: '2px solid #000', backgroundImage: HATCH_DENSE }, label: 'Hazard zone — explosive · black, 2px wall, dense hatch' },
    { swatch: { border: '1px solid #000', backgroundImage: HATCH_45 }, label: 'Restricted — flammable · 45° hatch' },
    { swatch: { border: '1px solid #000', backgroundImage: HATCH_CROSS }, label: 'Restricted — toxic · cross-hatch' },
    { swatch: { border: '1px solid #000', background: 'rgba(0,0,0,0.03)' }, label: 'Standard zone · 1px wall' },
    { swatch: { border: '1px dotted #000', background: 'rgba(0,0,0,0.03)' }, label: 'Proposed zone · dotted while drawing' },
    { swatch: { border: '1px solid #000', borderRadius: '999px', width: 12, height: 12, background: '#fff' }, label: 'Detector — normal' },
    { swatch: { borderRadius: '999px', width: 12, height: 12, background: '#000' }, label: 'Detector — triggered' },
    { swatch: { width: 12, height: 12, background: SAFE }, label: 'Muster hub (glyph A) / rescue staging (glyph R) — green = safe' },
    { swatch: { borderTop: '1px dashed ' + SAFE, height: 1, alignSelf: 'center' }, label: 'Egress route — green = the way out' },
    { swatch: { borderTop: '1px dashed ' + SAFE, opacity: 0.6, height: 1, alignSelf: 'center' }, label: 'Muster safe radius' },
    { swatch: { borderTop: '1px dashed #898989', height: 1, alignSelf: 'center' }, label: 'Dimension lines' },
    { swatch: { background: 'linear-gradient(90deg, rgba(0,0,0,0.55), rgba(0,0,0,0.04))' }, label: 'Heat / fire origin overlay' }
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <span className="text--eyebrow text-ink">Legend</span>
      {items.map(item => (
        <span key={item.label} className="flex items-center gap-2 text--footnote text-subtle">
          <Swatch style={item.swatch} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export default function BlueprintCanvas({
  blueprint,
  tool,
  selection,
  onSelect,
  onDrawZone,
  onPlaceSensor,
  onPlaceHub,
  onLinkRoute,
  onMoveSensor,
  onMoveHub,
  fireZoneId,
  firePoint,
  rescueHubId,
  onTriggerSensor,
  readOnly
}: BlueprintCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draft, setDraft] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [routeAnchorZone, setRouteAnchorZone] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ kind: 'sensor' | 'hub'; id: string } | null>(null);

  const pad = 8;
  const viewBox = `${-pad} ${-pad} ${blueprint.widthM + pad * 2} ${blueprint.heightM + pad * 2}`;

  const toPlan = (evt: React.MouseEvent): { x: number; y: number } => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = (blueprint.widthM + pad * 2) / rect.width;
    const scaleY = (blueprint.heightM + pad * 2) / rect.height;
    return {
      x: Math.round(((evt.clientX - rect.left) * scaleX - pad) * 10) / 10,
      y: Math.round(((evt.clientY - rect.top) * scaleY - pad) * 10) / 10
    };
  };

  const zoneAt = (x: number, y: number) =>
    [...blueprint.zones].reverse().find(z => pointInZone(z, x, y));

  const handleMouseDown = (evt: React.MouseEvent) => {
    if (readOnly) return;
    const p = toPlan(evt);
    if (tool === 'zone') {
      setDraft({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
    }
  };

  const handleMouseMove = (evt: React.MouseEvent) => {
    if (readOnly) return;
    const p = toPlan(evt);

    if (draft) {
      setDraft(prev => (prev ? { ...prev, x1: p.x, y1: p.y } : prev));
      return;
    }

    if (drag?.kind === 'sensor' && onMoveSensor) {
      const zone = zoneAt(p.x, p.y);
      onMoveSensor(drag.id, { x: p.x, y: p.y, zoneId: zone?.id || '' });
    } else if (drag?.kind === 'hub' && onMoveHub) {
      onMoveHub(drag.id, { x: p.x, y: p.y });
    }
  };

  const handleMouseUp = (evt: React.MouseEvent) => {
    if (readOnly) return;

    if (drag) {
      setDrag(null);
      return;
    }

    const p = toPlan(evt);

    if (draft && tool === 'zone') {
      const rect = {
        x: Math.min(draft.x0, draft.x1),
        y: Math.min(draft.y0, draft.y1),
        w: Math.abs(draft.x1 - draft.x0),
        h: Math.abs(draft.y1 - draft.y0)
      };
      setDraft(null);
      if (rect.w >= 4 && rect.h >= 4) onDrawZone?.(rect);
      return;
    }

    if (tool === 'sensor') {
      const zone = zoneAt(p.x, p.y);
      if (zone) onPlaceSensor?.({ x: p.x, y: p.y, zoneId: zone.id });
      return;
    }

    if (tool === 'hub') {
      onPlaceHub?.({ x: p.x, y: p.y });
      return;
    }

    if (tool === 'route') {
      const zone = zoneAt(p.x, p.y);
      if (zone && !routeAnchorZone) {
        setRouteAnchorZone(zone.id);
        return;
      }
      if (routeAnchorZone) {
        // Second click snaps to the nearest hub.
        const nearest = blueprint.hubs
          .map(h => ({ h, d: Math.hypot(h.x - p.x, h.y - p.y) }))
          .sort((a, b) => a.d - b.d)[0];
        if (nearest && nearest.d < 30) {
          onLinkRoute?.(routeAnchorZone, nearest.h.id);
          setRouteAnchorZone(null);
        }
      }
      return;
    }

    if (tool === 'select') onSelect(null);
  };

  const routePath = useMemo(
    () => (route: ExitRoute) => {
      const zone = blueprint.zones.find(z => z.id === route.fromZoneId);
      const hub = blueprint.hubs.find(h => h.id === route.toHubId);
      if (!zone || !hub) return '';
      const start = { x: zone.x + zone.w / 2, y: zone.y + zone.h / 2 };
      const points = [start, ...route.waypoints, { x: hub.x, y: hub.y }];
      return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    },
    [blueprint]
  );

  const isSelected = (kind: string, id: string) => selection?.kind === kind && selection.id === id;
  const cursor = readOnly || tool === 'select' ? 'default' : 'crosshair';

  /** Text halo so labels stay readable over hatch fills. */
  const labelHalo: React.CSSProperties = { paintOrder: 'stroke' };

  return (
    <svg
      ref={svgRef}
      viewBox={viewBox}
      className="w-full h-full select-none"
      style={{ cursor, background: '#ffffff' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => { setDraft(null); setDrag(null); }}
    >
      <defs>
        <pattern id="bp-grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke={GRID} strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </pattern>
        <pattern id="bp-grid-major" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#dddddd" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </pattern>

        {/* Hazard hatches — the only way severity reads on the plan. */}
        <pattern id="bp-hatch-45" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="3" height="3" fill="rgba(0,0,0,0.03)" />
          <line x1="0" y1="0" x2="0" y2="3" stroke={INK} strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </pattern>
        <pattern id="bp-hatch-dense" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="1.6" height="1.6" fill="rgba(0,0,0,0.05)" />
          <line x1="0" y1="0" x2="0" y2="1.6" stroke={INK} strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </pattern>
        <pattern id="bp-hatch-cross" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="3" height="3" fill="rgba(0,0,0,0.03)" />
          <line x1="0" y1="0" x2="0" y2="3" stroke={INK} strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="0" x2="3" y2="0" stroke={INK} strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </pattern>

        {/* Egress arrowheads follow the route colour — green, "this way out". */}
        <marker id="bp-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={SAFE} />
        </marker>
        <marker id="bp-arrow-live" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={SAFE} />
        </marker>

        {/* Heat overlay — black-alpha ramp, no hue. */}
        <radialGradient id="bp-fire">
          <stop offset="0%" stopColor={INK} stopOpacity="0.55" />
          <stop offset="45%" stopColor={INK} stopOpacity="0.18" />
          <stop offset="80%" stopColor={INK} stopOpacity="0.04" />
          <stop offset="100%" stopColor={INK} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Paper */}
      <rect x={-pad} y={-pad} width={blueprint.widthM + pad * 2} height={blueprint.heightM + pad * 2} fill="#ffffff" />
      <rect x={0} y={0} width={blueprint.widthM} height={blueprint.heightM} fill="url(#bp-grid)" />
      <rect x={0} y={0} width={blueprint.widthM} height={blueprint.heightM} fill="url(#bp-grid-major)" />

      {/* Compound wall — 2px black */}
      <rect
        x={0} y={0} width={blueprint.widthM} height={blueprint.heightM}
        fill="none" stroke={INK} strokeWidth="2" vectorEffect="non-scaling-stroke"
      />

      {/* Dimension lines — 1px #898989 with end ticks */}
      <g stroke={RULE} strokeWidth="1" vectorEffect="non-scaling-stroke" fill="none">
        <line x1={0} y1={-4.5} x2={blueprint.widthM} y2={-4.5} />
        <line x1={0} y1={-6} x2={0} y2={-3} />
        <line x1={blueprint.widthM} y1={-6} x2={blueprint.widthM} y2={-3} />
        <line x1={-4.5} y1={0} x2={-4.5} y2={blueprint.heightM} />
        <line x1={-6} y1={0} x2={-3} y2={0} />
        <line x1={-6} y1={blueprint.heightM} x2={-3} y2={blueprint.heightM} />
      </g>
      <text
        x={blueprint.widthM / 2} y={-5.6} fill={RULE} fontSize="3"
        textAnchor="middle" stroke="#ffffff" strokeWidth="0.9" style={labelHalo}
      >
        {blueprint.widthM} m
      </text>
      <text
        x={-5.6} y={blueprint.heightM / 2} fill={RULE} fontSize="3" textAnchor="middle"
        stroke="#ffffff" strokeWidth="0.9" style={labelHalo}
        transform={`rotate(-90 ${-5.6} ${blueprint.heightM / 2})`}
      >
        {blueprint.heightM} m
      </text>

      {/* Egress routes — dashed green, arrow to the hub. Green is the strongest
          available cue for "where you go to be safe"; weight still rises when
          the route is live or selected, so the shape encoding is unchanged. */}
      {blueprint.routes.map(route => {
        const live = !!fireZoneId;
        const selected = isSelected('route', route.id);
        return (
          <path
            key={route.id}
            d={routePath(route)}
            fill="none"
            stroke={SAFE}
            strokeWidth={selected ? 2 : live ? 1.5 : 1}
            vectorEffect="non-scaling-stroke"
            strokeDasharray="3 2"
            markerEnd={live ? 'url(#bp-arrow-live)' : 'url(#bp-arrow)'}
            opacity={live || selected ? 1 : 0.55}
            style={{ cursor: 'pointer', ...HUE }}
            onClick={e => { e.stopPropagation(); onSelect({ kind: 'route', id: route.id }); }}
          >
            {live && (
              <animate attributeName="stroke-dashoffset" from="10" to="0" dur="0.8s" repeatCount="indefinite" />
            )}
          </path>
        );
      })}

      {/* Zones — walls, hatch fills */}
      {blueprint.zones.map(zone => {
        const onFire = zone.id === fireZoneId;
        const selected = isSelected('zone', zone.id);
        const wall = HAZARD_WALL[zone.hazardClass];
        return (
          <g key={zone.id} onClick={e => { e.stopPropagation(); if (tool === 'select') onSelect({ kind: 'zone', id: zone.id }); }}>
            <rect
              x={zone.x} y={zone.y} width={zone.w} height={zone.h}
              fill={HAZARD_FILL[zone.hazardClass]}
              stroke={INK}
              strokeWidth={selected || onFire ? Math.max(wall, 2) : wall}
              vectorEffect="non-scaling-stroke"
              style={{ cursor: tool === 'select' ? 'pointer' : cursor }}
            />
            {onFire && (
              <rect
                x={zone.x} y={zone.y} width={zone.w} height={zone.h}
                fill={INK} fillOpacity="0.22" pointerEvents="none"
              >
                <animate attributeName="fill-opacity" values="0.22;0.08;0.22" dur="1.4s" repeatCount="indefinite" />
              </rect>
            )}
            {selected && (
              <rect
                x={zone.x - 1.5} y={zone.y - 1.5} width={zone.w + 3} height={zone.h + 3}
                fill="none" stroke={RULE} strokeWidth="1" strokeDasharray="3 2"
                vectorEffect="non-scaling-stroke" pointerEvents="none"
              />
            )}
            <text
              x={zone.x + 1.6} y={zone.y + 5} fill={INK} fontSize="3.1" fontWeight={500}
              stroke="#ffffff" strokeWidth="1" style={labelHalo} pointerEvents="none"
            >
              {zone.name.length > Math.floor(zone.w / 1.7) ? `${zone.name.slice(0, Math.floor(zone.w / 1.7))}…` : zone.name}
            </text>
            {zone.headcount > 0 && (
              <text
                x={zone.x + 1.6} y={zone.y + 9} fill="#5a5a5a" fontSize="2.6"
                stroke="#ffffff" strokeWidth="0.9" style={labelHalo} pointerEvents="none"
              >
                {zone.headcount} pax · {zone.hazardClass}
              </text>
            )}
          </g>
        );
      })}

      {/* Fire origin — black-alpha heat plume with a filled origin marker */}
      {firePoint && (
        <g pointerEvents="none">
          <circle cx={firePoint.x} cy={firePoint.y} r={22} fill="url(#bp-fire)">
            <animate attributeName="r" values="14;26;14" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <circle cx={firePoint.x} cy={firePoint.y} r={3.4} fill={INK} stroke="#ffffff" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <text x={firePoint.x} y={firePoint.y + 1.3} fontSize="3.6" fontWeight={500} textAnchor="middle" fill="#ffffff">!</text>
          <text
            x={firePoint.x} y={firePoint.y + 8} fontSize="2.6" textAnchor="middle" fill={INK}
            stroke="#ffffff" strokeWidth="0.9" style={labelHalo}
          >
            ORIGIN
          </text>
        </g>
      )}

      {/* Muster hubs — green filled marker, white glyph. The hub and its safe
          radius are the destination of every egress route, so they share the
          route's green. Rescue staging still reads louder through the pulsing
          radius, the 2px surround and the heavier label. */}
      {blueprint.hubs.map(hub => {
        const isRescueHub = hub.id === rescueHubId;
        const selected = isSelected('hub', hub.id);
        return (
          <g
            key={hub.id}
            style={{ cursor: readOnly ? 'default' : 'grab' }}
            onMouseDown={e => {
              if (readOnly || tool !== 'select') return;
              e.stopPropagation();
              onSelect({ kind: 'hub', id: hub.id });
              setDrag({ kind: 'hub', id: hub.id });
            }}
          >
            <circle
              cx={hub.x} cy={hub.y} r={hub.safeRadiusM / 4}
              fill="#0e8a5f0a"
              stroke={SAFE}
              strokeOpacity={isRescueHub ? 1 : 0.6}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              strokeDasharray="4 3"
              style={HUE}
            >
              {isRescueHub && <animate attributeName="r" values={`${hub.safeRadiusM / 4};${hub.safeRadiusM / 3};${hub.safeRadiusM / 4}`} dur="2s" repeatCount="indefinite" />}
            </circle>
            {(isRescueHub || selected) && (
              <rect
                x={hub.x - 6} y={hub.y - 6} width={12} height={12}
                fill="none" stroke={isRescueHub ? SAFE : RULE} strokeWidth={isRescueHub ? 2 : 1}
                strokeDasharray={selected && !isRescueHub ? '3 2' : undefined}
                vectorEffect="non-scaling-stroke"
                style={HUE}
              />
            )}
            <rect
              x={hub.x - 4} y={hub.y - 4} width={8} height={8}
              fill={SAFE} stroke="#ffffff" strokeWidth="1" vectorEffect="non-scaling-stroke"
              style={HUE}
            />
            <text x={hub.x} y={hub.y + 1.5} fontSize="4" fontWeight={500} textAnchor="middle" fill="#ffffff">
              {isRescueHub ? 'R' : 'A'}
            </text>
            <text
              x={hub.x} y={hub.y + 10} fontSize="2.9" textAnchor="middle"
              fill={isRescueHub ? SAFE_STRONG : '#5a5a5a'} fontWeight={isRescueHub ? 500 : 400}
              stroke="#ffffff" strokeWidth="0.9" style={{ ...labelHalo, ...HUE }}
            >
              {hub.name.replace(/^Hub /, '')}
            </text>
          </g>
        );
      })}

      {/* Detectors — white disc with a black ring; triggered inverts to solid black */}
      {blueprint.sensors.map(sensor => {
        const triggered = sensor.status === 'triggered';
        const selected = isSelected('sensor', sensor.id);
        const offline = sensor.status === 'offline';
        const ring = offline ? RULE : INK;
        const ringWidth = sensor.status === 'warning' ? 2 : 1;
        return (
          <g
            key={sensor.id}
            style={{ cursor: 'pointer' }}
            onMouseDown={e => {
              if (readOnly || tool !== 'select') return;
              e.stopPropagation();
              onSelect({ kind: 'sensor', id: sensor.id });
              setDrag({ kind: 'sensor', id: sensor.id });
            }}
            onDoubleClick={e => { e.stopPropagation(); onTriggerSensor?.(sensor.id); }}
          >
            {triggered && (
              <circle cx={sensor.x} cy={sensor.y} r={5} fill="none" stroke={INK} strokeWidth="1" vectorEffect="non-scaling-stroke">
                <animate attributeName="r" values="3;9;3" dur="1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" />
              </circle>
            )}
            {selected && (
              <circle
                cx={sensor.x} cy={sensor.y} r={5} fill="none" stroke={RULE}
                strokeWidth="1" strokeDasharray="2 1.5" vectorEffect="non-scaling-stroke"
              />
            )}
            <circle
              cx={sensor.x} cy={sensor.y} r={selected ? 3.2 : 2.6}
              fill={triggered ? INK : '#ffffff'}
              stroke={ring}
              strokeWidth={triggered ? 1 : ringWidth}
              vectorEffect="non-scaling-stroke"
              style={HUE}
            />
            <text
              x={sensor.x} y={sensor.y + 1.1} fontSize="2.6" fontWeight={500} textAnchor="middle"
              fill={triggered ? '#ffffff' : offline ? RULE : INK}
              style={HUE}
            >
              {SENSOR_GLYPH[sensor.type]}
            </text>
          </g>
        );
      })}

      {/* Proposed zone — dotted 1px while the rectangle is being drawn */}
      {draft && (
        <rect
          x={Math.min(draft.x0, draft.x1)}
          y={Math.min(draft.y0, draft.y1)}
          width={Math.abs(draft.x1 - draft.x0)}
          height={Math.abs(draft.y1 - draft.y0)}
          fill="rgba(0,0,0,0.03)" stroke={INK} strokeWidth="1"
          strokeDasharray="1 2" strokeLinecap="round" vectorEffect="non-scaling-stroke"
        />
      )}

      {routeAnchorZone && (
        <text
          x={2} y={blueprint.heightM + 5} fill={INK} fontSize="3.2"
          stroke="#ffffff" strokeWidth="0.9" style={labelHalo}
        >
          Route start: {blueprint.zones.find(z => z.id === routeAnchorZone)?.name} — now click the destination hub
        </text>
      )}
    </svg>
  );
}
