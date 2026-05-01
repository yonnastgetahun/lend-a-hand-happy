/**
 * generateUuid() returns an RFC 4122 v4 UUID string.
 *
 * Resolution order:
 *   1. expo-crypto's randomUUID (preferred on device — uses platform secure RNG)
 *   2. globalThis.crypto.randomUUID (Node 14.17+, Bun, modern browsers/Hermes)
 *   3. Math.random fallback (last resort — non-cryptographic, but valid v4 shape)
 *
 * The fallback exists so this module is import-safe in test environments
 * where expo-crypto isn't installed and the runtime might pre-date randomUUID.
 */

let expoRandomUUID: (() => string) | null = null;
try {
  // Optional dep: expo-crypto is preferred on RN but not required for tests.
  // require is wrapped so missing module doesn't throw at import time.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const expoCrypto = require('expo-crypto');
  if (typeof expoCrypto?.randomUUID === 'function') {
    expoRandomUUID = expoCrypto.randomUUID.bind(expoCrypto);
  }
} catch {
  expoRandomUUID = null;
}

export function generateUuid(): string {
  if (expoRandomUUID) return expoRandomUUID();

  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (typeof g.crypto?.randomUUID === 'function') return g.crypto.randomUUID();

  // RFC 4122 v4 fallback using Math.random — sufficient for non-security IDs.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
