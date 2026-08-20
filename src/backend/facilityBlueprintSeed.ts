import { Facility, Employee } from '../shared/facilityTypes.js';

// ============================================================
// Seed tenant: Sai Fireworks — a licensed fireworks manufacturing
// unit laid out the way Sivakasi-cluster factories actually are:
// small detached sheds separated by blast mounds, chemical store
// upwind, drying yard open to sky, godown furthest from mixing.
// Blueprint units are metres; plan origin is the top-left corner.
// ============================================================

export const SAI_FIREWORKS_FACILITY: Facility = {
  id: 'fac-sai-fireworks',
  name: 'Sai Fireworks Manufacturing Unit',
  industry: 'Fireworks & Pyrotechnics (PESO Class-2)',
  address: 'Survey No. 118/2, Sattur Road, Sivakasi, Virudhunagar District, Tamil Nadu 626123',
  lat: 9.4533,
  lng: 77.7975,
  licenceNo: 'PESO/E/HQ/TN/22/4471',
  safetyOfficer: 'R. Manikandan',
  safetyOfficerPhone: '+919443112200',
  createdAt: new Date('2024-04-01T06:00:00Z').toISOString(),
  blueprint: {
    widthM: 240,
    heightM: 150,
    zones: [
      {
        id: 'z-chem-store',
        name: 'Chemical Store (Oxidisers)',
        kind: 'chemical',
        hazardClass: 'explosive',
        x: 12, y: 14, w: 40, h: 30,
        headcount: 3,
        notes: 'Potassium chlorate, barium nitrate, aluminium powder. Blast mound on east face.'
      },
      {
        id: 'z-mixing-a',
        name: 'Composition Mixing Shed A',
        kind: 'production',
        hazardClass: 'explosive',
        x: 70, y: 14, w: 34, h: 26,
        headcount: 6,
        notes: 'Wet mixing only. Anti-static flooring, max 2 kg composition per bench.'
      },
      {
        id: 'z-mixing-b',
        name: 'Composition Mixing Shed B',
        kind: 'production',
        hazardClass: 'explosive',
        x: 116, y: 14, w: 34, h: 26,
        headcount: 6,
        notes: 'Colour star composition. Highest ignition sensitivity on site.'
      },
      {
        id: 'z-filling-1',
        name: 'Filling & Rolling Shed 1',
        kind: 'production',
        hazardClass: 'flammable',
        x: 70, y: 56, w: 38, h: 28,
        headcount: 14
      },
      {
        id: 'z-filling-2',
        name: 'Filling & Rolling Shed 2',
        kind: 'production',
        hazardClass: 'flammable',
        x: 118, y: 56, w: 38, h: 28,
        headcount: 14
      },
      {
        id: 'z-drying-yard',
        name: 'Open Drying Yard',
        kind: 'open_yard',
        hazardClass: 'flammable',
        x: 168, y: 14, w: 58, h: 44,
        headcount: 5,
        notes: 'Sun drying trays. No roof — smoke sensors are flame-type only.'
      },
      {
        id: 'z-packing',
        name: 'Packing Hall',
        kind: 'production',
        hazardClass: 'standard',
        x: 70, y: 98, w: 56, h: 34,
        headcount: 22
      },
      {
        id: 'z-godown',
        name: 'Finished Goods Godown',
        kind: 'storage',
        hazardClass: 'explosive',
        x: 168, y: 74, w: 58, h: 58,
        headcount: 6,
        notes: 'Max 5 tonne net explosive quantity. Statutory 45 m separation from mixing sheds.'
      },
      {
        id: 'z-utility',
        name: 'Utility & Genset Room',
        kind: 'utility',
        hazardClass: 'standard',
        x: 12, y: 58, w: 34, h: 24,
        headcount: 2
      },
      {
        id: 'z-admin',
        name: 'Admin Office & Weighbridge',
        kind: 'office',
        hazardClass: 'standard',
        x: 12, y: 96, w: 40, h: 36,
        headcount: 9
      },
      {
        id: 'z-spine-road',
        name: 'Internal Spine Road',
        kind: 'corridor',
        hazardClass: 'standard',
        x: 56, y: 14, w: 10, h: 118,
        headcount: 0
      }
    ],
    sensors: [
      {
        id: 'sen-chem-gas', name: 'Chemical Store Gas Detector', type: 'gas_leak', zoneId: 'z-chem-store',
        x: 32, y: 29, status: 'normal', currentValue: 8, unit: 'ppm', thresholdCritical: 120,
        batteryPct: 94, lastUpdated: new Date().toISOString()
      },
      {
        id: 'sen-mix-a-spark', name: 'Mixing A Spark Detector', type: 'spark_detector', zoneId: 'z-mixing-a',
        x: 87, y: 27, status: 'normal', currentValue: 0, unit: 'events/min', thresholdCritical: 1,
        batteryPct: 88, lastUpdated: new Date().toISOString()
      },
      {
        id: 'sen-mix-a-heat', name: 'Mixing A Heat Sensor', type: 'heat', zoneId: 'z-mixing-a',
        x: 96, y: 20, status: 'normal', currentValue: 34, unit: '°C', thresholdCritical: 62,
        batteryPct: 91, lastUpdated: new Date().toISOString()
      },
      {
        id: 'sen-mix-b-spark', name: 'Mixing B Spark Detector', type: 'spark_detector', zoneId: 'z-mixing-b',
        x: 133, y: 27, status: 'normal', currentValue: 0, unit: 'events/min', thresholdCritical: 1,
        batteryPct: 76, lastUpdated: new Date().toISOString()
      },
      {
        id: 'sen-fill-1-smoke', name: 'Filling Shed 1 Smoke Head', type: 'smoke', zoneId: 'z-filling-1',
        x: 89, y: 70, status: 'normal', currentValue: 0.3, unit: '%obs/m', thresholdCritical: 3.5,
        batteryPct: 97, lastUpdated: new Date().toISOString()
      },
      {
        id: 'sen-fill-2-smoke', name: 'Filling Shed 2 Smoke Head', type: 'smoke', zoneId: 'z-filling-2',
        x: 137, y: 70, status: 'normal', currentValue: 0.4, unit: '%obs/m', thresholdCritical: 3.5,
        batteryPct: 85, lastUpdated: new Date().toISOString()
      },
      {
        id: 'sen-yard-flame', name: 'Drying Yard Flame Scanner', type: 'flame', zoneId: 'z-drying-yard',
        x: 197, y: 36, status: 'normal', currentValue: 0, unit: 'UV/IR', thresholdCritical: 1,
        batteryPct: 90, lastUpdated: new Date().toISOString()
      },
      {
        id: 'sen-pack-smoke', name: 'Packing Hall Smoke Head', type: 'smoke', zoneId: 'z-packing',
        x: 98, y: 115, status: 'normal', currentValue: 0.2, unit: '%obs/m', thresholdCritical: 3.5,
        batteryPct: 99, lastUpdated: new Date().toISOString()
      },
      {
        id: 'sen-godown-heat', name: 'Godown Heat Sensor', type: 'heat', zoneId: 'z-godown',
        x: 197, y: 103, status: 'normal', currentValue: 33, unit: '°C', thresholdCritical: 58,
        batteryPct: 82, lastUpdated: new Date().toISOString()
      },
      {
        id: 'sen-mcp-gate', name: 'Manual Call Point — Main Gate', type: 'manual_call_point', zoneId: 'z-spine-road',
        x: 61, y: 124, status: 'normal', currentValue: 0, unit: 'pressed', thresholdCritical: 1,
        batteryPct: 100, lastUpdated: new Date().toISOString()
      },
      {
        id: 'sen-util-smoke', name: 'Genset Room Smoke Head', type: 'smoke', zoneId: 'z-utility',
        x: 29, y: 70, status: 'normal', currentValue: 0.5, unit: '%obs/m', thresholdCritical: 3.5,
        batteryPct: 73, lastUpdated: new Date().toISOString()
      }
    ],
    hubs: [
      {
        id: 'hub-north-gate', name: 'Hub A — North Gate Assembly', x: 34, y: 6,
        capacity: 120, safeRadiusM: 45, isPrimary: true,
        landmark: 'Beside the main security cabin and fire tender bay'
      },
      {
        id: 'hub-east-yard', name: 'Hub B — East Perimeter Muster', x: 228, y: 66,
        capacity: 80, safeRadiusM: 40, isPrimary: false,
        landmark: 'Next to the east compound gate and water tanker point'
      },
      {
        id: 'hub-south-tank', name: 'Hub C — South Water Tank Point', x: 40, y: 142,
        capacity: 90, safeRadiusM: 40, isPrimary: false,
        landmark: 'At the overhead water tank behind the admin block'
      }
    ],
    routes: [
      {
        id: 'rt-chem-north', name: 'Chemical Store → Hub A', fromZoneId: 'z-chem-store', toHubId: 'hub-north-gate',
        waypoints: [{ x: 32, y: 14 }, { x: 34, y: 6 }], widthM: 3, distanceM: 24, isPrimary: true
      },
      {
        id: 'rt-mixa-north', name: 'Mixing A → Hub A', fromZoneId: 'z-mixing-a', toHubId: 'hub-north-gate',
        waypoints: [{ x: 87, y: 14 }, { x: 61, y: 10 }, { x: 34, y: 6 }], widthM: 3, distanceM: 62, isPrimary: true
      },
      {
        id: 'rt-mixb-east', name: 'Mixing B → Hub B', fromZoneId: 'z-mixing-b', toHubId: 'hub-east-yard',
        waypoints: [{ x: 150, y: 27 }, { x: 232, y: 27 }, { x: 228, y: 66 }], widthM: 4, distanceM: 128, isPrimary: true
      },
      {
        id: 'rt-fill1-north', name: 'Filling Shed 1 → Hub A', fromZoneId: 'z-filling-1', toHubId: 'hub-north-gate',
        waypoints: [{ x: 70, y: 70 }, { x: 61, y: 70 }, { x: 61, y: 10 }, { x: 34, y: 6 }], widthM: 4, distanceM: 104, isPrimary: true
      },
      {
        id: 'rt-fill2-east', name: 'Filling Shed 2 → Hub B', fromZoneId: 'z-filling-2', toHubId: 'hub-east-yard',
        waypoints: [{ x: 156, y: 70 }, { x: 228, y: 66 }], widthM: 4, distanceM: 76, isPrimary: true
      },
      {
        id: 'rt-yard-east', name: 'Drying Yard → Hub B', fromZoneId: 'z-drying-yard', toHubId: 'hub-east-yard',
        waypoints: [{ x: 226, y: 40 }, { x: 228, y: 66 }], widthM: 5, distanceM: 28, isPrimary: true
      },
      {
        id: 'rt-pack-south', name: 'Packing Hall → Hub C', fromZoneId: 'z-packing', toHubId: 'hub-south-tank',
        waypoints: [{ x: 84, y: 132 }, { x: 60, y: 140 }, { x: 40, y: 142 }], widthM: 5, distanceM: 48, isPrimary: true
      },
      {
        id: 'rt-godown-east', name: 'Godown → Hub B', fromZoneId: 'z-godown', toHubId: 'hub-east-yard',
        waypoints: [{ x: 226, y: 100 }, { x: 228, y: 66 }], widthM: 5, distanceM: 36, isPrimary: true
      },
      {
        id: 'rt-admin-south', name: 'Admin Office → Hub C', fromZoneId: 'z-admin', toHubId: 'hub-south-tank',
        waypoints: [{ x: 32, y: 132 }, { x: 40, y: 142 }], widthM: 3, distanceM: 16, isPrimary: true
      },
      {
        id: 'rt-util-north', name: 'Genset Room → Hub A', fromZoneId: 'z-utility', toHubId: 'hub-north-gate',
        waypoints: [{ x: 29, y: 58 }, { x: 34, y: 6 }], widthM: 3, distanceM: 54, isPrimary: true
      },
      {
        id: 'rt-spine-south', name: 'Spine Road → Hub C', fromZoneId: 'z-spine-road', toHubId: 'hub-south-tank',
        waypoints: [{ x: 61, y: 132 }, { x: 40, y: 142 }], widthM: 6, distanceM: 26, isPrimary: false
      }
    ]
  }
};

const stamp = new Date('2024-04-02T04:30:00Z').toISOString();

function seedEmployee(
  code: string, name: string, phone: string, department: string,
  zoneId: string, role: string, shift: Employee['shift'], language: Employee['language']
): Employee {
  return {
    id: `emp-${code.toLowerCase()}`,
    employeeCode: code,
    name,
    phone,
    department,
    shift,
    zoneId,
    role,
    language,
    whatsappOptIn: true,
    importedAt: stamp
  };
}

/** A small starter roster so the module is demonstrable before any CSV upload. */
export const SAI_FIREWORKS_EMPLOYEES: Employee[] = [
  seedEmployee('SF001', 'R. Manikandan', '+919443112200', 'Safety', 'z-admin', 'Safety Officer', 'general', 'ta'),
  seedEmployee('SF002', 'K. Petchimuthu', '+919443112201', 'Mixing', 'z-mixing-a', 'Mixing Operator', 'A', 'ta'),
  seedEmployee('SF003', 'S. Alagarsamy', '+919443112202', 'Mixing', 'z-mixing-a', 'Charge Hand', 'A', 'ta'),
  seedEmployee('SF004', 'M. Bhuvaneshwari', '+919443112203', 'Mixing', 'z-mixing-b', 'Star Composition Tech', 'A', 'ta'),
  seedEmployee('SF005', 'T. Ganesan', '+919443112204', 'Filling', 'z-filling-1', 'Filling Operator', 'A', 'ta'),
  seedEmployee('SF006', 'P. Lakshmi', '+919443112205', 'Filling', 'z-filling-1', 'Rolling Operator', 'B', 'ta'),
  seedEmployee('SF007', 'A. Rajkumar', '+919443112206', 'Filling', 'z-filling-2', 'Filling Operator', 'B', 'ta'),
  seedEmployee('SF008', 'J. Selvi', '+919443112207', 'Packing', 'z-packing', 'Packing Supervisor', 'general', 'ta'),
  seedEmployee('SF009', 'V. Murugesan', '+919443112208', 'Stores', 'z-godown', 'Godown Keeper', 'general', 'ta'),
  seedEmployee('SF010', 'D. Anitha', '+919443112209', 'Quality', 'z-drying-yard', 'Drying Yard Monitor', 'A', 'ta'),
  seedEmployee('SF011', 'N. Kalidass', '+919443112210', 'Maintenance', 'z-utility', 'Electrician', 'general', 'ta'),
  seedEmployee('SF012', 'B. Saravanan', '+919443112211', 'Admin', 'z-admin', 'Plant Manager', 'general', 'en')
];
