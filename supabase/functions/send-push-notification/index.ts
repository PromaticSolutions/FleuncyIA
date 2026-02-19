import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Web Push crypto utilities using Web Crypto API
async function generatePushPayload(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
): Promise<{ endpoint: string; headers: Record<string, string>; body: Uint8Array }> {
  // Import VAPID private key
  const privateKeyBytes = base64UrlDecode(vapidPrivateKey);
  const publicKeyBytes = base64UrlDecode(vapidPublicKey);
  
  // Create JWT for VAPID
  const audience = new URL(subscription.endpoint).origin;
  const vapidToken = await createVapidJwt(audience, privateKeyBytes, publicKeyBytes);
  
  // Encrypt payload
  const encrypted = await encryptPayload(
    subscription.keys.p256dh,
    subscription.keys.auth,
    new TextEncoder().encode(payload),
  );

  return {
    endpoint: subscription.endpoint,
    headers: {
      'Authorization': `vapid t=${vapidToken}, k=${vapidPublicKey}`,
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      'TTL': '86400',
      'Urgency': 'normal',
    },
    body: encrypted,
  };
}

function base64UrlDecode(str: string): Uint8Array {
  const padding = '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function createVapidJwt(audience: string, privateKeyBytes: Uint8Array, publicKeyBytes: Uint8Array): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    aud: audience,
    exp: now + 86400,
    sub: 'mailto:push@fluencyia.app',
  };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const claimsB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(claims)));
  const unsigned = `${headerB64}.${claimsB64}`;

  // Import private key for signing
  const key = await crypto.subtle.importKey(
    'pkcs8',
    convertEcPrivateKey(privateKeyBytes, publicKeyBytes),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(unsigned),
  );

  // Convert DER signature to raw r||s
  const sigBytes = derToRaw(new Uint8Array(signature));
  return `${unsigned}.${base64UrlEncode(sigBytes)}`;
}

// Convert raw EC private key (32 bytes) + public key (65 bytes) to PKCS8 DER
function convertEcPrivateKey(privateKey: Uint8Array, publicKey: Uint8Array): ArrayBuffer {
  // PKCS8 wrapper for EC P-256
  const pkcs8Header = new Uint8Array([
    0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13,
    0x06, 0x07, 0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x02,
    0x01, 0x06, 0x08, 0x2A, 0x86, 0x48, 0xCE, 0x3D,
    0x03, 0x01, 0x07, 0x04, 0x6D, 0x30, 0x6B, 0x02,
    0x01, 0x01, 0x04, 0x20,
  ]);
  const middlePart = new Uint8Array([0xA1, 0x44, 0x03, 0x42, 0x00]);
  
  const result = new Uint8Array(pkcs8Header.length + 32 + middlePart.length + 65);
  result.set(pkcs8Header);
  result.set(privateKey.slice(0, 32), pkcs8Header.length);
  result.set(middlePart, pkcs8Header.length + 32);
  result.set(publicKey.slice(0, 65), pkcs8Header.length + 32 + middlePart.length);
  return result.buffer;
}

function derToRaw(der: Uint8Array): Uint8Array {
  // If already 64 bytes, it's raw format
  if (der.length === 64) return der;
  
  // Parse DER sequence
  const raw = new Uint8Array(64);
  let offset = 2; // Skip SEQUENCE tag + length
  
  // Read r
  if (der[offset] !== 0x02) return der.slice(0, 64);
  offset++;
  let rLen = der[offset++];
  let rOffset = offset;
  if (rLen === 33 && der[rOffset] === 0) { rOffset++; rLen--; }
  raw.set(der.slice(rOffset, rOffset + Math.min(rLen, 32)), 32 - Math.min(rLen, 32));
  offset = rOffset + rLen;
  if (der[rOffset - 1] === 0) offset = rOffset + rLen;
  
  // Read s  
  if (der[offset] !== 0x02) return raw;
  offset++;
  let sLen = der[offset++];
  let sOffset = offset;
  if (sLen === 33 && der[sOffset] === 0) { sOffset++; sLen--; }
  raw.set(der.slice(sOffset, sOffset + Math.min(sLen, 32)), 64 - Math.min(sLen, 32));
  
  return raw;
}

async function encryptPayload(
  p256dhKey: string,
  authSecret: string,
  payload: Uint8Array,
): Promise<Uint8Array> {
  const clientPublicKey = base64UrlDecode(p256dhKey);
  const clientAuth = base64UrlDecode(authSecret);

  // Generate local ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits'],
  );

  // Import client public key
  const clientKey = await crypto.subtle.importKey(
    'raw',
    clientPublicKey,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  );

  // Derive shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientKey },
    localKeyPair.privateKey,
    256,
  );

  // Export local public key
  const localPublicKeyRaw = await crypto.subtle.exportKey('raw', localKeyPair.publicKey);
  const localPublicKeyBytes = new Uint8Array(localPublicKeyRaw);

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Derive encryption key using HKDF
  const sharedSecretKey = await crypto.subtle.importKey(
    'raw',
    sharedSecret,
    { name: 'HKDF' },
    false,
    ['deriveBits'],
  );

  // auth_info = "WebPush: info" || 0x00 || client_public || server_public
  const authInfo = new Uint8Array([
    ...new TextEncoder().encode('WebPush: info\0'),
    ...clientPublicKey,
    ...localPublicKeyBytes,
  ]);

  // IKM = HKDF(auth_secret, shared_secret, auth_info, 32)
  const authKey = await crypto.subtle.importKey('raw', clientAuth, { name: 'HKDF' }, false, ['deriveBits']);
  const ikm = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(sharedSecret), info: authInfo },
      authKey,
      256,
    ),
  );

  const ikmKey = await crypto.subtle.importKey('raw', ikm, { name: 'HKDF' }, false, ['deriveBits']);

  // CEK = HKDF(salt, ikm, "Content-Encoding: aes128gcm" || 0x01, 16)
  const cekInfo = new Uint8Array([...new TextEncoder().encode('Content-Encoding: aes128gcm\0\x01')]);
  const cek = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt, info: cekInfo },
      ikmKey,
      128,
    ),
  );

  // Nonce = HKDF(salt, ikm, "Content-Encoding: nonce" || 0x01, 12)
  const nonceInfo = new Uint8Array([...new TextEncoder().encode('Content-Encoding: nonce\0\x01')]);
  const nonce = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt, info: nonceInfo },
      ikmKey,
      96,
    ),
  );

  // Encrypt with AES-128-GCM
  const aesKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  
  // Add padding delimiter
  const paddedPayload = new Uint8Array([...payload, 2]); // 2 = record delimiter
  
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      aesKey,
      paddedPayload,
    ),
  );

  // Build aes128gcm header: salt(16) || rs(4) || idlen(1) || keyid(65) || encrypted
  const rs = new ArrayBuffer(4);
  new DataView(rs).setUint32(0, paddedPayload.length + 16); // record size = padded + tag
  
  const header = new Uint8Array([
    ...salt,
    ...new Uint8Array(rs),
    localPublicKeyBytes.length,
    ...localPublicKeyBytes,
  ]);

  const result = new Uint8Array(header.length + encrypted.length);
  result.set(header);
  result.set(encrypted, header.length);
  return result;
}

// Send push to a single subscription
async function sendPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: Record<string, unknown>,
  vapidPublicKey: string,
  vapidPrivateKey: string,
): Promise<boolean> {
  try {
    const { endpoint, headers, body } = await generatePushPayload(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      JSON.stringify(payload),
      vapidPublicKey,
      vapidPrivateKey,
    );

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body,
    });

    if (response.status === 410 || response.status === 404) {
      // Subscription expired, clean up
      return false;
    }

    return response.ok;
  } catch (err) {
    console.error('[Push] Send error:', err);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
  const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Handle GET request for VAPID public key
  const url = new URL(req.url);
  if (url.searchParams.get('action') === 'get-vapid-key') {
    return new Response(JSON.stringify({ vapidPublicKey: VAPID_PUBLIC_KEY }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { userId, userIds, title, body: notifBody, url: notifUrl, tag } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get subscriptions for target user(s)
    let query = supabase.from('push_subscriptions').select('*');
    
    if (userIds && Array.isArray(userIds)) {
      query = query.in('user_id', userIds);
    } else if (userId) {
      query = query.eq('user_id', userId);
    } else {
      // Send to all (for daily reminders)
      // No filter
    }

    const { data: subscriptions, error } = await query;
    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = {
      title: title || 'Fluency IA',
      body: notifBody || '',
      url: notifUrl || '/home',
      tag: tag || 'fluency-general',
    };

    let sent = 0;
    const expiredEndpoints: string[] = [];

    for (const sub of subscriptions) {
      const success = await sendPush(sub, payload, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
      if (success) {
        sent++;
      } else {
        expiredEndpoints.push(sub.endpoint);
      }
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints);
    }

    console.log(`[Push] Sent ${sent}/${subscriptions.length}, cleaned ${expiredEndpoints.length}`);

    return new Response(JSON.stringify({ sent, total: subscriptions.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[Push] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
