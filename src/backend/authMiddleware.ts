import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'disaster-twin-chennai-jwt-secret-2026';

export type UserRole = 'authority' | 'fire_rescue' | 'police' | 'health_hospitals' | 'citizen';

export interface UserPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  agencyName: string;
  badgeNumber?: string;
  permissions: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export const ROLE_PERMISSIONS: Record<UserRole, { agencyName: string; defaultName: string; permissions: string[] }> = {
  authority: {
    agencyName: 'TN State Disaster Management Authority (TNSDMA)',
    defaultName: 'Dr. S. Ramakrishnan (Incident Commander)',
    permissions: ['all_access', 'dispatch_resources', 'trigger_alerts', 'override_simulations', 'manage_users', 'broadcast_fcm', 'broadcast_sms']
  },
  fire_rescue: {
    agencyName: 'TN Fire & Rescue Services Command',
    defaultName: 'Officer K. Venkatesh (Rescue Chief)',
    permissions: ['dispatch_resources', 'manage_boats', 'verify_reports', 'broadcast_fcm']
  },
  police: {
    agencyName: 'Greater Chennai Traffic Police Control',
    defaultName: 'Inspector M. Selvam (Traffic Control)',
    permissions: ['manage_barricades', 'reroute_traffic', 'verify_reports', 'broadcast_fcm']
  },
  health_hospitals: {
    agencyName: 'Emergency Medical & Health Services (108)',
    defaultName: 'Dr. Anita Roy (Emergency Medical Director)',
    permissions: ['manage_icu_beds', 'dispatch_ambulances', 'verify_reports']
  },
  citizen: {
    agencyName: 'Public Citizen / Resident',
    defaultName: 'Anand Kumar (Velachery Resident)',
    permissions: ['submit_report', 'view_evacuation_routes', 'receive_push_alerts']
  }
};

export function generateToken(user: { id?: string; name?: string; email?: string; role: UserRole }): { token: string; payload: UserPayload } {
  const roleInfo = ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS.citizen;
  const payload: UserPayload = {
    id: user.id || `usr-${user.role}-${Date.now().toString().slice(-4)}`,
    name: user.name || roleInfo.defaultName,
    email: user.email || `${user.role}@disaster.tn.gov.in`,
    role: user.role,
    agencyName: roleInfo.agencyName,
    badgeNumber: user.role !== 'citizen' ? `CMD-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
    permissions: roleInfo.permissions
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
  return { token, payload };
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch (e) {
    return null;
  }
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing JWT Bearer Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ success: false, error: 'Forbidden: Invalid or expired JWT token' });
  }

  req.user = decoded;
  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized: User authentication required' });
    }
    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'authority') {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Role '${req.user.role}' lacks required permission level. Required roles: ${allowedRoles.join(', ')}`
      });
    }
    next();
  };
}
