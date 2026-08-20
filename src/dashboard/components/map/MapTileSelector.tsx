import React from 'react';
import { Layers } from 'lucide-react';
import { BasemapStyle } from '../../../hooks/useMapControls.js';

interface MapTileSelectorProps {
  currentStyle: BasemapStyle;
  onStyleChange: (style: BasemapStyle) => void;
}

const STYLE_OPTIONS: BasemapStyle[] = ['light', 'minimal', 'satellite', 'streets'];

export const MapTileSelector: React.FC<MapTileSelectorProps> = ({ currentStyle, onStyleChange }) => {
  return (
    <div className="panel flex items-center gap-1 p-1.5">
      <div className="flex items-center gap-1.5 text-muted px-1 mr-0.5 border-r border-line">
        <Layers className="w-3.5 h-3.5" strokeWidth={1.5} />
        <span className="hidden sm:inline text--eyebrow pr-1.5">Tile</span>
      </div>
      {STYLE_OPTIONS.map((style) => (
        <button
          key={style}
          onClick={() => onStyleChange(style)}
          className={`px-2 py-1 rounded-[3px] text-[11px] leading-none uppercase tracking-[0.08em] transition-colors duration-[250ms] ease-[cubic-bezier(.23,1,.32,1)] cursor-pointer ${
            currentStyle === style
              ? 'bg-wash text-ink font-medium'
              : 'text-muted hover:text-ink hover:bg-wash'
          }`}
        >
          {style}
        </button>
      ))}
    </div>
  );
};
