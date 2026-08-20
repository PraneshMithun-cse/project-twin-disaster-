export interface SentinelSARFeature {
  id: string;
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: {
    satellite: 'Sentinel-1A' | 'Sentinel-1B';
    mode: 'IW' | 'EW';
    polarisation: 'VV+VH';
    passDirection: 'ASCENDING' | 'DESCENDING';
    acquisitionTimestamp: string;
    backscatterDb: number; // e.g. -22.4 dB (smooth open water surface)
    inundationDepthMeters: number;
    areaSqKm: number;
    riskZone: string;
  };
}

export interface NASAFIRMSHotspot {
  id: string;
  lat: number;
  lng: number;
  brightnessKelvin: number;
  confidencePct: number;
  satellite: 'VIIRS_N20' | 'MODIS_AQUA' | 'NOAA_20';
  acquisitionTime: string;
  locationName: string;
  category: 'thermal_anomaly' | 'high_reflector_flood_water' | 'structural_submergence';
}

export function getSentinelSARData(bbox?: string) {
  const acquisitionTime = new Date(Date.now() - 1000 * 3600 * 4).toISOString(); // 4 hours ago

  const sarPolygons: SentinelSARFeature[] = [
    {
      id: 'sar-velachery-lake-overflow',
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [80.2120, 12.9820],
          [80.2280, 12.9850],
          [80.2310, 12.9730],
          [80.2150, 12.9710],
          [80.2120, 12.9820]
        ]]
      },
      properties: {
        satellite: 'Sentinel-1A',
        mode: 'IW',
        polarisation: 'VV+VH',
        passDirection: 'DESCENDING',
        acquisitionTimestamp: acquisitionTime,
        backscatterDb: -24.2, // Low backscatter indicates standing flood water
        inundationDepthMeters: 1.85,
        areaSqKm: 4.35,
        riskZone: 'Velachery South Lake Inundation Zone'
      }
    },
    {
      id: 'sar-adyar-river-estuary-spill',
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [80.2300, 13.0180],
          [80.2550, 13.0220],
          [80.2580, 13.0120],
          [80.2320, 13.0100],
          [80.2300, 13.0180]
        ]]
      },
      properties: {
        satellite: 'Sentinel-1A',
        mode: 'IW',
        polarisation: 'VV+VH',
        passDirection: 'DESCENDING',
        acquisitionTimestamp: acquisitionTime,
        backscatterDb: -26.1,
        inundationDepthMeters: 2.40,
        areaSqKm: 6.80,
        riskZone: 'Kotturpuram Adyar Floodplain Corridor'
      }
    }
  ];

  return {
    source: 'ESA Copernicus Sentinel-1 C-Band Synthetic Aperture Radar (SAR)',
    resolutionMeters: 10,
    polarization: 'VV + VH Dual-Pol',
    orbitPath: 'Relative Orbit 112 (Ascending Node: 11:05 UTC)',
    processingLevel: 'Level-1 GRD Ground Range Detected',
    waterDetectionMethod: 'Bivariate Thresholding on Backscatter Intensity (Sigma-0 < -20dB)',
    totalInundatedAreaSqKm: 11.15,
    features: sarPolygons,
    lastOrbitalPass: acquisitionTime
  };
}

export function getNASAFIRMSData() {
  const acquisitionTime = new Date(Date.now() - 1000 * 1800 * 3).toISOString();

  const hotspots: NASAFIRMSHotspot[] = [
    {
      id: 'firms-001',
      lat: 12.9785,
      lng: 80.2205,
      brightnessKelvin: 312.4,
      confidencePct: 96,
      satellite: 'VIIRS_N20',
      acquisitionTime: acquisitionTime,
      locationName: 'Velachery Vijaya Nagar Bus Stand Junction',
      category: 'high_reflector_flood_water'
    },
    {
      id: 'firms-002',
      lat: 13.0067,
      lng: 80.2117,
      brightnessKelvin: 308.2,
      confidencePct: 92,
      satellite: 'MODIS_AQUA',
      acquisitionTime: acquisitionTime,
      locationName: 'Guindy Railway Subway Submergence',
      category: 'structural_submergence'
    },
    {
      id: 'firms-003',
      lat: 13.0231,
      lng: 80.2411,
      brightnessKelvin: 315.8,
      confidencePct: 98,
      satellite: 'VIIRS_N20',
      acquisitionTime: acquisitionTime,
      locationName: 'Kotturpuram Adyar River Overflow Bank',
      category: 'high_reflector_flood_water'
    }
  ];

  return {
    source: 'NASA FIRMS (Fire Information for Resource Management System) & NRT Satellite Inundation Feed',
    sensors: ['MODIS Aqua/Terra', 'VIIRS Suomi-NPP / NOAA-20'],
    spatialResolution: '375m VIIRS / 1km MODIS',
    totalHotspotsCount: hotspots.length,
    hotspots: hotspots,
    lastUpdate: acquisitionTime
  };
}
