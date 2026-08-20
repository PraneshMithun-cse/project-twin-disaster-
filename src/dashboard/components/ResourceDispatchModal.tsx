import React, { useState } from 'react';
import { EmergencyResource, ZoneRisk } from '../../shared/types';
import { X, Send, ChevronDown } from 'lucide-react';

interface ResourceDispatchModalProps {
  zoneId: string | null;
  zones: ZoneRisk[];
  resources: EmergencyResource[];
  onDispatch: (resourceId: string, zoneId: string) => void;
  onClose: () => void;
}

/* Entrance for a floating glass layer: the scrim fades the page back, the
   dialog settles in from 0.97 on the Squarespace reveal curve. Motion is
   dropped entirely under prefers-reduced-motion. */
export const ResourceDispatchModal: React.FC<ResourceDispatchModalProps> = ({
  zoneId,
  zones,
  resources,
  onDispatch,
  onClose
}) => {
  const [selectedResourceId, setSelectedResourceId] = useState<string>(resources[0]?.id || '');
  const [targetZoneId, setTargetZoneId] = useState<string>(zoneId || zones[0]?.id || '');

  if (!zoneId && zones.length === 0) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedResourceId && targetZoneId) {
      onDispatch(selectedResourceId, targetZoneId);
      onClose();
    }
  };

  const selectClass =
    'text--body appearance-none w-full bg-paper text-ink border border-line rounded-[4px] pl-3 pr-8 py-2.5 cursor-pointer hover:border-muted focus:border-ink transition-colors';

  return (
    <>
      <div
        className="rs-modal-scrim fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)'
        }}
      >
        {/* The dialog is a floating layer, so it is glass. The form controls and
            the note inside stay flat and opaque — no glass inside glass. */}
        <div className="rs-modal-surface glass glass--raised w-full max-w-lg p-6 space-y-6">

          <div className="flex items-start justify-between gap-4 border-b border-line pb-5">
            <div className="min-w-0">
              <span className="text--eyebrow text-muted">Fleet command</span>
              <h3 className="text--subtitle2 font-light text-ink mt-2">
                Dispatch Emergency Fleet Unit
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-muted hover:text-ink transition-colors cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text--eyebrow text-muted block mb-2">Select available fleet unit</label>
              <div className="relative">
                <select
                  value={selectedResourceId}
                  onChange={(e) => setSelectedResourceId(e.target.value)}
                  className={selectClass}
                >
                  {(resources || []).map((res) => (
                    <option key={res.id} value={res.id}>
                      {res.name} ({res.crewCount} crew, {res.status.toUpperCase()})
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="w-3.5 h-3.5 text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  strokeWidth={1.5}
                />
              </div>
            </div>

            <div>
              <label className="text--eyebrow text-muted block mb-2">Target inundation sector</label>
              <div className="relative">
                <select
                  value={targetZoneId}
                  onChange={(e) => setTargetZoneId(e.target.value)}
                  className={selectClass}
                >
                  {(zones || []).map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} (risk score: {zone.riskScore}/100)
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="w-3.5 h-3.5 text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  strokeWidth={1.5}
                />
              </div>
            </div>

            <p className="panel--wash p-3.5 text--footnote text-subtle">
              Dispatching a unit automatically broadcasts routing instructions via encrypted VHF &amp; 4G
              telemetry to the field squad.
            </p>

            {/* Footer action bar — a glass rule rather than a hairline border. */}
            <div className="glass-rule h-px w-full" aria-hidden="true" />

            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={onClose} className="cta cta--secondary cta--compact">
                Cancel
              </button>
              <button type="submit" className="cta cta--primary cta--compact gap-2">
                <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
                Confirm Fleet Dispatch
              </button>
            </div>
          </form>

        </div>
      </div>
    </>
  );
};
