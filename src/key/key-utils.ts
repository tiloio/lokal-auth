const IV_LENGTH = 16;
const SALT_LENGTH = 32;

export function createIV(ivLength = IV_LENGTH) {
  return globalThis.crypto.getRandomValues(new Uint8Array(ivLength));
}

export function createSalt(saltLength = SALT_LENGTH) {
  return globalThis.crypto.getRandomValues(new Uint8Array(saltLength));
}
