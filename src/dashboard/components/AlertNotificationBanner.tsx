import React from 'react';
import { AutomatedAlert } from '../../shared/types';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AlertNotificationBannerProps {
  alerts: AutomatedAlert[];
  onAcknowledge: (alertId: string) => void;
}

export const AlertNotificationBanner: React.FC<AlertNotificationBannerProps> = ({
  alerts,
  onAcknowledge
}) => {
  const activeAlerts = alerts.filter(a => !a.acknowledged);

  if (activeAlerts.length === 0) return null;

  const topAlert = activeAlerts[0];
  const isCritical = topAlert.severity === 'critical' || topAlert.severity === 'danger';

  // The banner floats above the page, so it is a glass layer: dark glass for a
  // critical alert (white type, inverted critical badge), light glass below that.
  // Severity semantics are unchanged — mark + word still carry the level.
  const levelLabel = isCritical
    ? 'Critical'
    : topAlert.severity === 'warning'
    ? 'Advisory'
    : 'Info';

  const markClass = isCritical
    ? 'sev-mark sev-mark--critical'
    : topAlert.severity === 'warning'
    ? 'sev-mark sev-mark--advisory'
    : 'sev-mark sev-mark--info';

  return (
    <div className="px-4 py-3 z-30 relative font-sans">
      <div
        className={`max-w-7xl mx-auto px-5 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isCritical ? 'glass glass--dark glass--raised on-dark text-paper' : 'glass text-ink'
        }`}
      >

        <div className="flex items-center gap-3">
          <ShieldAlert
            className={`w-[18px] h-[18px] shrink-0 ${isCritical ? 'text-paper' : 'text-ink'}`}
            strokeWidth={1.5}
          />
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              {isCritical ? (
                <span className="badge badge--critical bg-paper! text-ink!">
                  {levelLabel}
                </span>
              ) : (
                <span className="badge badge--advisory">
                  <span className={markClass} aria-hidden="true"></span>
                  {levelLabel}
                </span>
              )}
              <span className={`text--eyebrow ${isCritical ? 'text-paper' : 'text-subtle'}`}>
                Flash Flood Alert
              </span>
              <span
                className={`text--footnote tabular-nums ${isCritical ? 'text-paper/70' : 'text-muted'}`}
              >
                {topAlert.timestamp}
              </span>
            </div>
            <p className={`text--body-medium mt-1 ${isCritical ? 'text-paper' : 'text-ink'}`}>
              {topAlert.headline}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={async () => {
              try {
                // Trigger FCM Push & Emergency SMS Gateway Broadcast
                await fetch('/api/notifications/fcm/send', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: `⚠️ CRITICAL BROADCAST: ${activeAlerts[0].headline}`,
                    body: activeAlerts[0].description || 'Emergency flood warning. Evacuate low-lying areas.',
                    targetRole: 'all',
                    priority: 'high'
                  })
                });
                await fetch('/api/notifications/sms/send', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    message: `EMERGENCY ALERT: ${activeAlerts[0].headline}. Seek shelter immediately.`,
                    targetZone: 'Velachery - Adyar Floodplain'
                  })
                });
              } catch (e) {
                console.warn('Broadcast API call warning:', e);
              }
              onAcknowledge(activeAlerts[0].id);
            }}
            className={`cta cta--primary cta--mini gap-1.5 ${isCritical ? 'cta--light' : ''}`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            Acknowledge &amp; Broadcast
          </button>
        </div>

      </div>
    </div>
  );
};
