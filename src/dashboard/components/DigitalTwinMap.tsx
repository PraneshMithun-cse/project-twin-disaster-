import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  ZoneRisk,
  IoTSensorNode,
  EmergencyResource,
  EmergencyShelter,
  CitizenReport,
  EvacuationRoute,
  EmergencyHospital
} from '../../shared/types';
import {
  Layers,
  Clock,
  Navigation,
  ShieldAlert,
  Info,
  CheckCircle2,
  Crosshair,
  ChevronDown,
  Map as MapIcon,
  Minus,
  Plus,
  X,
  Ruler
} from 'lucide-react';


/* ─────────────────────────────────────────────────────────────────────────
   Map overlay kit — black/gray ramp plus exactly two meaningful accents.

   `index.css` desaturates the basemap, but every overlay below is drawn
   imperatively by Leaflet and escapes that filter — so each stroke, fill and
   divIcon is authored by hand. Severity still reads through stroke weight,
   dash pattern and fill density; hue is reserved for two meanings only:

     SAFE (green) — the way out: evacuation corridor, shelters with room,
                    units standing ready.
     INFO (blue)  — water: flood inundation, depth, rainfall, telemetry.

   Critical stays black (maximum contrast = gravest state), advisory stays the
   black hatch, risk zones and SOS incidents stay black, and raw sensor
   imagery (Sentinel SAR, NASA FIRMS) stays greyscale — it is measurement,
   not a semantic state.
   ───────────────────────────────────────────────────────────────────────── */

const INK = '#0f172a';
const SUBTLE = '#475569';
const MUTED = '#64748b';
const PAPER = '#ffffff';
const LINE = 'rgba(15, 23, 42, 0.08)';

/** The only two accents in the product. See docs/DESIGN_SYSTEM.md. */
const SAFE = '#10b981';
const SAFE_STRONG = '#059669';
const SAFE_RING = 'rgba(16, 185, 129, 0.1)';
const INFO = '#0ea5e9';
const INFO_STRONG = '#0284c7';

/** --ease-sqsp. Inline because divIcon HTML cannot reach the stylesheet. */
const EASE = 'cubic-bezier(.23,1,.32,1)';
const COLOR_TRANSITION = `background-color .25s ${EASE},border-color .25s ${EASE},color .25s ${EASE}`;

type OverlaySeverity = 'critical' | 'advisory' | 'info';

const OVERLAY_STYLE: Record<
  OverlaySeverity,
  { color: string; weight: number; dashArray?: string; fillOpacity: number; label: string }
> = {
  critical: { color: '#ef4444', weight: 2.5, fillOpacity: 0.16, label: 'Critical' },
  advisory: { color: '#f59e0b', weight: 1.8, dashArray: '7 4', fillOpacity: 0.09, label: 'Advisory' },
  info: { color: '#0ea5e9', weight: 1.2, dashArray: '1 4', fillOpacity: 0.05, label: 'Info' }
};

const zoneSeverity = (priorityLevel: string | undefined, riskScore: number): OverlaySeverity => {
  const level = (priorityLevel || '').toUpperCase();
  if (level === 'CRITICAL' || riskScore >= 75) return 'critical';
  if (level === 'HIGH' || riskScore >= 55) return 'advisory';
  return 'info';
};

/** lucide-style 24×24 outline paths, inlined because divIcon only takes HTML. */
const GLYPH_PATHS: Record<string, string> = {
  radio:
    '<path d="M4.9 19.1a10 10 0 0 1 0-14.2"/><path d="M7.8 16.2a6 6 0 0 1 0-8.4"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4"/><path d="M19.1 4.9a10 10 0 0 1 0 14.2"/><circle cx="12" cy="12" r="2"/>',
  truck:
    '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  lifebuoy:
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="m5.6 5.6 3.9 3.9"/><path d="m14.5 9.5 3.9-3.9"/><path d="m14.5 14.5 3.9 3.9"/><path d="m9.5 14.5-3.9 3.9"/>',
  cross: '<path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z"/>',
  hospital:
    '<path d="M12 6v4"/><path d="M14 14h-4"/><path d="M14 18h-4"/><path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h2"/><path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18"/>',
  shield:
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  tent: '<path d="M3.5 21 14 3"/><path d="M20.5 21 10 3"/><path d="M15.5 21 12 15l-3.5 6"/><path d="M2 21h20"/>',
  droplet:
    '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  flame:
    '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
  stop: '<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  school: '<path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/><path d="M18 22V11l-6-5-6 5v11"/><path d="M12 2v4"/><circle cx="12" cy="12" r="3"/><path d="M12 10.8V12h1.2"/>',
  police: '<path d="M3 20c0-3.5 3-5 9-5s9 1.5 9 5"/><path d="M10 15v3l2 2 2-2v-3"/><circle cx="12" cy="10" r="3.5"/><path d="M6 8c0-3 3-4 6-4s6 1 6 4H6z"/><path d="M12 4.2c.4.4.4.8 0 1.2-.4-.4-.4-.8 0-1.2z"/>',
  satellite:
    '<path d="M13 7 9 3 3 9l4 4"/><path d="m17 11 4 4-6 6-4-4"/><path d="m8 12 4 4"/><path d="M16 8a4 4 0 0 0-4-4"/><path d="M20 8a8 8 0 0 0-8-8"/>'
};

const glyph = (name: string, size = 12): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${GLYPH_PATHS[name] || GLYPH_PATHS.pin}</svg>`;

/**
 * White pin, 1px ring, 4px radius, soft shadow. Solid fill = critical.
 * `ring` tints the outline, `mark` tints the glyph inside; both default to
 * black, so an un-accented call renders exactly as before.
 */
const mapPin = (
  inner: string,
  opts: {
    size?: number;
    round?: boolean;
    solid?: boolean;
    ring?: string;
    mark?: string;
    offset?: [number, number];
  } = {}
): string => {
  const size = opts.size ?? 22;
  const solid = opts.solid === true;
  const ring = opts.ring ?? INK;
  const background = solid ? ring : PAPER;
  const foreground = solid ? PAPER : (opts.mark ?? ring);
  const pin = `<div class="map-micro-pin" style="background:${background};color:${foreground};border:1px solid ${ring};border-radius:${opts.round ? '50%' : '4px'};width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.12);transition:${COLOR_TRANSITION};">${inner}</div>`;
  const [dx, dy] = opts.offset ?? [0, 0];
  if (!dx && !dy) return pin;
  // The latlng anchor is untouched; only the drawn pin is nudged, so a pile
  // of coincident markers fans out identically at every zoom level.
  return `<div class="map-pin-fan" style="transform:translate(${dx}px,${dy}px);">${pin}</div>`;
};

/** Flat white chip used for on-map labels (distance, lane guidance). */
const mapChip = (label: string, accent?: { text: string; border: string }): string =>
  `<div style="background:${PAPER};color:${accent?.text ?? INK};border:1px solid ${accent?.border ?? LINE};border-radius:4px;padding:3px 7px;font-family:Clarkson,Helvetica,Arial,sans-serif;font-size:11px;font-weight:500;line-height:1;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.12);transition:${COLOR_TRANSITION};">${label}</div>`;

const tipRow = (label: string, value: string | number): string =>
  `<div style="display:flex;justify-content:space-between;gap:18px;font-size:12px;line-height:1.7;color:${SUBTLE};"><span>${label}</span><span style="color:${INK};font-weight:500;">${value}</span></div>`;

/** `accent` colours the tooltip title only — used where the overlay is tinted. */
const tip = (title: string, rows: string[], accent: string = INK): string =>
  `<div style="font-family:Clarkson,Helvetica,Arial,sans-serif;min-width:160px;"><div style="font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.08em;color:${accent};">${title}</div><div style="height:1px;background:${LINE};margin:6px 0 5px;"></div>${rows.join('')}</div>`;
/* ── Pin de-collision ──────────────────────────────────────────────────
   Markers that land in the same ~110 m cell used to stack into an unreadable
   pile in the middle of the frame. Each subsequent pin in a cell takes the
   next slot on a fixed fan, expressed in screen pixels so the spread holds at
   any zoom, and every marker gets `riseOnHover` so the one under the cursor
   lifts above its neighbours. No clustering library involved.
   ──────────────────────────────────────────────────────────────────────── */
const PIN_FAN: [number, number][] = [
  [0, 0],
  [15, -11],
  [-15, -11],
  [15, 11],
  [-15, 11],
  [0, -21],
  [0, 21],
  [24, 0],
  [-24, 0],
  [26, -19],
  [-26, -19],
  [26, 19]
];

const createPinFan = () => {
  const cells = new Map<string, number>();
  return (lat: number, lng: number): [number, number] => {
    const key = `${lat.toFixed(3)}:${lng.toFixed(3)}`;
    const taken = cells.get(key) ?? 0;
    cells.set(key, taken + 1);
    return PIN_FAN[taken % PIN_FAN.length];
  };
};

interface DigitalTwinMapProps {
  zones: ZoneRisk[];
  sensors: IoTSensorNode[];
  resources: EmergencyResource[];
  shelters: EmergencyShelter[];
  reports: CitizenReport[];
  hospitals?: EmergencyHospital[];
  evacuationRoute?: EvacuationRoute;
  timeHorizon: 'live' | '30m' | '1h' | '2h';
  setTimeHorizon: (horizon: 'live' | '30m' | '1h' | '2h') => void;
  onSelectZone: (zone: ZoneRisk) => void;
  onSelectResource: (resource: EmergencyResource) => void;
  onSelectReport: (report: CitizenReport) => void;
  onCalculateEvacuationRoute?: (originName: string, originCoords: [number, number], shelterId: string) => void;
  isCalculatingRoute?: boolean;
}

export const DigitalTwinMap: React.FC<DigitalTwinMapProps> = ({
  zones,
  sensors,
  resources,
  shelters,
  reports,
  hospitals,
  evacuationRoute,
  timeHorizon,
  setTimeHorizon,
  onSelectZone,
  onSelectResource,
  onSelectReport,
  onCalculateEvacuationRoute,
  isCalculatingRoute
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const measureGroupRef = useRef<L.LayerGroup | null>(null);

  // Map Basemap Tile Style
  const [mapTileStyle, setMapTileStyle] = useState<'light' | 'minimal' | 'satellite' | 'streets'>('light');

  // Map Measurement Mode State
  const [isMeasuring, setIsMeasuring] = useState<boolean>(false);
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);

  // Layer Visibility States (De-cluttered Defaults)
  const [showZones, setShowZones] = useState(true);
  const [showInundation, setShowInundation] = useState(true);
  const [showSensors, setShowSensors] = useState(false); // Off by default to prevent icon crowd
  const [showResources, setShowResources] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showReports, setShowReports] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);
  const [showRoute, setShowRoute] = useState(true);
  const [showSentinelSAR, setShowSentinelSAR] = useState(false); // Off by default
  const [showNASAFIRMS, setShowNASAFIRMS] = useState(false); // Off by default

  // Satellite Data States
  const [sarData, setSarData] = useState<any>(null);
  const [firmsData, setFirmsData] = useState<any>(null);

  // De-cluttered Dropdown Controls State
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [isStylesOpen, setIsStylesOpen] = useState(false);

  // Legend is chrome, not data: expanded where there is room, collapsed to a
  // single chip on narrow viewports.
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  );

  const activeLayersCount = [
    showZones, showInundation, showSensors, showResources,
    showShelters, showHospitals, showReports, showRoute, showSentinelSAR, showNASAFIRMS
  ].filter(Boolean).length;

  // Fetch Live Satellite GIS Data
  useEffect(() => {
    async function fetchSatelliteFeeds() {
      try {
        const [sarResp, firmsResp] = await Promise.all([
          fetch('/api/gis/satellite/sentinel-sar'),
          fetch('/api/gis/satellite/nasa-firms')
        ]);
        if (sarResp.ok) {
          const sarJson = await sarResp.json();
          if (sarJson.success && sarJson.data) setSarData(sarJson.data);
        }
        if (firmsResp.ok) {
          const firmsJson = await firmsResp.json();
          if (firmsJson.success && firmsJson.data) setFirmsData(firmsJson.data);
        }
      } catch (err) {
        console.warn('Satellite GIS feed fetch warning:', err);
      }
    }
    fetchSatelliteFeeds();
  }, []);

  // Interactive Route Planner State on Map View
  const [routeOriginName, setRouteOriginName] = useState('Velachery 100ft Road (Vijaya Nagar Junction)');
  const [routeOriginCoords, setRouteOriginCoords] = useState<[number, number]>([12.9785, 80.2205]);
  const [selectedShelterId, setSelectedShelterId] = useState(shelters[0]?.id || 'sh-01');
  const [isClickToPickOrigin, setIsClickToPickOrigin] = useState(false);
  const [showStepsDrawer, setShowStepsDrawer] = useState(false);
  const [isRouteEngineMinimized, setIsRouteEngineMinimized] = useState(true);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Inspector Panel State
  const [selectedItem, setSelectedItem] = useState<{
    type: 'zone' | 'sensor' | 'resource' | 'shelter' | 'report' | 'hospital';
    data: any;
  } | null>(null);

  // Redirect and open direct optimized navigation in Google Maps using current GPS location & destination
  const handleOpenGoogleMaps = () => {
    if (!evacuationRoute || !evacuationRoute.waypoints || evacuationRoute.waypoints.length === 0) {
      const targetShelter = shelters.find(s => s.id === selectedShelterId);
      const destCoords = targetShelter?.location?.coordinates || [12.9830, 80.2182];
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destCoords[0]},${destCoords[1]}&travelmode=driving`, '_blank', 'noopener,noreferrer');
      return;
    }

    const destCoords = evacuationRoute.waypoints[evacuationRoute.waypoints.length - 1];
    const destStr = `${destCoords[0]},${destCoords[1]}`;

    const launchMaps = (originStr?: string) => {
      let url = `https://www.google.com/maps/dir/?api=1&destination=${destStr}&travelmode=driving`;
      if (originStr) {
        url += `&origin=${originStr}`;
      } else {
        const origCoords = evacuationRoute.waypoints[0];
        url += `&origin=${origCoords[0]},${origCoords[1]}`;
      }
      // Direct optimized route - intentionally omitting intermediate waypoints so Google Maps computes the optimal live traffic route
      window.open(url, '_blank', 'noopener,noreferrer');
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => launchMaps(`${pos.coords.latitude},${pos.coords.longitude}`),
        () => launchMaps(),
        { timeout: 3500 }
      );
    } else {
      launchMaps();
    }
  };

  // Get tile URL for current style
  const getTileUrl = (style: 'light' | 'minimal' | 'satellite' | 'streets') => {
    switch (style) {
      case 'minimal':
        // Positron without labels — the cleanest, most neutral basemap.
        return 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'streets':
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      case 'light':
      default:
        // CARTO Positron — light, restrained, professional cartography.
        return 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    }
  };

  // Zoom, driven by the glass +/- pair in the right-hand control stack.
  // Leaflet's own control stays disabled (`zoomControl: false`) so it can
  // never render half-clipped underneath the other chrome again.
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  // Recenter Map Camera
  const handleRecenterMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([12.988, 80.230], 13, { duration: 1.2 });
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [12.988, 80.230], // Chennai Velachery - Adyar center
        zoom: 13,
        zoomControl: false
      });

      // Add Basemap Tile Layer
      const tileLayer = L.tileLayer(getTileUrl(mapTileStyle), {
        attribution: '&copy; OpenStreetMap &copy; CARTO &copy; Esri',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      const layerGroup = L.layerGroup().addTo(map);
      const measureGroup = L.layerGroup().addTo(map);
      
      mapInstanceRef.current = map;
      layersGroupRef.current = layerGroup;
      measureGroupRef.current = measureGroup;

      // Invalidate map size after layout renders to prevent Leaflet viewport tiles glitch
      const timer1 = setTimeout(() => {
        map.invalidateSize();
      }, 100);
      const timer2 = setTimeout(() => {
        map.invalidateSize();
      }, 400);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // ResizeObserver to ensure map tiles adjust smoothly whenever container dimensions change
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update Basemap Tiles when style changes
  useEffect(() => {
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(getTileUrl(mapTileStyle));
    }
  }, [mapTileStyle]);

  // Map click listener for setting dynamic passenger origin
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (isClickToPickOrigin) {
        const coords: [number, number] = [e.latlng.lat, e.latlng.lng];
        const name = `GPS Pin (${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)})`;
        setRouteOriginName(name);
        setRouteOriginCoords(coords);
        setIsClickToPickOrigin(false);
        if (onCalculateEvacuationRoute) {
          onCalculateEvacuationRoute(name, coords, selectedShelterId);
        }
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isClickToPickOrigin, selectedShelterId, onCalculateEvacuationRoute]);

  // Map measurement click listener
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const handleMeasureClick = (e: L.LeafletMouseEvent) => {
      if (isMeasuring) {
        setMeasurePoints(prev => [...prev, [e.latlng.lat, e.latlng.lng]]);
      }
    };

    map.on('click', handleMeasureClick);
    return () => {
      map.off('click', handleMeasureClick);
    };
  }, [isMeasuring]);

  // Render Measurement Overlay
  useEffect(() => {
    if (!measureGroupRef.current) return;
    const measureGroup = measureGroupRef.current;
    measureGroup.clearLayers();

    if (measurePoints.length > 0) {
      measurePoints.forEach((pt, idx) => {
        const marker = L.circleMarker(pt, {
          radius: 4,
          color: INK,
          weight: 1,
          fillColor: PAPER,
          fillOpacity: 1
        }).bindTooltip(`P${idx + 1}`, { permanent: true, direction: 'top' });
        measureGroup.addLayer(marker);
      });

      if (measurePoints.length > 1) {
        // White casing beneath the black line — reads cleanly over Positron.
        const casing = L.polyline(measurePoints, {
          color: PAPER,
          weight: 6,
          opacity: 1,
          lineCap: 'round',
          lineJoin: 'round'
        });
        const polyline = L.polyline(measurePoints, {
          color: INK,
          weight: 2,
          dashArray: '5 5',
          lineCap: 'butt'
        });
        measureGroup.addLayer(casing);
        measureGroup.addLayer(polyline);

        let totalDistMeters = 0;
        for (let i = 0; i < measurePoints.length - 1; i++) {
          const p1 = L.latLng(measurePoints[i][0], measurePoints[i][1]);
          const p2 = L.latLng(measurePoints[i + 1][0], measurePoints[i + 1][1]);
          totalDistMeters += p1.distanceTo(p2);
        }

        const km = (totalDistMeters / 1000).toFixed(2);
        const lastPt = measurePoints[measurePoints.length - 1];
        const distMarker = L.marker(lastPt, {
          icon: L.divIcon({
            html: mapChip(`${km} km`),
            className: 'dist-label',
            iconAnchor: [-10, 0]
          })
        });
        measureGroup.addLayer(distMarker);
      }
    }
  }, [measurePoints]);

  // Render Map Layers on State Changes
  useEffect(() => {
    if (!mapInstanceRef.current || !layersGroupRef.current) return;

    const map = mapInstanceRef.current;
    const layerGroup = layersGroupRef.current;
    layerGroup.clearLayers();

    // Fresh allocator per render pass, so pin offsets stay deterministic.
    const fanOut = createPinFan();

    // 1. Render Zone Circles
    if (showZones && Array.isArray(zones)) {
      zones.forEach((zone) => {
        if (!zone || !Array.isArray(zone.coords) || zone.coords.length < 3) return;
        const validCoords = zone.coords
          .filter((c: any) => Array.isArray(c) && c.length >= 2 && !isNaN(Number(c[0])) && !isNaN(Number(c[1])))
          .map((c: any) => [Number(c[0]), Number(c[1])]) as [number, number][];
        if (validCoords.length < 3) return;

        // Severity now reads through stroke weight, dash pattern and fill density.
        const severity = zoneSeverity(zone.priorityLevel, Number(zone.riskScore));
        const style = OVERLAY_STYLE[severity];

        const center: [number, number] = (Array.isArray(zone.center) && zone.center.length >= 2)
          ? [Number(zone.center[0]), Number(zone.center[1])]
          : validCoords[0];

        const circle = L.circle(center, {
          radius: 600 + Number(zone.riskScore) * 3.5, // dynamic radius: e.g. 600m to 950m
          color: style.color,
          weight: style.weight,
          opacity: 0.9,
          dashArray: style.dashArray,
          fillColor: style.color,
          fillOpacity: style.fillOpacity + 0.04,
          className: 'pulsing-zone-circle'
        });

        circle.on('click', () => {
          setSelectedItem({ type: 'zone', data: zone });
          onSelectZone(zone);
        });

        circle.bindTooltip(
          tip(zone.name, [
            tipRow('Severity', style.label),
            tipRow('Risk score', `${zone.riskScore}/100`),
            tipRow('Pop. at risk', zone.populationAtRisk.toLocaleString()),
            tipRow('Status', String(zone.status || '').toUpperCase())
          ]),
          { sticky: true }
        );

        layerGroup.addLayer(circle);
      });
    }

    // 2. Render Hydrodynamic Inundation Overlay depending on timeHorizon
    if (showInundation && Array.isArray(zones)) {
      zones.forEach((zone) => {
        if (!zone || !Array.isArray(zone.coords)) return;
        const validCoords = zone.coords
          .filter((c: any) => Array.isArray(c) && c.length >= 2 && !isNaN(Number(c[0])) && !isNaN(Number(c[1])))
          .map((c: any) => [Number(c[0]), Number(c[1])]) as [number, number][];
        if (validCoords.length < 3) return;

        let depth = Number(zone.currentWaterLevelMeters || 0);
        let scale = 1.0;

        if (timeHorizon === '30m') {
          depth = Number(zone.predictedWaterLevel30m || depth);
          scale = 1.15;
        } else if (timeHorizon === '1h') {
          depth = Number(zone.predictedWaterLevel1h || depth);
          scale = 1.35;
        } else if (timeHorizon === '2h') {
          depth = Number(zone.predictedWaterLevel2h || depth);
          scale = 1.55;
        }

        if (depth > 0.3) {
          const center: [number, number] = (Array.isArray(zone.center) && zone.center.length >= 2 && !isNaN(Number(zone.center[0])) && !isNaN(Number(zone.center[1])))
            ? [Number(zone.center[0]), Number(zone.center[1])]
            : validCoords[0];

          // Water reads as blue without a legend, so inundation is the one
          // fill that takes the info accent. Depth still reads as fill
          // density; the alpha stays low so the basemap survives underneath.
          const fillOpacity = Math.min(0.16, 0.08 + depth * 0.02);

          const inundationCircle = L.circle(center, {
            radius: (600 + Number(zone.riskScore) * 3.5) * scale, // grows with forecast timeline scale
            color: INFO,
            weight: 1.5,
            dashArray: '2 4',
            fillColor: INFO,
            fillOpacity: fillOpacity + 0.05,
            className: 'pulsing-inundation-circle'
          });

          inundationCircle.bindTooltip(
            tip(`Flood inundation · ${timeHorizon.toUpperCase()}`, [
              tipRow('Est. water depth', `${depth.toFixed(1)} m`)
            ], INFO_STRONG),
            { sticky: true }
          );

          layerGroup.addLayer(inundationCircle);
        }
      });
    }

    // 3. Render IoT Sensor Nodes
    if (showSensors && Array.isArray(sensors)) {
      sensors.forEach((sensor) => {
        if (!sensor) return;
        const lat = Number(sensor.lat ?? (Array.isArray(sensor.coordinates) ? sensor.coordinates[0] : NaN));
        const lng = Number(sensor.lng ?? (Array.isArray(sensor.coordinates) ? sensor.coordinates[1] : NaN));
        if (isNaN(lat) || isNaN(lng)) return;

        const severity: OverlaySeverity =
          sensor.status === 'critical' ? 'critical' : sensor.status === 'warning' ? 'advisory' : 'info';

        const customIcon = L.divIcon({
          html: mapPin(glyph('radio', 16), { size: 28, round: true, solid: severity === 'critical', offset: fanOut(lat, lng) }),
          className: 'custom-sensor-icon',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([lat, lng], { icon: customIcon, riseOnHover: true });

        marker.on('click', () => {
          setSelectedItem({ type: 'sensor', data: sensor });
        });

        marker.bindTooltip(
          tip(sensor.name, [
            tipRow('Status', OVERLAY_STYLE[severity].label),
            tipRow('Reading', `${sensor.currentValue} ${sensor.unit}`),
            tipRow('Battery', `${sensor.batteryPct}%`),
            tipRow('Signal', `${sensor.signalPct}%`)
          ])
        );

        layerGroup.addLayer(marker);
      });
    }

    // 4. Render Emergency Resources
    if (showResources && Array.isArray(resources)) {
      resources.forEach((res) => {
        if (!res) return;
        const lat = Number(res.lat ?? (Array.isArray(res.coordinates) ? res.coordinates[0] : NaN));
        const lng = Number(res.lng ?? (Array.isArray(res.coordinates) ? res.coordinates[1] : NaN));
        if (isNaN(lat) || isNaN(lng)) return;

        // Emoji iconography replaced with lucide-style outline glyphs.
        let symbol = 'lifebuoy';
        if (res.type === 'ambulance') symbol = 'cross';
        if (res.type === 'fire_truck') symbol = 'flame';
        if (res.type === 'police_patrol') symbol = 'police';
        if (res.type === 'relief_truck') symbol = 'truck';

        // Fleet units stay neutral. Only a unit that is actually standing by
        // earns the green mark — "ready" is a safe/operational state.
        const isReady = String(res.status || '').toLowerCase() === 'available';

        const customIcon = L.divIcon({
          html: mapPin(glyph(symbol, 17), { size: 30, mark: isReady ? SAFE_STRONG : INK, offset: fanOut(lat, lng) }),
          className: 'custom-resource-icon',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = L.marker([lat, lng], { icon: customIcon, riseOnHover: true });

        marker.on('click', () => {
          setSelectedItem({ type: 'resource', data: res });
          onSelectResource(res);
        });

        marker.bindTooltip(
          tip(res.name, [
            tipRow('Status', String(res.status || '').toUpperCase()),
            tipRow('Crew', `${res.crewCount} personnel`)
          ])
        );

        layerGroup.addLayer(marker);
      });
    }

    // 5. Render Emergency Shelters
    if (showShelters && Array.isArray(shelters)) {
      shelters.forEach((shelter) => {
        if (!shelter) return;
        const lat = Number(shelter.lat ?? (Array.isArray(shelter.coordinates) ? shelter.coordinates[0] : NaN));
        const lng = Number(shelter.lng ?? (Array.isArray(shelter.coordinates) ? shelter.coordinates[1] : NaN));
        if (isNaN(lat) || isNaN(lng)) return;

        // A shelter with room left is somewhere you can go — green ring,
        // green mark. Full or closed is not a safe state, so it stays black.
        const shelterStatus = String(shelter.status || '').toLowerCase();
        const spaceLeft = Number(shelter.totalCapacity ?? 0) - Number(shelter.currentOccupancy ?? 0);
        const hasSpace = shelterStatus !== 'full' && shelterStatus !== 'closed' && spaceLeft > 0;

        const customIcon = L.divIcon({
          html: mapPin(glyph('school', 17), {
            size: 30,
            ring: hasSpace ? SAFE : INK,
            mark: hasSpace ? SAFE_STRONG : INK,
            offset: fanOut(lat, lng)
          }),
          className: 'custom-shelter-icon',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = L.marker([lat, lng], { icon: customIcon, riseOnHover: true });

        marker.on('click', () => {
          setSelectedItem({ type: 'shelter', data: shelter });
        });

        marker.bindTooltip(
          tip(shelter.name, [
            tipRow('Status', hasSpace ? 'Space available' : 'At capacity'),
            tipRow('Occupancy', `${shelter.currentOccupancy} / ${shelter.totalCapacity}`),
            tipRow('Rations', `${shelter.foodSuppliesDays} days`)
          ], hasSpace ? SAFE_STRONG : INK)
        );

        layerGroup.addLayer(marker);
      });
    }

    // Hospitals
    if (showHospitals && Array.isArray(hospitals)) {
      hospitals.forEach((hosp) => {
        if (!hosp) return;
        const lat = Number(hosp.lat ?? (Array.isArray(hosp.coordinates) ? hosp.coordinates[0] : NaN));
        const lng = Number(hosp.lng ?? (Array.isArray(hosp.coordinates) ? hosp.coordinates[1] : NaN));
        if (isNaN(lat) || isNaN(lng)) return;

        // Medical infrastructure is official, non-urgent reference data —
        // the info accent, not a severity.
        const customIcon = L.divIcon({
          html: mapPin(glyph('hospital', 17), { size: 30, ring: INFO, mark: INFO_STRONG, offset: fanOut(lat, lng) }),
          className: 'custom-hospital-icon',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const totalBeds = hosp.totalCapacity ?? hosp.total_beds ?? 0;
        const availIcu = hosp.icuBedsAvailable ?? hosp.available_icu_beds ?? 0;

        const marker = L.marker([lat, lng], { icon: customIcon, riseOnHover: true });

        marker.on('click', () => {
          setSelectedItem({ type: 'hospital', data: hosp });
        });

        marker.bindTooltip(
          tip(hosp.name, [
            tipRow('Beds', `${availIcu} ICU / ${totalBeds} total`),
            tipRow('Status', String(hosp.status || '').toUpperCase())
          ], INFO_STRONG)
        );

        layerGroup.addLayer(marker);
      });
    }

    // 6. Render Citizen Reports
    if (showReports && Array.isArray(reports)) {
      reports.forEach((rep) => {
        if (!rep) return;
        const lat = Number(rep.lat ?? (Array.isArray((rep as any).coordinates) ? (rep as any).coordinates[0] : NaN));
        const lng = Number(rep.lng ?? (Array.isArray((rep as any).coordinates) ? (rep as any).coordinates[1] : NaN));
        if (isNaN(lat) || isNaN(lng)) return;

        let catSymbol = 'alert';
        if (rep.category === 'waterlogging') catSymbol = 'droplet';
        if (rep.category === 'stranded') catSymbol = 'lifebuoy';
        if (rep.category === 'power_outage') catSymbol = 'zap';

        const isCritical = rep.severity === 'critical';
        const isWarning = rep.severity === 'warning' || rep.severity === 'high';
        const severity: OverlaySeverity = isCritical ? 'critical' : isWarning ? 'advisory' : 'info';

        const customIcon = L.divIcon({
          html: mapPin(glyph(catSymbol, 16), { size: 30, round: true, solid: isCritical, offset: fanOut(lat, lng) }),
          className: 'custom-report-icon',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = L.marker([lat, lng], { icon: customIcon, riseOnHover: true });

        marker.on('click', () => {
          setSelectedItem({ type: 'report', data: rep });
          onSelectReport(rep);
        });

        marker.bindTooltip(
          tip('Citizen SOS incident', [
            tipRow('Severity', OVERLAY_STYLE[severity].label),
            tipRow('Location', rep.locationName || 'Velachery Sector'),
            tipRow('Category', (rep.category || 'waterlogging').replace('_', ' ')),
            tipRow('AI credibility', `${rep.aiValidationScore || 90}% verified`)
          ])
        );

        layerGroup.addLayer(marker);
      });
    }

    // 7. Render Evacuation Route & Waypoints (Lane-Wise Road Corridor)
    if (showRoute && evacuationRoute && Array.isArray(evacuationRoute.waypoints) && evacuationRoute.waypoints.length > 0) {
      const validWaypoints = evacuationRoute.waypoints
        .map((wp: any) => [Number(wp[0]), Number(wp[1])])
        .filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng)) as [number, number][];

      if (validWaypoints.length > 0) {
        // LAYER A: White casing drawn first — the standard cartographic
        // treatment that lets the route read over a light basemap. The casing
        // stays white; only the lane on top carries the accent.
        const bufferCorridor = L.polyline(validWaypoints, {
          color: PAPER,
          weight: 7,
          opacity: 1,
          lineCap: 'round',
          lineJoin: 'round'
        });

        // LAYER B: Active transit lane. This is the single most important
        // colour on the map — "this way out" has to read as green instantly.
        const activeLane = L.polyline(validWaypoints, {
          color: SAFE,
          weight: 3,
          opacity: 1,
          lineCap: 'round',
          lineJoin: 'round'
        });

        // LAYER C: Center lane divider markings
        const laneDivider = L.polyline(validWaypoints, {
          color: PAPER,
          weight: 1,
          opacity: 0.9,
          dashArray: '4 8',
          lineCap: 'butt'
        });

        const routeTooltipHtml = tip('Safe emergency corridor', [
          tipRow('Safety index', `${evacuationRoute.safetyScorePct}% safe`),
          tipRow('Distance', `${evacuationRoute.distanceKm} km`),
          tipRow('Est. time', `${evacuationRoute.estimatedTimeMinutes} mins`)
        ], SAFE_STRONG);

        bufferCorridor.bindTooltip(routeTooltipHtml, { sticky: true });
        activeLane.bindTooltip(routeTooltipHtml, { sticky: true });

        layerGroup.addLayer(bufferCorridor);
        layerGroup.addLayer(activeLane);
        layerGroup.addLayer(laneDivider);

        // Render Lane Guidance Decision Badge along mid-route
        if (validWaypoints.length >= 2) {
          const midIdx = Math.floor(validWaypoints.length / 2);
          const badgeCoords = validWaypoints[midIdx];

          if (badgeCoords) {
            const laneBadgeIcon = L.divIcon({
              html: mapChip('Lane 1 · Clear corridor', { text: SAFE_STRONG, border: SAFE_RING }),
              className: 'lane-badge-mid',
              iconAnchor: [-8, 0]
            });
            layerGroup.addLayer(L.marker(badgeCoords, { icon: laneBadgeIcon }));
          }
        }

        // Start Origin Beacon Marker
        // Origin stays neutral: "where you are standing" is not a safe state.
        const startCoords = validWaypoints[0];
        if (startCoords && !isNaN(startCoords[0]) && !isNaN(startCoords[1])) {
          const originIcon = L.divIcon({
            html: mapPin(glyph('pin', 18), { size: 34, round: true, offset: fanOut(startCoords[0], startCoords[1]) }),
            className: 'origin-marker-icon',
            iconSize: [34, 34],
            iconAnchor: [17, 17]
          });
          const originMarker = L.marker(startCoords, { icon: originIcon, riseOnHover: true });
          originMarker.bindTooltip(
            tip('Passenger origin', [tipRow('Point', evacuationRoute.originName || 'Starting point')])
          );
          layerGroup.addLayer(originMarker);
        }

        // Target Shelter Beacon Marker
        const endCoords = validWaypoints[validWaypoints.length - 1];
        if (endCoords && !isNaN(endCoords[0]) && !isNaN(endCoords[1])) {
          // The end of the corridor — solid green, the terminus of "this way out".
          const shelterIcon = L.divIcon({
            html: mapPin(glyph('school', 18), { size: 34, round: true, solid: true, ring: SAFE, offset: fanOut(endCoords[0], endCoords[1]) }),
            className: 'shelter-target-icon',
            iconSize: [34, 34],
            iconAnchor: [17, 17]
          });
          const shelterMarker = L.marker(endCoords, { icon: shelterIcon, riseOnHover: true });
          shelterMarker.bindTooltip(
            tip('Target relief shelter', [tipRow('Shelter', evacuationRoute.destinationShelterName)], SAFE_STRONG)
          );
          layerGroup.addLayer(shelterMarker);
        }
      }

      // Compact Hazard Avoidance Pin at Guindy Subway. Critical: stays black.
      const hazardSubwayCoords: [number, number] = [13.0067, 80.2117];
      const hazardIcon = L.divIcon({
        html: mapPin(glyph('stop', 17), { size: 30, round: true, solid: true, offset: fanOut(hazardSubwayCoords[0], hazardSubwayCoords[1]) }),
        className: 'hazard-subway-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      const hazardMarker = L.marker(hazardSubwayCoords, { icon: hazardIcon, riseOnHover: true });
      hazardMarker.bindTooltip(
        tip('Guindy railway subway', [
          tipRow('Severity', 'Critical'),
          tipRow('Water level', '3.2 ft (impassable)'),
          tipRow('Reroute', 'Taramani Link Road')
        ])
      );
      layerGroup.addLayer(hazardMarker);
    }

    // 8. Render Sentinel-1 Synthetic Aperture Radar (SAR) Water Inundation Polygon Overlays
    if (showSentinelSAR && sarData && sarData.features && Array.isArray(sarData.features)) {
      sarData.features.forEach((feat: any) => {
        if (feat && feat.geometry && Array.isArray(feat.geometry.coordinates) && feat.geometry.coordinates[0]) {
          const latLngs = feat.geometry.coordinates[0]
            .map((coord: number[]) => [Number(coord[1]), Number(coord[0])])
            .filter(([lat, lng]: number[]) => !isNaN(lat) && !isNaN(lng)) as [number, number][];
          if (latLngs.length >= 3) {
            // Raw radar backscatter, not a semantic state — stays greyscale.
            const sarPolygon = L.polygon(latLngs, {
              color: SUBTLE,
              weight: 1.5,
              fillColor: INK,
              fillOpacity: 0.08,
              dashArray: '6 6'
            });

            sarPolygon.bindTooltip(
              tip('Sentinel-1 SAR inundation', [
                tipRow('Zone', feat.properties?.riskZone || 'Adyar Basin'),
                tipRow('Backscatter', `${feat.properties?.backscatterDb ?? -18.4} dB`),
                tipRow('Est. depth', `${feat.properties?.inundationDepthMeters ?? 1.2} m`),
                tipRow('Area', `${feat.properties?.areaSqKm ?? 3.4} sq km`)
              ])
            );

            layerGroup.addLayer(sarPolygon);
          }
        }
      });
    }

    // 9. Render NASA FIRMS Satellite Thermal & High-Reflectance Hotspots
    if (showNASAFIRMS && firmsData && firmsData.hotspots && Array.isArray(firmsData.hotspots)) {
      firmsData.hotspots.forEach((hs: any) => {
        if (!hs) return;
        const lat = Number(hs.lat);
        const lng = Number(hs.lng);
        if (isNaN(lat) || isNaN(lng)) return;

        const firmsIcon = L.divIcon({
          html: mapPin(glyph('flame', 18), { size: 34, round: true, offset: fanOut(lat, lng) }),
          className: 'nasa-firms-icon',
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });

        const firmsMarker = L.marker([lat, lng], { icon: firmsIcon, riseOnHover: true });
        firmsMarker.bindTooltip(
          tip('NASA FIRMS thermal anomaly', [
            tipRow('Satellite', hs.satellite || 'VIIRS'),
            tipRow('Location', hs.locationName || 'Chennai Zone'),
            tipRow('Brightness', `${hs.brightnessKelvin || 310} K`),
            tipRow('Confidence', `${hs.confidencePct || 92}% verified`)
          ])
        );

        layerGroup.addLayer(firmsMarker);
      });
    }

  }, [
    zones,
    sensors,
    resources,
    shelters,
    hospitals,
    reports,
    evacuationRoute,
    timeHorizon,
    showZones,
    showInundation,
    showSensors,
    showResources,
    showShelters,
    showHospitals,
    showReports,
    showRoute,
    showSentinelSAR,
    showNASAFIRMS,
    sarData,
    firmsData
  ]);

  /* One shape for every button in the right-hand control column: a 32px
     square glass segment. Icon-only, so each carries a title + aria-label. */
  const chromeBtn =
    'glass-seg glass--interactive w-8 h-8 flex items-center justify-center shrink-0 cursor-pointer';

  const basemapStyles = [
    { id: 'light', label: 'Light' },
    { id: 'minimal', label: 'Minimal' },
    { id: 'satellite', label: 'Satellite' },
    { id: 'streets', label: 'Streets' },
  ];

  return (
    <div className="relative w-full h-full min-h-[450px] bg-paper overflow-hidden">

      {/* Main map canvas — fills the whole frame now that the legend bar has
          gone. All chrome below floats over it as glass. */}
      <div ref={mapContainerRef} className="absolute inset-0 z-10" />

      {/* ── Cluster 1 · top-left — time ─────────────────────────────────── */}
      <div className="glass glass-pill absolute top-3 left-3 z-30 flex items-center gap-0.5 pl-2.5 pr-1.5 py-1.5">
        <Clock className="w-3.5 h-3.5 text-subtle shrink-0" strokeWidth={1.5} />
        <span className="text--eyebrow text-muted hidden md:inline px-1">Timeline</span>
        {[
          { id: 'live', label: 'NOW' },
          { id: '30m', label: '+30m' },
          { id: '1h', label: '+1h' },
          { id: '2h', label: '+2h' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTimeHorizon(t.id as any)}
            aria-pressed={timeHorizon === t.id}
            title={`Forecast horizon ${t.label}`}
            className={`glass-seg px-2.5 py-1 text-[12px] leading-[1.4] tabular-nums cursor-pointer ${
              timeHorizon === t.id ? 'glass-seg--active' : 'text-subtle hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Cluster 2 · top-right — view controls ───────────────────────
          One column replaces the four boxes that used to float here, and
          Leaflet's own zoom widget (disabled at init) is now the +/− pair at
          the top of it, so nothing can clip it. Popovers are siblings of the
          stack, never children: glass must not nest inside glass. */}
      <div className="absolute top-3 right-3 z-30 flex items-start gap-2">

        <div className="flex flex-col items-end gap-2">
          {isStylesOpen && (
            <div className="glass glass--raised w-44 max-w-[calc(100vw-6rem)] p-1.5">
              <span className="text--eyebrow text-muted block px-2 pt-1 pb-2">Basemap style</span>
              <div className="glass-rule h-px mb-1.5" />
              {basemapStyles.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setMapTileStyle(s.id as any);
                    setIsStylesOpen(false);
                  }}
                  className={`glass-seg w-full text-left px-2.5 py-1.5 text-[11px] leading-none uppercase tracking-[0.08em] cursor-pointer ${
                    mapTileStyle === s.id ? 'glass-seg--active' : 'text-subtle hover:text-ink'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {isLayersOpen && (
            <div className="glass glass--raised w-64 max-w-[calc(100vw-6rem)] p-2">
              <div className="flex items-center justify-between gap-3 px-1 pb-2">
                <span className="text--eyebrow text-muted">GIS map layers</span>
                <button
                  onClick={() => {
                    const allActive = activeLayersCount === 10;
                    setShowZones(!allActive);
                    setShowInundation(!allActive);
                    setShowSensors(!allActive);
                    setShowResources(!allActive);
                    setShowShelters(!allActive);
                    setShowHospitals(!allActive);
                    setShowReports(!allActive);
                    setShowRoute(!allActive);
                    setShowSentinelSAR(!allActive);
                    setShowNASAFIRMS(!allActive);
                  }}
                  className="text--footnote text-subtle hover:text-ink underline underline-offset-2 cursor-pointer"
                >
                  {activeLayersCount === 10 ? 'Hide all' : 'Show all'}
                </button>
              </div>
              <div className="glass-rule h-px mb-1.5" />

              <div className="space-y-0.5 max-h-64 overflow-y-auto no-scrollbar">
                {/* `swatch` mirrors the colour the layer is actually drawn in. */}
                {[
                  { label: 'Risk Zones', state: showZones, toggle: () => setShowZones(!showZones), swatch: 'bg-ink' },
                  { label: 'Flood Inundation', state: showInundation, toggle: () => setShowInundation(!showInundation), swatch: 'bg-info' },
                  { label: 'IoT Telemetry Sensors', state: showSensors, toggle: () => setShowSensors(!showSensors), swatch: 'bg-ink' },
                  { label: 'Fleet & Rescue Units', state: showResources, toggle: () => setShowResources(!showResources), swatch: 'bg-ink' },
                  { label: 'Relief Shelters', state: showShelters, toggle: () => setShowShelters(!showShelters), swatch: 'bg-safe' },
                  { label: 'Hospitals & Medical', state: showHospitals, toggle: () => setShowHospitals(!showHospitals), swatch: 'bg-info' },
                  { label: 'Citizen SOS Reports', state: showReports, toggle: () => setShowReports(!showReports), swatch: 'bg-ink' },
                  { label: 'Safe Evacuation Corridor', state: showRoute, toggle: () => setShowRoute(!showRoute), swatch: 'bg-safe' },
                  { label: 'Sentinel SAR Radar', state: showSentinelSAR, toggle: () => setShowSentinelSAR(!showSentinelSAR), swatch: 'bg-ink' },
                  { label: 'NASA FIRMS Thermal', state: showNASAFIRMS, toggle: () => setShowNASAFIRMS(!showNASAFIRMS), swatch: 'bg-ink' },
                ].map((layer, idx) => (
                  <button
                    key={idx}
                    onClick={layer.toggle}
                    aria-pressed={layer.state}
                    className={`glass-seg w-full flex items-center justify-between gap-3 px-2 py-1.5 text-[12px] leading-[1.4] cursor-pointer ${
                      layer.state ? 'glass-seg--active' : 'text-subtle hover:text-ink'
                    }`}
                  >
                    <span className="text-left">{layer.label}</span>
                    <span
                      className={`w-2.5 h-2.5 rounded-[1px] shrink-0 transition-colors duration-[250ms] ease-[cubic-bezier(.23,1,.32,1)] ${
                        layer.state ? layer.swatch : 'border border-muted'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* The one control column: zoom · view · popovers. */}
        <div className="glass flex flex-col items-center gap-1 p-1 shrink-0">
          <button
            onClick={handleZoomIn}
            className={`${chromeBtn} text-subtle hover:text-ink`}
            title="Zoom in"
            aria-label="Zoom in"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={handleZoomOut}
            className={`${chromeBtn} text-subtle hover:text-ink`}
            title="Zoom out"
            aria-label="Zoom out"
          >
            <Minus className="w-4 h-4" strokeWidth={1.5} />
          </button>

          <div className="glass-rule h-px w-6 my-0.5" />

          <button
            onClick={handleRecenterMap}
            className={`${chromeBtn} text-subtle hover:text-ink`}
            title="Recenter map view"
            aria-label="Recenter map view"
          >
            <Crosshair className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => {
              setIsMeasuring(!isMeasuring);
              if (isMeasuring) setMeasurePoints([]);
            }}
            aria-pressed={isMeasuring}
            className={`${chromeBtn} ${isMeasuring ? 'glass-seg--active' : 'text-subtle hover:text-ink'}`}
            title={isMeasuring ? 'Stop measuring · clears points' : 'Measure distances'}
            aria-label="Measure distances"
          >
            <Ruler className="w-4 h-4" strokeWidth={1.5} />
          </button>

          <div className="glass-rule h-px w-6 my-0.5" />

          <button
            onClick={() => {
              setIsStylesOpen(!isStylesOpen);
              setIsLayersOpen(false);
            }}
            aria-expanded={isStylesOpen}
            className={`${chromeBtn} ${isStylesOpen ? 'glass-seg--active' : 'text-subtle hover:text-ink'}`}
            title={`Basemap style · ${mapTileStyle}`}
            aria-label="Basemap style"
          >
            <MapIcon className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => {
              setIsLayersOpen(!isLayersOpen);
              setIsStylesOpen(false);
            }}
            aria-expanded={isLayersOpen}
            className={`${chromeBtn} ${isLayersOpen ? 'glass-seg--active' : 'text-subtle hover:text-ink'}`}
            title={`GIS map layers · ${activeLayersCount} of 10 active`}
            aria-label="GIS map layers"
          >
            <Layers className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* ── Cluster 3 · bottom-left — evacuation route + legend ─────────
          Two sibling glass elements in one column. The legend is its own
          chip rather than a child of the card: glass never nests in glass. */}
      <div className="absolute bottom-3 left-3 z-30 flex flex-col items-start gap-2 max-w-[calc(100%-1.5rem)] pointer-events-none">

        {/* Collapsible legend. Every mark below is actually drawn on the map:
            green = the way out, blue = water, black = critical. */}
        {isLegendOpen ? (
          <div className="glass glass--raised pointer-events-auto w-60 max-w-full p-2.5">
            <div className="flex items-center justify-between gap-3 pb-2">
              <span className="text--eyebrow text-muted">Legend</span>
              <button
                onClick={() => setIsLegendOpen(false)}
                className="glass-seg glass--interactive text-muted hover:text-ink p-1 cursor-pointer"
                title="Collapse legend"
                aria-label="Collapse legend"
              >
                <Minus className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
            <div className="glass-rule h-px" />
            <div className="pt-2 space-y-1.5">
              <span className="flex items-center gap-2">
                <span className="sev-mark sev-mark--critical shrink-0" />
                <span className="text--footnote text-near">Critical zone</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="sev-mark sev-mark--advisory shrink-0" />
                <span className="text--footnote text-near">Advisory zone</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-[1px] border border-info bg-info-wash shrink-0" />
                <span className="text--footnote text-near">Flood inundation</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-[2px] bg-safe shrink-0" />
                <span className="text--footnote text-near">Evacuation route</span>
              </span>
              <span className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full border border-emerald-500 bg-white flex items-center justify-center shrink-0 text-emerald-600"
                  dangerouslySetInnerHTML={{ __html: glyph('school', 9) }}
                />
                <span className="text--footnote text-near">Shelter · space free</span>
              </span>
              <span className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full border border-sky-500 bg-white flex items-center justify-center shrink-0 text-sky-600"
                  dangerouslySetInnerHTML={{ __html: glyph('hospital', 9) }}
                />
                <span className="text--footnote text-near">Hospital</span>
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsLegendOpen(true)}
            className="glass glass-pill glass--interactive pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 cursor-pointer"
            title="Show map legend"
            aria-label="Show map legend"
          >
            <Info className="w-3.5 h-3.5 text-subtle shrink-0" strokeWidth={1.5} />
            <span className="text--eyebrow text-muted">Legend</span>
          </button>
        )}

        {/* Floating Interactive Evacuation Route Controller */}
        <div
          className={`glass glass--raised pointer-events-auto transition-all duration-[250ms] ease-[cubic-bezier(.23,1,.32,1)] ${
            isRouteEngineMinimized ? 'w-auto min-w-[230px]' : 'w-72 sm:w-80'
          }`}
        >
          {/* The scroll lives on an inner element so the glass rim, which is
              painted on the container, never scrolls out of view. */}
          <div className={`no-scrollbar ${isRouteEngineMinimized ? 'p-2' : 'p-3 space-y-3 max-h-[52vh] overflow-y-auto'}`}>
            <div className="flex items-center justify-between gap-2">
            <div
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => setIsRouteEngineMinimized(!isRouteEngineMinimized)}
            >
              <Navigation className="w-3.5 h-3.5 text-safe shrink-0" strokeWidth={1.5} />
              <span className="text--body-medium text-ink">Safe Evacuation Route</span>
              {evacuationRoute && isRouteEngineMinimized && (
                <span className="badge badge--safe tabular-nums">{evacuationRoute.safetyScorePct}% Safe</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsRouteEngineMinimized(!isRouteEngineMinimized)}
                className="flex items-center gap-1 px-1.5 py-1 rounded-[3px] text-[11px] leading-none uppercase tracking-[0.08em] font-medium text-muted hover:text-ink hover:bg-wash transition-colors duration-[250ms] ease-[cubic-bezier(.23,1,.32,1)] cursor-pointer"
                title={isRouteEngineMinimized ? "Expand Route Panel" : "Minimize Panel"}
              >
                <span>{isRouteEngineMinimized ? 'Expand' : 'Minimize'}</span>
                {isRouteEngineMinimized ? <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} /> : <Minus className="w-3.5 h-3.5" strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          {!isRouteEngineMinimized && (
            <>
              <div className="glass-rule h-px" />
              {/* Origin Selection */}
              <div className="space-y-1.5">
                <label className="text--eyebrow text-muted block">Origin point</label>
                <div className="flex gap-1.5">
                  <select
                    value={routeOriginName}
                    onChange={(e) => {
                      const name = e.target.value;
                      setRouteOriginName(name);
                      const presets: Record<string, [number, number]> = {
                        'Velachery 100ft Road (Vijaya Nagar Junction)': [12.9785, 80.2205],
                        'Guindy Railway Station Corridor': [13.0067, 80.2117],
                        'Kotturpuram Adyar River Bank': [13.0231, 80.2411],
                        'Taramani 100ft Canal Link Road': [12.9863, 80.2432]
                      };
                      const coords = presets[name] || routeOriginCoords;
                      setRouteOriginCoords(coords);
                      if (onCalculateEvacuationRoute) {
                        onCalculateEvacuationRoute(name, coords, selectedShelterId);
                      }
                    }}
                    className="flex-1 min-w-0 bg-paper border border-line rounded-[3px] text--footnote text-near p-1.5 focus:outline-none focus:border-muted cursor-pointer"
                  >
                    <option value="Velachery 100ft Road (Vijaya Nagar Junction)">Velachery 100ft Rd</option>
                    <option value="Guindy Railway Station Corridor">Guindy Station</option>
                    <option value="Kotturpuram Adyar River Bank">Kotturpuram Adyar</option>
                    <option value="Taramani 100ft Canal Link Road">Taramani Link Rd</option>
                    {routeOriginName.startsWith('GPS Pin') || routeOriginName.startsWith('Citizen') ? (
                      <option value={routeOriginName}>{routeOriginName}</option>
                    ) : null}
                  </select>

                  <button
                    onClick={() => setIsClickToPickOrigin(!isClickToPickOrigin)}
                    title="Click on the map to place origin pin"
                    className={`px-2 py-1 rounded-[3px] border text-[11px] leading-none uppercase tracking-[0.08em] font-medium transition-colors duration-[250ms] ease-[cubic-bezier(.23,1,.32,1)] flex items-center gap-1 cursor-pointer shrink-0 ${
                      isClickToPickOrigin
                        ? 'bg-ink text-paper border-ink'
                        : 'bg-paper text-muted border-line hover:text-ink hover:border-muted'
                    }`}
                  >
                    <Crosshair className="w-3 h-3" strokeWidth={1.5} />
                    <span>{isClickToPickOrigin ? 'Click map' : 'Pin'}</span>
                  </button>
                </div>
              </div>

              {/* Destination Shelter Selection */}
              <div className="space-y-1.5">
                <label className="text--eyebrow text-muted block">Destination shelter</label>
                <select
                  value={selectedShelterId}
                  onChange={(e) => {
                    const shId = e.target.value;
                    setSelectedShelterId(shId);
                    if (onCalculateEvacuationRoute) {
                      onCalculateEvacuationRoute(routeOriginName, routeOriginCoords, shId);
                    }
                  }}
                  className="w-full bg-paper border border-line rounded-[3px] text--footnote text-near p-1.5 focus:outline-none focus:border-muted cursor-pointer"
                >
                  {(shelters || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.totalCapacity - s.currentOccupancy} beds)
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  if (onCalculateEvacuationRoute) {
                    onCalculateEvacuationRoute(routeOriginName, routeOriginCoords, selectedShelterId);
                  }
                }}
                disabled={isCalculatingRoute}
                className="cta cta--primary cta--mini w-full justify-center gap-1.5 disabled:opacity-50"
              >
                {isCalculatingRoute ? (
                  <span>Computing safe path…</span>
                ) : (
                  <>
                    <Navigation className="w-3 h-3" strokeWidth={1.5} />
                    <span>Calculate safe route</span>
                  </>
                )}
              </button>

              {/* Active Route Summary Card */}
              {evacuationRoute && (
                <div className="panel--wash p-2.5 space-y-2">
                  <div className="flex items-start justify-between gap-3 border-b border-line pb-2">
                    <div className="min-w-0">
                      <span className="text--eyebrow text-muted block">Destination</span>
                      <span className="text-[12px] leading-[1.4] text-ink font-medium block mt-1 truncate">
                        {evacuationRoute.destinationShelterName}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text--subtitle3 text-safe-strong block leading-none tabular-nums">
                        {evacuationRoute.safetyScorePct}%
                      </span>
                      <span className="text--eyebrow text-muted block mt-1">Safety index</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text--footnote">
                    <div className="flex justify-between gap-2 text-muted">
                      <span>Distance</span>
                      <span className="text-ink font-medium tabular-nums">{evacuationRoute.distanceKm} km</span>
                    </div>
                    <div className="flex justify-between gap-2 text-muted">
                      <span>Est. time</span>
                      <span className="text-ink font-medium tabular-nums">{evacuationRoute.estimatedTimeMinutes} mins</span>
                    </div>
                  </div>

                  <button
                    onClick={handleOpenGoogleMaps}
                    className="cta cta--secondary cta--mini w-full justify-center gap-1.5"
                    title="Open in Google Maps"
                  >
                    <Navigation className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>Google Maps navigation</span>
                    <span className="cta__arrow">→</span>
                  </button>
                </div>
              )}
            </>
          )}
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {imagePreviewUrl && (
        <div className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4">
          <div className="panel relative max-w-3xl w-full p-3 space-y-3">
            <div className="flex justify-between items-center border-b border-line pb-2">
              <span className="text--eyebrow text-muted">Citizen field report attachment</span>
              <button
                onClick={() => setImagePreviewUrl(null)}
                className="text-muted hover:text-ink p-1 rounded-[3px] hover:bg-wash transition-colors duration-[250ms] ease-[cubic-bezier(.23,1,.32,1)] cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
            <img src={imagePreviewUrl} alt="Enlarged Report" className="w-full max-h-[70vh] object-contain rounded-[3px]" />
          </div>
        </div>
      )}

      {/* Selected Item Inspector Panel */}
      {selectedItem && (
        <div className="glass glass--raised absolute bottom-16 left-3 right-3 md:left-auto md:right-3 md:w-96 z-40 p-3">
          <div className="flex items-start justify-between gap-3 border-b border-line pb-2.5 mb-2.5">
            <div className="min-w-0">
              <span className="badge badge--quiet">{selectedItem.type} inspector</span>
              <h3 className="text--subtitle3 text-ink mt-2 truncate">
                {selectedItem.data.name || selectedItem.data.locationName || 'Selected Item'}
              </h3>
            </div>
            <button
              onClick={() => setSelectedItem(null)}
              className="text-muted hover:text-ink p-1 rounded-[3px] hover:bg-wash transition-colors duration-[250ms] ease-[cubic-bezier(.23,1,.32,1)] cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>

          {/* Details by Type */}
          {selectedItem.type === 'zone' && (
            <div className="text--footnote">
              <div className="flex justify-between gap-4 py-1.5 border-b border-line">
                <span className="text--eyebrow text-muted">Risk score</span>
                <span className="text-ink font-medium tabular-nums">{selectedItem.data.riskScore}/100</span>
              </div>
              <div className="flex justify-between gap-4 py-1.5 border-b border-line">
                <span className="text--eyebrow text-muted">Current water depth</span>
                <span className="text-ink font-medium tabular-nums">{selectedItem.data.currentWaterLevelMeters} m</span>
              </div>
              <div className="flex justify-between gap-4 py-1.5 border-b border-line">
                <span className="text--eyebrow text-muted">Predicted +1h depth</span>
                <span className="text-ink font-medium tabular-nums">{selectedItem.data.predictedWaterLevel1h} m</span>
              </div>
              <div className="flex justify-between gap-4 py-1.5 border-b border-line">
                <span className="text--eyebrow text-muted">Population at risk</span>
                <span className="text-ink font-medium tabular-nums">{selectedItem.data.populationAtRisk?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between gap-4 py-1.5">
                <span className="text--eyebrow text-muted">Lead time to inundation</span>
                <span className="text-ink font-medium tabular-nums">{selectedItem.data.estimatedTimeToInundationMin} mins</span>
              </div>
              {onSelectZone && (
                <button
                  onClick={() => {
                    onSelectZone(selectedItem.data.id);
                    setSelectedItem(null);
                  }}
                  className="cta cta--primary cta--mini w-full justify-center gap-2 mt-3"
                >
                  <ShieldAlert className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Dispatch fleet unit to sector</span>
                </button>
              )}
            </div>
          )}

          {selectedItem.type === 'sensor' && (
            <div className="text--footnote">
              <div className="flex justify-between gap-4 py-1.5 border-b border-line">
                <span className="text--eyebrow text-muted">Sensor ID</span>
                <span className="text-ink font-medium">{selectedItem.data.id}</span>
              </div>
              <div className="flex justify-between gap-4 py-1.5 border-b border-line">
                <span className="text--eyebrow text-muted">Telemetry reading</span>
                <span className="text-ink font-medium tabular-nums">{selectedItem.data.currentValue} {selectedItem.data.unit}</span>
              </div>
              <div className="flex justify-between gap-4 py-1.5 border-b border-line">
                <span className="text--eyebrow text-muted">Critical threshold</span>
                <span className="text-near tabular-nums">{selectedItem.data.thresholdCritical} {selectedItem.data.unit}</span>
              </div>
              <div className="flex justify-between gap-4 py-1.5">
                <span className="text--eyebrow text-muted">Status</span>
                <span className="text-ink font-medium tabular-nums">{selectedItem.data.batteryPct}% bat · {selectedItem.data.signalPct}% sig</span>
              </div>
            </div>
          )}

          {selectedItem.type === 'resource' && (
            <div className="text--footnote">
              <div className="flex justify-between gap-4 py-1.5 border-b border-line">
                <span className="text--eyebrow text-muted">Fleet unit</span>
                <span className="text-ink font-medium">{selectedItem.data.name}</span>
              </div>
              <div className="flex justify-between gap-4 py-1.5 border-b border-line">
                <span className="text--eyebrow text-muted">Status</span>
                <span className="text-ink font-medium uppercase">{selectedItem.data.status}</span>
              </div>
              <div className="flex justify-between gap-4 py-1.5 border-b border-line">
                <span className="text--eyebrow text-muted">Crew size</span>
                <span className="text-near">{selectedItem.data.crewCount} personnel</span>
              </div>
              <div className="flex justify-between gap-4 py-1.5">
                <span className="text--eyebrow text-muted">Equipment</span>
                <span className="text-near text-right">{selectedItem.data.equipment?.join(', ')}</span>
              </div>
            </div>
          )}

          {selectedItem.type === 'shelter' && (
            <div className="text--footnote">
              <div className="flex justify-between gap-4 py-1.5 border-b border-line">
                <span className="text--eyebrow text-muted">Address</span>
                <span className="text-near text-right">{selectedItem.data.address}</span>
              </div>
              <div className="flex justify-between gap-4 py-1.5 border-b border-line">
                <span className="text--eyebrow text-muted">Capacity utilization</span>
                <span className="text-ink font-medium tabular-nums">{selectedItem.data.currentOccupancy} / {selectedItem.data.totalCapacity}</span>
              </div>
              <div className="flex justify-between gap-4 py-1.5">
                <span className="text--eyebrow text-muted">Rations</span>
                <span className="text-ink font-medium">{selectedItem.data.foodSuppliesDays} days supply</span>
              </div>
            </div>
          )}

          {selectedItem.type === 'hospital' && (
            <div className="text--footnote">
              <div className="flex justify-between gap-4 py-1.5 border-b border-line">
                <span className="text--eyebrow text-muted">Status</span>
                <span className="text-ink font-medium uppercase">{selectedItem.data.status}</span>
              </div>
              <div className="flex justify-between gap-4 py-1.5 border-b border-line">
                <span className="text--eyebrow text-muted">Capacity</span>
                <span className="text-ink font-medium tabular-nums">
                  {selectedItem.data.totalCapacity ?? selectedItem.data.total_beds ?? 0} total beds
                </span>
              </div>
              <div className="flex justify-between gap-4 py-1.5">
                <span className="text--eyebrow text-muted">Available ICU</span>
                <span className="text-ink font-medium tabular-nums">
                  {selectedItem.data.icuBedsAvailable ?? selectedItem.data.available_icu_beds ?? 0} beds
                </span>
              </div>
            </div>
          )}
          {selectedItem.type === 'report' && (
            <div className="text--footnote space-y-2">
              <div>
                <div className="flex justify-between gap-4 py-1.5 border-b border-line">
                  <span className="text--eyebrow text-muted">Reporter</span>
                  <span className="text-ink font-medium text-right">{selectedItem.data.reporterName || 'Anonymous Citizen'} ({selectedItem.data.phone || '108/112'})</span>
                </div>
                <div className="flex justify-between gap-4 py-1.5 border-b border-line">
                  <span className="text--eyebrow text-muted">Incident category</span>
                  <span className="text-ink font-medium uppercase">{selectedItem.data.category}</span>
                </div>
                <div className="flex justify-between gap-4 py-1.5 border-b border-line">
                  <span className="text--eyebrow text-muted">AI credibility score</span>
                  <span className="text-ink font-medium flex items-center gap-1.5 tabular-nums">
                    <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} /> {selectedItem.data.aiValidationScore || 94}% verified
                  </span>
                </div>
              </div>
              <p className="panel--wash text-near p-2 text--footnote">
                “{selectedItem.data.description || 'Citizen hazard report'}”
              </p>

              {selectedItem.data.imageUrl && (
                <div className="pt-1">
                  <span className="text--eyebrow text-muted block mb-1.5">Attached incident photo</span>
                  <img
                    src={selectedItem.data.imageUrl}
                    alt="Citizen report photo"
                    onClick={() => setImagePreviewUrl(selectedItem.data.imageUrl)}
                    className="w-full h-24 object-cover rounded-[3px] border border-line cursor-pointer hover:opacity-90 transition-opacity duration-[250ms] ease-[cubic-bezier(.23,1,.32,1)]"
                  />
                </div>
              )}

              {onCalculateEvacuationRoute && (
                <button
                  onClick={() => {
                    const rName = selectedItem.data.locationName || selectedItem.data.reporterName || 'Citizen Report Incident';
                    const rCoords: [number, number] = [selectedItem.data.lat, selectedItem.data.lng];
                    setRouteOriginName(rName);
                    setRouteOriginCoords(rCoords);
                    onCalculateEvacuationRoute(rName, rCoords, selectedShelterId);
                  }}
                  className="cta cta--secondary cta--mini w-full justify-center gap-2 mt-1"
                >
                  <Navigation className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Route evacuation from here</span>
                </button>
              )}
            </div>
          )}

        </div>
      )}

      {/* Map centre coordinates — the only survivor of the old footer bar,
          now a floating pill inside the map so the map keeps that height. */}
      <div className="glass glass-pill absolute bottom-8 right-3 z-30 flex items-center gap-2 px-3 py-1.5">
        <span className="text--eyebrow text-muted hidden sm:inline">Coordinates</span>
        <span className="text--footnote text-near tabular-nums">12.9784° N, 80.2185° E</span>
      </div>

    </div>
  );
};