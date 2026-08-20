import { z } from 'zod';

export const CitizenReportSchema = z.object({
  reporterName: z.string().min(2, 'Name must be at least 2 characters').default('Anonymous Citizen'),
  phone: z.string().optional(),
  locationName: z.string().min(3, 'Location description is required'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  hazardType: z.enum([
    'waterlogging',
    'road_submerged',
    'trapped_citizens',
    'medical_emergency',
    'power_outage',
    'other'
  ]),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  imageUrl: z.string().optional()
});

export type CitizenReportInput = z.infer<typeof CitizenReportSchema>;

export const SimulationConfigSchema = z.object({
  rainfallMmHr: z.number().min(0).max(300),
  damDischargeM3s: z.number().min(0).max(5000),
  canalBlockagePct: z.number().min(0).max(100),
  disasterType: z.enum(['flood', 'cyclone', 'earthquake', 'wildfire', 'landslide', 'tsunami']),
  bridgeClosureCount: z.number().min(0).max(10),
  highTideOverlap: z.boolean()
});

export type SimulationConfigInput = z.infer<typeof SimulationConfigSchema>;
