import React from 'react';
import { Ruler, Trash2 } from 'lucide-react';

interface MapMeasurementDrawerProps {
  isMeasuring: boolean;
  measurePoints: [number, number][];
  totalDistanceMeters: number;
  onToggleMeasuring: () => void;
  onClearPoints: () => void;
}

export const MapMeasurementDrawer: React.FC<MapMeasurementDrawerProps> = ({
  isMeasuring,
  measurePoints,
  totalDistanceMeters,
  onToggleMeasuring,
  onClearPoints
}) => {
  const distanceKm = (totalDistanceMeters / 1000).toFixed(2);

  return (
    <div className="panel p-2">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onToggleMeasuring}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] border transition-colors duration-[250ms] ease-[cubic-bezier(.23,1,.32,1)] cursor-pointer text-[11px] leading-none uppercase tracking-[0.08em] ${
            isMeasuring
              ? 'bg-wash text-ink border-line font-medium'
              : 'bg-paper text-muted border-line hover:text-ink hover:border-muted'
          }`}
        >
          <Ruler className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>{isMeasuring ? 'Click map waypoints' : 'Measure distance'}</span>
        </button>

        {measurePoints.length > 0 && (
          <div className="flex items-center gap-2 bg-wash border border-line rounded-[3px] px-2 py-1">
            <span className="text-[12px] leading-[1.4] text-ink font-medium tabular-nums">{totalDistanceMeters} m</span>
            <span className="text-[12px] leading-[1.4] text-muted tabular-nums">({distanceKm} km)</span>
            <button
              onClick={onClearPoints}
              className="text-muted hover:text-ink transition-colors duration-[250ms] ease-[cubic-bezier(.23,1,.32,1)] p-0.5 cursor-pointer ml-1"
              title="Clear Measurement"
            >
              <Trash2 className="w-3 h-3" strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
