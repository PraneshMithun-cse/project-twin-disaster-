// ============================================================
// WhatsApp Emergency Broadcast Gateway
//
// Supports two live providers and degrades to a fully functional
// simulation mode when no credentials are configured, so the
// evacuation workflow is demonstrable end-to-end without billing.
//
//   1. Meta WhatsApp Cloud API  (WHATSAPP_CLOUD_TOKEN + WHATSAPP_PHONE_NUMBER_ID)
//   2. Twilio WhatsApp          (TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_WHATSAPP_FROM)
// ============================================================

export type WhatsAppProvider = 'meta_cloud' | 'twilio' | 'simulation';

export interface WhatsAppSendResult {
  ok: boolean;
  provider: WhatsAppProvider;
  providerMessageId?: string;
  error?: string;
}

export function getActiveProvider(): WhatsAppProvider {
  if (process.env.WHATSAPP_CLOUD_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    return 'meta_cloud';
  }
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM
  ) {
    return 'twilio';
  }
  return 'simulation';
}

export function getProviderStatus() {
  const provider = getActiveProvider();
  return {
    provider,
    live: provider !== 'simulation',
    metaConfigured: !!(process.env.WHATSAPP_CLOUD_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
    twilioConfigured: !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_FROM
    ),
    note:
      provider === 'simulation'
        ? 'No WhatsApp credentials found. Messages are rendered and logged exactly as they would be sent, but are not delivered to real handsets.'
        : `Live WhatsApp delivery active via ${provider}.`
  };
}

/** Normalise an arbitrary phone string to E.164, defaulting to the India country code. */
export function normalisePhone(raw: string, defaultCountryCode = '+91'): string | null {
  if (!raw) return null;
  let value = String(raw).trim().replace(/[\s\-()."']/g, '');
  if (value.startsWith('00')) value = `+${value.slice(2)}`;
  if (!value.startsWith('+')) {
    value = value.replace(/^0+/, '');
    // A bare 10-digit Indian mobile number is the common CSV case.
    value = `${defaultCountryCode}${value}`;
  }
  if (!/^\+[1-9]\d{7,14}$/.test(value)) return null;
  return value;
}

async function sendViaMetaCloud(to: string, body: string): Promise<WhatsAppSendResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const token = process.env.WHATSAPP_CLOUD_TOKEN!;
  const version = process.env.WHATSAPP_API_VERSION || 'v21.0';

  const res = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to.replace('+', ''),
      type: 'text',
      text: { preview_url: false, body }
    })
  });

  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      provider: 'meta_cloud',
      error: json?.error?.message || `Meta Cloud API responded ${res.status}`
    };
  }
  return {
    ok: true,
    provider: 'meta_cloud',
    providerMessageId: json?.messages?.[0]?.id
  };
}

async function sendViaTwilio(to: string, body: string): Promise<WhatsAppSendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_WHATSAPP_FROM!;

  const form = new URLSearchParams({
    From: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
    To: `whatsapp:${to}`,
    Body: body
  });

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: form.toString()
  });

  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      provider: 'twilio',
      error: json?.message || `Twilio responded ${res.status}`
    };
  }
  return { ok: true, provider: 'twilio', providerMessageId: json?.sid };
}

export async function sendWhatsAppMessage(to: string, body: string): Promise<WhatsAppSendResult> {
  const provider = getActiveProvider();

  try {
    if (provider === 'meta_cloud') return await sendViaMetaCloud(to, body);
    if (provider === 'twilio') return await sendViaTwilio(to, body);
  } catch (err: any) {
    return { ok: false, provider, error: err?.message || 'Network failure contacting WhatsApp provider' };
  }

  console.log(`[WhatsApp SIMULATION] -> ${to}\n${body}\n---`);
  return {
    ok: true,
    provider: 'simulation',
    providerMessageId: `sim-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  };
}

/**
 * Fan out one broadcast to many recipients with bounded concurrency so a
 * 500-employee roster does not open 500 sockets at once.
 */
export async function sendWhatsAppBatch(
  messages: { to: string; body: string; ref: string }[],
  concurrency = 8
): Promise<Record<string, WhatsAppSendResult>> {
  const results: Record<string, WhatsAppSendResult> = {};
  let cursor = 0;

  async function worker() {
    while (cursor < messages.length) {
      const index = cursor++;
      const msg = messages[index];
      results[msg.ref] = await sendWhatsAppMessage(msg.to, msg.body);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, messages.length) }, worker));
  return results;
}
