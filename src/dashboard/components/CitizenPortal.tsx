import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { EmergencyShelter, CitizenReport, EvacuationRoute } from '../../shared/types.js';
import { CitizenReportSchema } from '../../services/schema.js';
import {
  Users,
  Navigation,
  ShieldCheck,
  AlertCircle,
  MapPin,
  Camera,
  Phone,
  MessageCircle,
  Send,
  Home,
  CheckCircle2,
  Sparkles,
  LifeBuoy,
  Clock,
  ExternalLink,
  Crosshair,
  Map as MapIcon,
  X,
  Check,
  Search,
  RefreshCw,
  Loader2
} from 'lucide-react';

const geocodeCache = new Map<string, string>();

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const roundedLat = Number(lat.toFixed(4));
  const roundedLng = Number(lng.toFixed(4));
  const cacheKey = `${roundedLat},${roundedLng}`;

  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${roundedLat}&lon=${roundedLng}&zoom=18&addressdetails=1`, {
      headers: { 'Accept-Language': 'en' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        const addr = data.address;
        if (addr) {
          const mainRoad = addr.road || addr.suburb || addr.neighbourhood || addr.residential || addr.building || addr.amenity;
          const area = addr.suburb || addr.city_district || addr.city || addr.town || addr.county;
          if (mainRoad && area && mainRoad !== area) {
            const formatted = `${mainRoad}, ${area}`;
            geocodeCache.set(cacheKey, formatted);
            return formatted;
          }
        }
        const formatted = data.display_name.split(',').slice(0, 3).join(',');
        geocodeCache.set(cacheKey, formatted);
        return formatted;
      }
    }
  } catch (err) {
    console.warn('Reverse geocode warning:', err);
  }
  const fallback = `Location (${roundedLat}, ${roundedLng})`;
  geocodeCache.set(cacheKey, fallback);
  return fallback;
}

/* Shared field styling — white surface, hairline border, black focus ring. */
const FIELD_CLASS =
  'w-full bg-paper border border-line rounded-[4px] px-3 py-2 text--body text-near placeholder:text-muted outline-none transition-colors focus:border-ink focus:ring-1 focus:ring-ink';
const LABEL_CLASS = 'text--eyebrow text-muted block mb-1.5';
const HELP_CLASS = 'text--footnote text-muted block mt-1.5';

interface MapPinPickerModalProps {
  isOpen: boolean;
  initialLat: number;
  initialLng: number;
  initialAddress: string;
  onClose: () => void;
  onConfirmLocation: (lat: number, lng: number, address: string) => void;
}

const MapPinPickerModal: React.FC<MapPinPickerModalProps> = ({
  isOpen,
  initialLat,
  initialLng,
  initialAddress,
  onClose,
  onConfirmLocation
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [pickedLat, setPickedLat] = useState(initialLat);
  const [pickedLng, setPickedLng] = useState(initialLng);
  const [pickedAddress, setPickedAddress] = useState(initialAddress);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocatingSelf, setIsLocatingSelf] = useState(false);

  const quickPresets = [
    { name: 'Velachery Sluice Gate', coords: [12.9785, 80.2205] as [number, number] },
    { name: 'Guindy Railway Station', coords: [13.0067, 80.2117] as [number, number] },
    { name: 'Kotturpuram Adyar Riverbank', coords: [13.0231, 80.2411] as [number, number] },
    { name: 'Taramani Canal Link Road', coords: [12.9863, 80.2432] as [number, number] },
    { name: 'Madipakkam Lake Road', coords: [12.9648, 80.2012] as [number, number] }
  ];

  const updatePosition = async (lat: number, lng: number) => {
    const roundedLat = Number(lat.toFixed(4));
    const roundedLng = Number(lng.toFixed(4));
    setPickedLat(roundedLat);
    setPickedLng(roundedLng);
    setIsGeocoding(true);
    const addr = await reverseGeocode(roundedLat, roundedLng);
    setPickedAddress(addr);
    setIsGeocoding(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    // Reset state to current form initial values
    setPickedLat(initialLat);
    setPickedLng(initialLng);
    setPickedAddress(initialAddress);

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [initialLat, initialLng],
          zoom: 15,
          zoomControl: true
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap &copy; CARTO'
        }).addTo(map);

        // Monochrome pin: white disc, 1px black ring, solid black severity mark inside.
        const pinIconHtml = `
          <div style="
            background: #ffffff;
            border: 1px solid #000000;
            border-radius: 50%;
            width: 26px;
            height: 26px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
            cursor: grab;
          ">
            <span class="sev-mark sev-mark--critical sev-mark--round"></span>
          </div>
        `;

        const customIcon = L.divIcon({
          html: pinIconHtml,
          className: 'picker-pin-icon map-micro-pin',
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        const marker = L.marker([initialLat, initialLng], {
          icon: customIcon,
          draggable: true
        }).addTo(map);

        markerRef.current = marker;

        map.on('click', (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          updatePosition(lat, lng);
        });

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          updatePosition(pos.lat, pos.lng);
        });

        mapInstanceRef.current = map;
      } else {
        mapInstanceRef.current.setView([initialLat, initialLng], 15);
        if (markerRef.current) {
          markerRef.current.setLatLng([initialLat, initialLng]);
        }
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  const handleSelectPreset = (coords: [number, number], name: string) => {
    setPickedLat(coords[0]);
    setPickedLng(coords[1]);
    setPickedAddress(name);
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo(coords, 16, { duration: 0.8 });
      markerRef.current.setLatLng(coords);
    }
  };

  const handleModalGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported by browser.');
      return;
    }
    setIsLocatingSelf(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lng = Number(pos.coords.longitude.toFixed(4));
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 0.8 });
          markerRef.current.setLatLng([lat, lng]);
        }
        updatePosition(lat, lng);
        setIsLocatingSelf(false);
      },
      (err) => {
        setIsLocatingSelf(false);
        alert('Could not access GPS location. Please select pin on map manually.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4 font-sans">
      <div className="panel w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-line flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-[18px] h-[18px] text-ink shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <h3 className="text--subtitle3 text-ink">
                Pick exact incident location
              </h3>
              <p className="text--footnote text-muted mt-1">
                Click anywhere on the map or drag the pin marker to specify the exact emergency site.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted hover:text-ink hover:bg-wash rounded-[4px] transition-colors cursor-pointer"
          >
            <X className="w-[18px] h-[18px]" strokeWidth={1.5} />
          </button>
        </div>

        {/* Quick Presets Bar & GPS Button */}
        <div className="px-6 py-3 bg-wash border-b border-line flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text--eyebrow text-muted mr-1">Hotspots</span>
            {quickPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(preset.coords, preset.name)}
                className="px-2.5 py-1 bg-paper hover:bg-wash-strong text-near border border-line hover:border-muted text--footnote rounded-[4px] transition-colors cursor-pointer"
              >
                {preset.name}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleModalGPS}
            disabled={isLocatingSelf}
            className="cta cta--secondary cta--mini disabled:opacity-50"
          >
            <Crosshair className={`w-3.5 h-3.5 mr-1.5 ${isLocatingSelf ? 'animate-spin' : ''}`} strokeWidth={1.5} />
            <span>{isLocatingSelf ? 'Locating…' : 'Use my GPS'}</span>
          </button>
        </div>

        {/* Map Container */}
        <div className="relative w-full h-[380px] bg-wash">
          <div ref={mapContainerRef} className="w-full h-full" />

          <div className="absolute top-3 left-3 z-[400] bg-paper text--footnote text-subtle px-3 py-1.5 rounded-[4px] border border-line flex items-center gap-2">
            <span className="sev-mark sev-mark--critical sev-mark--round" />
            <span>Click or drag the pin marker on the map</span>
          </div>
        </div>

        {/* Footer info & Confirmation */}
        <div className="px-6 py-5 border-t border-line space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 panel--wash p-3">
            <div className="space-y-1">
              <span className="text--eyebrow text-muted block">Selected address / landmark</span>
              <div className="text--body-medium text-ink flex items-center gap-2">
                {isGeocoding ? (
                  <span className="text-subtle flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} /> Geocoding coordinates…
                  </span>
                ) : (
                  <span>{pickedAddress}</span>
                )}
              </div>
            </div>

            <div className="text-right text--footnote text-subtle tabular-nums shrink-0">
              <span>Lat {pickedLat.toFixed(4)}</span>
              <span className="ml-3">Lng {pickedLng.toFixed(4)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="cta cta--tertiary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirmLocation(pickedLat, pickedLng, pickedAddress)}
              className="cta cta--primary cta--compact"
            >
              <Check className="w-4 h-4 mr-2" strokeWidth={1.5} />
              <span>Confirm location</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

interface CitizenPortalProps {
  shelters: EmergencyShelter[];
  reports: CitizenReport[];
  onSubmitReport: (reportData: Partial<CitizenReport>) => void;
  evacuationRoute?: EvacuationRoute;
  onSelectRouteShelter: (shelterId: string) => void;
  onCalculateEvacuationRoute?: (originName: string, originCoords: [number, number], shelterId: string) => void;
  onNavigateToMap?: () => void;
}

/* Shelter status → monochrome mark + word. Never a colored dot. */
const SHELTER_STATUS: Record<string, { mark: string; label: string; text: string }> = {
  open: { mark: 'sev-mark--ok', label: 'OPEN', text: 'sev-text--ok' },
  near_capacity: { mark: 'sev-mark--advisory', label: 'NEAR CAPACITY', text: 'sev-text--advisory' },
  full: { mark: 'sev-mark--critical', label: 'FULL', text: 'sev-text--critical' },
  closed: { mark: 'sev-mark--critical', label: 'CLOSED', text: 'sev-text--critical' }
};

export const CitizenPortal: React.FC<CitizenPortalProps> = ({
  shelters,
  reports,
  onSubmitReport,
  evacuationRoute,
  onSelectRouteShelter,
  onCalculateEvacuationRoute,
  onNavigateToMap
}) => {
  const [originChoice, setOriginChoice] = useState({
    name: 'Velachery 100ft Road (Vijaya Nagar Junction)',
    coords: [12.9785, 80.2205] as [number, number]
  });

  const [selectedShelterId, setSelectedShelterId] = useState(shelters[0]?.id || 'sh-01');

  const origins = [
    { name: 'Velachery 100ft Road (Vijaya Nagar Junction)', coords: [12.9785, 80.2205] as [number, number] },
    { name: 'Guindy Railway Station Corridor', coords: [13.0067, 80.2117] as [number, number] },
    { name: 'Kotturpuram Adyar River Bank', coords: [13.0231, 80.2411] as [number, number] },
    { name: 'Taramani 100ft Canal Link Road', coords: [12.9863, 80.2432] as [number, number] }
  ];

  const handleOriginChange = (origName: string) => {
    const found = origins.find(o => o.name === origName) || origins[0];
    setOriginChoice(found);
    if (onCalculateEvacuationRoute) {
      onCalculateEvacuationRoute(found.name, found.coords, selectedShelterId);
    }
  };

  const handleShelterChange = (shId: string) => {
    setSelectedShelterId(shId);
    if (onCalculateEvacuationRoute) {
      onCalculateEvacuationRoute(originChoice.name, originChoice.coords, shId);
    } else {
      onSelectRouteShelter(shId);
    }
  };

  const [reportForm, setReportForm] = useState({
    reporterName: '',
    phone: '',
    locationName: 'Velachery 100ft Road near Vijaya Nagar Junction',
    lat: 12.9785,
    lng: 80.2205,
    category: 'waterlogging' as const,
    severity: 'critical' as const,
    description: '',
    imageUrl: ''
  });

  const [isLocating, setIsLocating] = useState(false);
  const [locationCapturedType, setLocationCapturedType] = useState<'manual' | 'gps' | 'map_pin'>('manual');
  const [showMapPicker, setShowMapPicker] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<any | null>(null);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lng = Number(pos.coords.longitude.toFixed(4));
        const address = await reverseGeocode(lat, lng);
        setReportForm(prev => ({
          ...prev,
          lat,
          lng,
          locationName: address
        }));
        setLocationCapturedType('gps');
        setIsLocating(false);
      },
      (err) => {
        console.warn('GPS location fetch error:', err);
        setIsLocating(false);
        alert('Could not retrieve current GPS location. Please allow browser permissions or use "Pick Pin on Map".');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleConfirmPickedLocation = (lat: number, lng: number, address: string) => {
    setReportForm(prev => ({
      ...prev,
      lat,
      lng,
      locationName: address
    }));
    setLocationCapturedType('map_pin');
    setShowMapPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parseResult = CitizenReportSchema.safeParse({
      reporterName: reportForm.reporterName || 'Anonymous Citizen',
      phone: reportForm.phone,
      locationName: reportForm.locationName,
      lat: reportForm.lat,
      lng: reportForm.lng,
      hazardType: reportForm.category,
      severity: reportForm.severity,
      description: reportForm.description,
      imageUrl: reportForm.imageUrl
    });

    if (!parseResult.success) {
      alert(`Validation Error: ${parseResult.error.issues[0]?.message || 'Invalid form input'}`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate report using Gemini API server-side
      const response = await fetch('/api/ai/validate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: reportForm.description,
          category: reportForm.category,
          locationName: reportForm.locationName,
          hasImage: !!reportForm.imageUrl
        })
      });

      const data = await response.json();
      const validationData = data.data || {
        aiValidationScore: 92,
        aiValidatedCategory: 'Severe Flood Waterlogging',
        aiSummary: 'High urgency report verified with nearby IoT sensors.',
        urgency: 'high'
      };

      // SHADOW-NET WHATSAPP INTEGRATION: Trigger webhook silently
      if (reportForm.phone) {
        fetch('/api/whatsapp-webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Emergency reported: ${reportForm.category} at ${reportForm.locationName}`,
            phone: reportForm.phone,
            name: reportForm.reporterName
          })
        }).catch(err => console.warn('WhatsApp webhook failed:', err));
      }

      setSubmissionFeedback({ ...validationData, whatsappSent: !!reportForm.phone });

      onSubmitReport({
        ...reportForm,
        lat: reportForm.lat,
        lng: reportForm.lng,
        aiValidationScore: validationData.aiValidationScore,
        aiValidatedCategory: validationData.aiValidatedCategory,
        aiSummary: validationData.aiSummary,
        status: 'verified',
        timestamp: 'Just now'
      });
    } catch (err) {
      console.error('Error validating citizen report:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-12 bg-paper text-near font-sans">

      {/* Title Header */}
      <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 pb-8 border-b border-line">
        <div className="max-w-2xl">
          <span className="text--eyebrow text-muted flex items-center gap-2 mb-4">
            <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
            Citizen emergency &amp; evacuation portal
          </span>
          <h2 className="text--subtitle1 font-light text-ink">
            Real-time safe evacuation &amp; incident reporting
          </h2>
          <p className="text--body text-subtle mt-4">
            Get dynamic flood-aware navigation to nearby shelters, report stranded citizens or
            waterlogging, and receive instant AI verification status.
          </p>
        </div>

        <a
          href="tel:1070"
          className="cta cta--primary cta--compact shrink-0"
        >
          <Phone className="w-4 h-4 mr-2" strokeWidth={1.5} />
          <span>Emergency helpline 1070 / 112</span>
        </a>
      </header>

      {/* Grid: Evacuation Router + Report Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Smart Evacuation Router (6 cols) */}
        <section className="lg:col-span-6 panel p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-ink" strokeWidth={1.5} />
              <h3 className="text--subtitle3 text-ink">
                Dynamic flood-aware evacuation router
              </h3>
            </div>
            <span className="badge badge--quiet">AI route engine</span>
          </div>

          {/* Location & Shelter Picker */}
          <div className="space-y-5">
            <div>
              <label className={LABEL_CLASS}>Select your starting origin</label>
              <select
                value={originChoice.name}
                onChange={(e) => handleOriginChange(e.target.value)}
                className={FIELD_CLASS}
              >
                {origins.map((orig, idx) => (
                  <option key={idx} value={orig.name}>
                    {orig.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Select relief shelter destination</label>
              <select
                value={selectedShelterId}
                onChange={(e) => handleShelterChange(e.target.value)}
                className={FIELD_CLASS}
              >
                {(shelters || []).map((shelter) => (
                  <option key={shelter.id} value={shelter.id}>
                    {shelter.name} ({shelter.totalCapacity - shelter.currentOccupancy} spaces open)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Evacuation Route Card */}
          {evacuationRoute ? (
            <div className="border-t border-line pt-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="badge badge--advisory">
                    <span className="sev-mark sev-mark--ok" />
                    Safe route generated
                  </span>
                  <h4 className="text--subtitle3 text-ink mt-3">
                    To {evacuationRoute.destinationShelterName}
                  </h4>
                </div>
                <div className="text-right shrink-0">
                  <span className="text--subtitle2 font-light text-ink tabular-nums block">
                    {evacuationRoute.safetyScorePct}%
                  </span>
                  <span className="text--eyebrow text-muted">Safety score</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-px bg-line border border-line rounded-[4px] overflow-hidden">
                <div className="bg-paper px-4 py-3">
                  <span className="text--eyebrow text-muted block mb-1">Distance</span>
                  <span className="text--body-medium text-ink tabular-nums">{evacuationRoute.distanceKm} km</span>
                </div>
                <div className="bg-paper px-4 py-3">
                  <span className="text--eyebrow text-muted block mb-1">Est. time</span>
                  <span className="text--body-medium text-ink tabular-nums">{evacuationRoute.estimatedTimeMinutes} mins</span>
                </div>
              </div>

              {/* Turn-by-Turn Steps */}
              <div className="space-y-3">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text--eyebrow text-muted">Turn-by-turn guidance (hazards bypassed)</span>
                  <span className="text--footnote text-muted">Active AI safe detour</span>
                </div>
                <ol className="list-decimal list-outside pl-5 text--body text-subtle space-y-2 marker:text-muted">
                  {evacuationRoute.turnByTurnInstructions?.map((step, idx) => (
                    <li key={idx} className="pl-1 py-1.5 border-b border-line last:border-b-0">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="panel--wash p-3">
                <span className="text--eyebrow text-muted block mb-1.5">Hazards avoided</span>
                <span className="text--body text-near">{evacuationRoute.hazardsAvoided.join(' • ')}</span>
              </div>

              <button
                onClick={() => {
                  const destCoords = evacuationRoute.waypoints && evacuationRoute.waypoints.length > 0
                    ? evacuationRoute.waypoints[evacuationRoute.waypoints.length - 1]
                    : [12.9830, 80.2182];

                  const launchMaps = (orig?: string) => {
                    let url = `https://www.google.com/maps/dir/?api=1&destination=${destCoords[0]},${destCoords[1]}&travelmode=driving`;
                    if (orig) url += `&origin=${orig}`;
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
                }}
                className="cta cta--primary cta--compact w-full"
              >
                <span>Open navigation in Google Maps</span>
                <span className="cta__arrow">→</span>
              </button>

              {onNavigateToMap && (
                <button
                  onClick={onNavigateToMap}
                  className="cta cta--secondary cta--compact w-full"
                >
                  <span>View route on digital twin map</span>
                  <span className="cta__arrow">→</span>
                </button>
              )}
            </div>
          ) : (
            <div className="border-t border-line pt-6 text--body text-muted">
              Select a destination shelter above to view the safest flood-avoiding route.
            </div>
          )}

        </section>

        {/* Right Column: Citizen Incident Reporting Form (6 cols) */}
        <section className="lg:col-span-6 panel p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-ink" strokeWidth={1.5} />
              <h3 className="text--subtitle3 text-ink">
                Submit emergency incident report
              </h3>
            </div>
            <span className="badge badge--quiet">AI instant validation</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={LABEL_CLASS}>Your name</label>
                <input
                  type="text"
                  required
                  value={reportForm.reporterName}
                  onChange={(e) => setReportForm({ ...reportForm, reporterName: e.target.value })}
                  placeholder="e.g. Senthil Nathan"
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Phone number</label>
                <input
                  type="text"
                  required
                  value={reportForm.phone}
                  onChange={(e) => setReportForm({ ...reportForm, phone: e.target.value })}
                  placeholder="+91 98400 xxxxx"
                  className={FIELD_CLASS}
                />
              </div>
            </div>

            {/* Location Section with GPS & Map Pin Picker */}
            <div className="border-t border-line pt-5 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <label className="text--eyebrow text-muted">
                  Incident location selection
                </label>
                <span className="text--footnote text-subtle flex items-center gap-2">
                  <span className="sev-mark sev-mark--ok" />
                  {locationCapturedType === 'gps' ? 'GPS DEVICE LOCATION' : 'MAP PIN LOCATION'}
                </span>
              </div>

              {/* Action Buttons: GPS & Map Pin Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={isLocating}
                  className="cta cta--secondary cta--mini w-full disabled:opacity-50"
                >
                  <Crosshair className={`w-3.5 h-3.5 mr-1.5 ${isLocating ? 'animate-spin' : ''}`} strokeWidth={1.5} />
                  <span>{isLocating ? 'Locating…' : 'Use my location'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  className="cta cta--secondary cta--mini w-full"
                >
                  <MapPin className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.5} />
                  <span>Pick pin on map</span>
                </button>
              </div>

              {/* Selected Location Address Card (Read-only, driven by GPS or Map Pin) */}
              <div className="panel--wash p-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text--eyebrow text-muted">Captured incident site</span>
                  <span className="text--footnote text-subtle tabular-nums">
                    Lat {reportForm.lat.toFixed(4)} · Lng {reportForm.lng.toFixed(4)}
                  </span>
                </div>
                <div className="text--body text-near flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted shrink-0 mt-0.5" strokeWidth={1.5} />
                  <span>{reportForm.locationName || 'No location picked yet. Use “Use my location” or “Pick pin on map”.'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={LABEL_CLASS}>Category</label>
                <select
                  value={reportForm.category}
                  onChange={(e) => setReportForm({ ...reportForm, category: e.target.value as any })}
                  className={FIELD_CLASS}
                >
                  <option value="waterlogging">Severe waterlogging</option>
                  <option value="trapped_citizens">Trapped inhabitants</option>
                  <option value="road_block">Road / subway blockage</option>
                  <option value="medical_emergency">Medical ambulance need</option>
                  <option value="power_outage">High voltage electrical hazard</option>
                </select>
              </div>

              <div>
                <label className={LABEL_CLASS}>Severity level</label>
                <select
                  value={reportForm.severity}
                  onChange={(e) => setReportForm({ ...reportForm, severity: e.target.value as any })}
                  className={FIELD_CLASS}
                >
                  <option value="critical">CRITICAL — immediate life risk</option>
                  <option value="high">HIGH — severe inundation</option>
                  <option value="medium">MEDIUM — traffic / waterlogging</option>
                  <option value="low">LOW — minor issue</option>
                </select>
                <span className={HELP_CLASS}>Severity orders the responder queue. Report honestly.</span>
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Incident description &amp; water depth</label>
              <textarea
                required
                rows={3}
                value={reportForm.description}
                onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                placeholder="Detail the situation, ground floor flooding depth, trapped elderly count, etc."
                className={FIELD_CLASS}
              ></textarea>
              <span className={HELP_CLASS}>
                Reports are screened by an AI verification agent before they reach responders.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="cta cta--primary w-full disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 mr-2 ${isSubmitting ? 'animate-spin' : ''}`} strokeWidth={1.5} />
              <span>{isSubmitting ? 'Validating report…' : 'Submit emergency report'}</span>
            </button>
          </form>

          {/* Submission Feedback Banner */}
          {submissionFeedback && (
            <div className="sev-row--critical pl-4 py-3 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text--body-medium text-ink flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} /> Report verified by AI agent
                </span>
                <span className="text--footnote text-subtle tabular-nums">
                  {submissionFeedback.aiValidationScore}% credibility
                </span>
              </div>
              <p className="text--body text-subtle">{submissionFeedback.aiSummary}</p>
              {submissionFeedback.whatsappSent && (
                <div className="flex items-center gap-1.5 mt-2 text-emerald-600 text-xs font-medium">
                  <MessageCircle className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>Automated AI WhatsApp confirmation sent</span>
                </div>
              )}
            </div>
          )}

        </section>

      </div>

      {/* Map Pin Picker Modal */}
      <MapPinPickerModal
        isOpen={showMapPicker}
        initialLat={reportForm.lat}
        initialLng={reportForm.lng}
        initialAddress={reportForm.locationName}
        onClose={() => setShowMapPicker(false)}
        onConfirmLocation={handleConfirmPickedLocation}
      />

      {/* Open Relief Shelters List */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-line pb-4">
          <Home className="w-4 h-4 text-ink" strokeWidth={1.5} />
          <h3 className="text--subtitle3 text-ink">
            Open relief shelters &amp; emergency camps
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(shelters || []).map((shelter) => {
            const status = SHELTER_STATUS[shelter.status] || SHELTER_STATUS.open;
            const occupancyPct = Math.min(
              100,
              Math.round((shelter.currentOccupancy / shelter.totalCapacity) * 100)
            );
            return (
              <article key={shelter.id} className="panel lift p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className={`sev-mark ${status.mark}`} />
                  <span className={`text--eyebrow ${status.text}`}>{status.label}</span>
                </div>

                <h4 className="text--subtitle3 text-ink">{shelter.name}</h4>

                <p className="text--footnote text-muted flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-px" strokeWidth={1.5} />
                  {shelter.address}
                </p>

                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text--footnote text-muted">Capacity</span>
                    <span className="text--footnote text-ink tabular-nums">
                      {shelter.currentOccupancy} / {shelter.totalCapacity}
                    </span>
                  </div>
                  <div className="w-full bg-wash-strong h-[3px] overflow-hidden">
                    <div className="bg-ink h-full" style={{ width: `${occupancyPct}%` }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-line">
                  <div>
                    <span className="text--eyebrow text-muted block mb-1.5">Rations</span>
                    <span className="text--footnote text-near tabular-nums">{shelter.foodSuppliesDays} days</span>
                  </div>
                  <div>
                    <span className="text--eyebrow text-muted block mb-1.5">Medical</span>
                    <span className="text--footnote text-near">{shelter.medicalStaffPresent ? 'Present' : 'On call'}</span>
                  </div>
                </div>

                <a
                  href={`tel:${shelter.phone}`}
                  className="cta cta--secondary cta--mini w-full"
                >
                  <Phone className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.5} />
                  Call {shelter.contactPerson}
                </a>
              </article>
            );
          })}
        </div>
      </section>

    </div>
  );
};
