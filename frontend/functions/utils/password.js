const PBKDF2_PREFIX = 'pbkdf2';
const PBKDF2_ITERATIONS = 150000;
const PBKDF2_SALT_BYTES = 16;
const PBKDF2_KEY_BYTES = 32;
const LEGACY_SALT = 'salt_aca_chile_2024';

const encoder = new TextEncoder();

const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToUint8Array = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const derivePbkdf2Key = async (password, saltBytes, iterations) => {
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: saltBytes,
      iterations,
    },
    passwordKey,
    PBKDF2_KEY_BYTES * 8,
  );

  return new Uint8Array(derivedBits);
};

export const hashPassword = async (password) => {
  const saltBytes = crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES));
  const derivedKey = await derivePbkdf2Key(password, saltBytes, PBKDF2_ITERATIONS);

  return [
    PBKDF2_PREFIX,
    PBKDF2_ITERATIONS,
    arrayBufferToBase64(saltBytes),
    arrayBufferToBase64(derivedKey),
  ].join('$');
};

const hashLegacyPassword = async (password) => {
  const data = encoder.encode(password + LEGACY_SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const timingSafeEqual = (a, b) => {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
};

export const verifyPassword = async (password, storedHash) => {
  if (!storedHash || typeof storedHash !== 'string') {
    return { valid: false, needsUpgrade: false };
  }

  if (storedHash.startsWith(`${PBKDF2_PREFIX}$`)) {
    const parts = storedHash.split('$');
    if (parts.length !== 4) {
      return { valid: false, needsUpgrade: true };
    }

    const [, iterationString, saltBase64, hashBase64] = parts;
    const iterations = Number(iterationString);
    if (!Number.isFinite(iterations) || iterations <= 0) {
      return { valid: false, needsUpgrade: true };
    }

    const saltBytes = base64ToUint8Array(saltBase64);
    const derivedKey = await derivePbkdf2Key(password, saltBytes, iterations);
    const expectedKey = base64ToUint8Array(hashBase64);

    const valid = timingSafeEqual(derivedKey, expectedKey);
    const needsUpgrade = valid && iterations < PBKDF2_ITERATIONS;

    return { valid, needsUpgrade };
  }

  const legacyHash = await hashLegacyPassword(password);
  const valid = legacyHash === storedHash;

  return { valid, needsUpgrade: valid };
};

export const needsPasswordUpgrade = (storedHash) => !storedHash.startsWith(`${PBKDF2_PREFIX}$`);

export const passwordConstants = {
  PBKDF2_PREFIX,
  PBKDF2_ITERATIONS,
  PBKDF2_SALT_BYTES,
  PBKDF2_KEY_BYTES,
  LEGACY_SALT,
};
