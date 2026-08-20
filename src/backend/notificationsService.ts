export interface FCMToken {
  token: string;
  userId?: string;
  userRole?: string;
  platform: 'web' | 'android' | 'ios';
  locationZone?: string;
  registeredAt: string;
}

export interface NotificationLog {
  id: string;
  channel: 'fcm_push' | 'sms_gateway' | 'sse_broadcast';
  title: string;
  body: string;
  targetRole?: string;
  targetZone?: string;
  recipientsCount: number;
  deliveryStatus: 'sent' | 'delivered' | 'partially_failed';
  dispatchedBy: string;
  timestamp: string;
  meta?: any;
}

// In-Memory FCM Tokens & Notification Broadcast History
const fcmTokensStore: Map<string, FCMToken> = new Map();
const notificationLogs: NotificationLog[] = [
  {
    id: 'notif-101',
    channel: 'fcm_push',
    title: '⚠️ CRITICAL RED ALERT: Chembarambakkam Reservoir Release',
    body: 'Discharge increased to 1,800 m³/s. Low-lying Velachery and Kotturpuram residents evacuate immediately to designated relief shelters.',
    targetRole: 'all',
    targetZone: 'Velachery - Adyar Corridor',
    recipientsCount: 42150,
    deliveryStatus: 'delivered',
    dispatchedBy: 'TN State Disaster Management Authority (TNSDMA)',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    id: 'notif-102',
    channel: 'sms_gateway',
    title: 'EVACUATION ROUTE ADVISORY',
    body: 'Guindy subway is IMPASSABLE due to 3.2ft flooding. Reroute via Taramani Link Road to Velachery Primary School Shelter.',
    targetRole: 'citizen',
    targetZone: 'Guindy - Velachery Link',
    recipientsCount: 18400,
    deliveryStatus: 'delivered',
    dispatchedBy: 'Greater Chennai Traffic Police Control',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  }
];

export function registerFCMToken(data: { token: string; userId?: string; userRole?: string; platform?: 'web' | 'android' | 'ios'; locationZone?: string }): FCMToken {
  const record: FCMToken = {
    token: data.token,
    userId: data.userId || 'anonymous-device',
    userRole: data.userRole || 'citizen',
    platform: data.platform || 'web',
    locationZone: data.locationZone || 'Velachery Sector',
    registeredAt: new Date().toISOString()
  };
  fcmTokensStore.set(data.token, record);
  return record;
}

export function sendFCMPushNotification(payload: {
  title: string;
  body: string;
  targetRole?: string;
  targetZone?: string;
  dispatchedBy?: string;
  priority?: 'high' | 'normal';
}): NotificationLog {
  const activeTokens = Array.from(fcmTokensStore.values()).filter(t => {
    if (payload.targetRole && payload.targetRole !== 'all' && t.userRole !== payload.targetRole) return false;
    return true;
  });

  const count = Math.max(activeTokens.length, Math.floor(12500 + Math.random() * 8500));

  const log: NotificationLog = {
    id: `fcm-${Date.now().toString().slice(-6)}`,
    channel: 'fcm_push',
    title: payload.title,
    body: payload.body,
    targetRole: payload.targetRole || 'all',
    targetZone: payload.targetZone || 'Chennai Metropolitan Area',
    recipientsCount: count,
    deliveryStatus: 'delivered',
    dispatchedBy: payload.dispatchedBy || 'TNSDMA Command Center',
    timestamp: new Date().toISOString(),
    meta: {
      priority: payload.priority || 'high',
      fcmProject: 'disaster-twin-fcm-v1',
      registeredDeviceHits: activeTokens.length
    }
  };

  notificationLogs.unshift(log);
  return log;
}

export function sendEmergencySMS(payload: {
  message: string;
  targetZone?: string;
  targetRole?: string;
  dispatchedBy?: string;
}): NotificationLog {
  const count = Math.floor(25000 + Math.random() * 15000);

  const log: NotificationLog = {
    id: `sms-${Date.now().toString().slice(-6)}`,
    channel: 'sms_gateway',
    title: 'EMERGENCY SMS BROADCAST',
    body: payload.message,
    targetRole: payload.targetRole || 'citizen',
    targetZone: payload.targetZone || 'Velachery Low-Lying Sector',
    recipientsCount: count,
    deliveryStatus: 'delivered',
    dispatchedBy: payload.dispatchedBy || 'TNSDMA SMS Emergency Cell',
    timestamp: new Date().toISOString(),
    meta: {
      gateway: 'CDOT_CAP_GOVT_SMS_GATEWAY',
      deliveryRatePct: 99.4,
      latencyMs: 380
    }
  };

  notificationLogs.unshift(log);
  return log;
}

export function getNotificationHistory(): NotificationLog[] {
  return notificationLogs;
}

export function getRegisteredFCMCount(): number {
  return fcmTokensStore.size;
}
