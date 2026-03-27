import "server-only";

import { getAuthEnvironment } from "./auth.config";

const JWT_HEADER = {
  alg: "HS256",
  typ: "JWT",
} as const;

export type SessionClaims = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
};

export async function createSessionToken(claims: SessionClaims): Promise<string> {
  const headerSegment = encodeBase64Url(
    new TextEncoder().encode(JSON.stringify(JWT_HEADER)),
  );
  const payloadSegment = encodeBase64Url(
    new TextEncoder().encode(JSON.stringify(claims)),
  );
  const signatureSegment = await signToken(
    `${headerSegment}.${payloadSegment}`,
    getAuthEnvironment().jwtSecret,
  );

  return `${headerSegment}.${payloadSegment}.${signatureSegment}`;
}

export async function verifySessionToken(
  token: string,
): Promise<SessionClaims | null> {
  try {
    const [headerSegment, payloadSegment, signatureSegment] = token.split(".");

    if (!headerSegment || !payloadSegment || !signatureSegment) {
      return null;
    }

    const isValid = await verifyTokenSignature(
      `${headerSegment}.${payloadSegment}`,
      signatureSegment,
      getAuthEnvironment().jwtSecret,
    );

    if (!isValid) {
      return null;
    }

    const payloadBytes = decodeBase64Url(payloadSegment);
    const payload = JSON.parse(
      new TextDecoder().decode(payloadBytes),
    ) as Partial<SessionClaims>;

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.iat !== "number" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload as SessionClaims;
  } catch {
    return null;
  }
}

async function signToken(
  input: string,
  secret: string,
): Promise<string> {
  const key = await importHmacKey(secret, ["sign"]);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(input),
  );

  return encodeBase64Url(new Uint8Array(signature));
}

async function verifyTokenSignature(
  input: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const key = await importHmacKey(secret, ["verify"]);
  const signatureBytes = Uint8Array.from(decodeBase64Url(signature));

  return crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    new TextEncoder().encode(input),
  );
}

async function importHmacKey(
  secret: string,
  usages: KeyUsage[],
): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    usages,
  );
}

function encodeBase64Url(input: Uint8Array): string {
  const base64 = encodeBase64(input);

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const remainder = padded.length % 4;
  const base64 = remainder === 0 ? padded : padded + "=".repeat(4 - remainder);

  return decodeBase64(base64);
}

function encodeBase64(input: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(input).toString("base64");
  }

  let binary = "";

  input.forEach((value) => {
    binary += String.fromCharCode(value);
  });

  return btoa(binary);
}

function decodeBase64(input: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(input, "base64"));
  }

  const binary = atob(input);
  const output = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    output[index] = binary.charCodeAt(index);
  }

  return output;
}
