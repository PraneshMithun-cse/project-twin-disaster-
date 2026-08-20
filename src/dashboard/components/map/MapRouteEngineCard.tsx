import React from 'react';
import { Navigation, MapPin, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { EmergencyShelter } from '../../../shared/types';

interface MapRouteEngineCardProps {
  shelters: EmergencyShelter[];
  selectedShelterId: string;
  onSelectShelter: (id: string) => void;
  originLat: number;
  originLng: number;
  isClickToPickOrigin: boolean;
  onTogglePickOrigin: () => void;
  onCalculateRoute: () => void;
  isCalculating: boolean;
  routeResult: any;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

export const MapRouteEngineCard: React.FC<MapRouteEngineCardProps> = ({
  shelters,
  selectedShelterId,
  onSelectShelter,
  originLat,
  originLng,
  isClickToPickOrigin,
  onTogglePickOrigin,
  onCalculateRoute,
  isCalculating,
  routeResult,
  isMinimized,
  onToggleMinimize
}) => {
  return (
    <div className="panel p-3 max-w-xs w-full">
      <div className="flex items-center justify-between gap-2 border-b border-line pb-2 mb-2.5">
        {/* The engine that produces the green corridor on the map, so its
            icon carries the same safe accent. */}
        <div className="flex items-center gap-2 text-ink">
          <Navigation className="w-3.5 h-3.5 shrink-0 text-safe" strokeWidth={1.5} />
          <span className="text--body-medium">OSRM Route Engine</span>
        </div>
        <button
          onClick={onToggleMinimize}
          className="text-muted hover:text-ink hover:bg-wash rounded-[3px] p-0.5 transition-colors duration-[250ms] ease-[cubic-bezier(.23,1,.32,1)] cursor-pointer"
        >
          {isMinimized ? <ChevronDown className="w-4 h-4" strokeWidth={1.5} /> : <ChevronUp className="w-4 h-4" strokeWidth={1.5} />}
        </button>
      </div>

      {!isMinimized && (
        <div className="space-y-3">
          {/* Target Shelter Selection */}
          <div className="space-y-1.5">
            <label className="text--eyebrow text-muted block">
              Destination relief camp
            </label>
            <select
              value={selectedShelterId}
              onChange={(e) => onSelectShelter(e.target.value)}
              className="w-full bg-paper border border-line rounded-[3px] text--footnote text-near p-1.5 focus:outline-none focus:border-muted cursor-pointer"
            >
              {shelters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.currentOccupancy}/{s.totalCapacity})
                </option>
              ))}
            </select>
          </div>

          {/* Origin Picker Button */}
          <div className="flex items-center justify-between gap-2 panel--wash p-1.5">
            <span className="text--footnote text-muted tabular-nums">
              Origin: {originLat.toFixed(4)}, {originLng.toFixed(4)}
            </span>
            <button
              onClick={onTogglePickOrigin}
              className={`px-2 py-1 rounded-[3px] border text-[11px] leading-none uppercase tracking-[0.08em] font-medium transition-colors duration-[250ms] ease-[cubic-bezier(.23,1,.32,1)] cursor-pointer shrink-0 ${
                isClickToPickOrigin
                  ? 'bg-ink text-paper border-ink'
                  : 'bg-paper text-muted border-line hover:text-ink hover:border-muted'
              }`}
            >
              <MapPin className="w-3 h-3 inline mr-1" strokeWidth={1.5} />
              {isClickToPickOrigin ? 'Click map' : 'Set pin'}
            </button>
          </div>

          {/* Calculate Route Trigger */}
          <button
            onClick={onCalculateRoute}
            disabled={isCalculating}
            className="cta cta--primary cta--mini w-full justify-center disabled:opacity-50"
          >
            {isCalculating ? 'Computing avoidance route…' : 'Compute safe evacuation path'}
          </button>

          {/* Route Summary Result */}
          {routeResult && (
            <div className="panel--wash p-2 space-y-1.5">
              <div className="flex justify-between gap-3 text--footnote text-ink">
                <span className="tabular-nums">Distance: {(routeResult.distanceMeters / 1000).toFixed(1)} km</span>
                <span className="tabular-nums">Time: {Math.round(routeResult.durationMinutes)} mins</span>
              </div>
              <div className="flex items-center gap-1.5 text--footnote text-muted">
                <AlertTriangle className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                <span>Avoided {routeResult.submergedRoadsAvoided || 2} submerged corridors</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
