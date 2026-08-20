import { useState, useCallback } from 'react';

export type BasemapStyle = 'light' | 'minimal' | 'satellite' | 'streets';

export function useMapControls() {
  const [mapTileStyle, setMapTileStyle] = useState<BasemapStyle>('light');
  const [isMeasuring, setIsMeasuring] = useState<boolean>(false);
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  
  // Layer Toggles
  const [showZones, setShowZones] = useState(true);
  const [showSensors, setShowSensors] = useState(true);
  const [showResources, setShowResources] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showHospitals, setShowHospitals] = useState(false);
  const [showReports, setShowReports] = useState(true);
  const [showSentinelOverlay, setShowSentinelOverlay] = useState(true);
  const [showFIRMSOverlay, setShowFIRMSOverlay] = useState(false);

  // Measurement distance calculation helper (Haversine formula in meters)
  const calculateTotalDistanceMeters = useCallback(() => {
    if (measurePoints.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < measurePoints.length - 1; i++) {
      const [lat1, lon1] = measurePoints[i];
      const [lat2, lon2] = measurePoints[i + 1];
      const R = 6371e3;
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      total += R * c;
    }
    return Math.round(total);
  }, [measurePoints]);

  const clearMeasurePoints = useCallback(() => {
    setMeasurePoints([]);
  }, []);

  const toggleMeasuringMode = useCallback(() => {
    setIsMeasuring((prev) => {
      if (prev) {
        setMeasurePoints([]);
      }
      return !prev;
    });
  }, []);

  return {
    mapTileStyle,
    setMapTileStyle,
    isMeasuring,
    setIsMeasuring,
    toggleMeasuringMode,
    measurePoints,
    setMeasurePoints,
    clearMeasurePoints,
    calculateTotalDistanceMeters,
    // Layer Visibility
    showZones,
    setShowZones,
    showSensors,
    setShowSensors,
    showResources,
    setShowResources,
    showShelters,
    setShowShelters,
    showHospitals,
    setShowHospitals,
    showReports,
    setShowReports,
    showSentinelOverlay,
    setShowSentinelOverlay,
    showFIRMSOverlay,
    setShowFIRMSOverlay
  };
}
