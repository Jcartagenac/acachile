export declare const passwordConstants: {
  PBKDF2_PREFIX: string;
  PBKDF2_ITERATIONS: number;
  PBKDF2_SALT_BYTES: number;
  PBKDF2_KEY_BYTES: number;
  LEGACY_SALT: string;
};

export declare function hashPassword(password: string): Promise<string>;

export declare function verifyPassword(
  password: string,
  storedHash: string,
): Promise<{ valid: boolean; needsUpgrade: boolean }>;

export declare function needsPasswordUpgrade(storedHash: string): boolean;
