import { useState, useCallback } from 'react';
import { EvacuationRoute, EmergencyShelter } from '../shared/types';
import { MOCK_EVACUATION_ROUTE } from '../shared/mockDigitalTwinData';

export function useEvacuationRoute(shelters: EmergencyShelter[]) {
  const [evacuationRoute, setEvacuationRoute] = useState<EvacuationRoute>(MOCK_EVACUATION_ROUTE);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [currentOrigin, setCurrentOrigin] = useState<{ name: string; coords: [number, number] }>({
    name: 'Velachery 100ft Road (Vijaya Nagar Junction)',
    coords: [12.9785, 80.2205]
  });

  const calculateRoute = useCallback(async (
    originName: string,
    originCoords: [number, number],
    shelterId: string
  ) => {
    setIsCalculating(true);
    setCurrentOrigin({ name: originName, coords: originCoords });

    const shelter = shelters.find(s => s.id === shelterId) || shelters[0] || {
      id: 'sh-01',
      name: 'Velachery Relief Camp',
      lat: 12.9815,
      lng: 80.2225
    };

    try {
      const response = await fetch('/api/ai/evacuation-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originName,
          originCoords,
          shelterId: shelter.id,
          shelterName: shelter.name,
          shelterCoords: [shelter.lat, shelter.lng]
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const route = data.data;
          const updatedRoute: EvacuationRoute = {
            id: `route-${Date.now()}`,
            originName: route.originName || originName,
            destinationShelterName: route.destinationShelterName || shelter.name,
            distanceKm: route.distanceKm || 3.2,
            estimatedTimeMinutes: route.durationMins || 10,
            safetyScorePct: route.safetyScorePct || 96,
            waypoints: route.waypoints || [[originCoords[0], originCoords[1]], [shelter.lat, shelter.lng]],
            hazardsAvoided: route.hazardsAvoided || ['Guindy Railway Subway Submergence', 'Velachery Lake Sluice Drain'],
            turnByTurnInstructions: route.steps || ['Depart from origin', 'Proceed along safe detour corridor']
          };
          setEvacuationRoute(updatedRoute);
        }
      }
    } catch (err) {
      console.warn('Error in useEvacuationRoute hook:', err);
    } finally {
      setIsCalculating(false);
    }
  }, [shelters]);

  const selectShelter = useCallback((shelterId: string) => {
    calculateRoute(currentOrigin.name, currentOrigin.coords, shelterId);
  }, [calculateRoute, currentOrigin]);

  return {
    evacuationRoute,
    isCalculating,
    currentOrigin,
    calculateRoute,
    selectShelter
  };
}
