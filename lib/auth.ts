/**
 * Cryptographically secure authentication helpers for EchoDub Admin
 * Compatible with Next.js Edge Middleware and Node.js Runtime (Web Crypto API)
 */

const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function getSecretKey(): string {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL: ADMIN_SESSION_SECRET or ADMIN_PASSWORD must be configured in production environment.");
    }
    return "echodub_dev_default_secret_key_change_in_prod";
  }
  return secret;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  let m = str.replace(/-/g, "+").replace(/_/g, "/");
  while (m.length % 4) {
    m += "=";
  }
  const binary = atob(m);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export interface AdminTokenPayload {
  role: "admin";
  iat: number;
  exp: number;
}

export async function createAdminToken(): Promise<string> {
  const now = Date.now();
  const payload: AdminTokenPayload = {
    role: "admin",
    iat: now,
    exp: now + SESSION_EXPIRY_MS
  };

  const enc = new TextEncoder();
  const payloadStr = JSON.stringify(payload);
  const payloadPart = base64UrlEncode(enc.encode(payloadStr));

  const key = await getCryptoKey(getSecretKey());
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(payloadPart));
  const signaturePart = base64UrlEncode(new Uint8Array(signatureBuffer));

  return `${payloadPart}.${signaturePart}`;
}

export async function verifyAdminToken(token: string | undefined | null): Promise<boolean> {
  if (!token || typeof token !== "string") return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payloadPart, signaturePart] = parts;

  try {
    const key = await getCryptoKey(getSecretKey());
    const enc = new TextEncoder();
    const signatureBytes = base64UrlDecode(signaturePart);

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as unknown as BufferSource,
      enc.encode(payloadPart)
    );

    if (!isValid) return false;

    const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadPart));
    const payload: AdminTokenPayload = JSON.parse(payloadJson);

    if (payload.role !== "admin") return false;
    if (!payload.exp || Date.now() > payload.exp) return false;

    return true;
  } catch (err) {
    return false;
  }
}
