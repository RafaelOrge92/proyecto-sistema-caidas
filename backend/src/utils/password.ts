import bcrypt from 'bcryptjs';

const DEFAULT_BCRYPT_ROUNDS = 10;

const resolveBcryptRounds = () => {
  const raw = Number(process.env.BCRYPT_ROUNDS || DEFAULT_BCRYPT_ROUNDS);
  if (!Number.isFinite(raw)) return DEFAULT_BCRYPT_ROUNDS;
  // Keep a practical range to avoid accidentally huge costs in dev.
  return Math.min(14, Math.max(8, Math.trunc(raw)));
};

const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

export const isBcryptHash = (value?: string | null) => {
  if (!value) return false;
  return BCRYPT_HASH_REGEX.test(value);
};

export const hashPassword = async (plainPassword: string) => {
  return bcrypt.hash(plainPassword, resolveBcryptRounds());
};

export const verifyPassword = async (plainPassword: string, storedPasswordHash: string) => {
  if (isBcryptHash(storedPasswordHash)) {
    return bcrypt.compare(plainPassword, storedPasswordHash);
  }
  // Legacy fallback: plain text passwords already stored in DB.
  return plainPassword === storedPasswordHash;
};
