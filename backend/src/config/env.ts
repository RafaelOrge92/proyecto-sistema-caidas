const INSECURE_DEFAULT_JWT_SECRET = 'dev-secret-change-me';

const getRequiredEnv = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`[ENV] ${name} es obligatorio`);
  }
  return value;
};

export const getJwtSecret = (): string => {
  const secret = getRequiredEnv('JWT_SECRET');
  if (secret === INSECURE_DEFAULT_JWT_SECRET) {
    throw new Error('[ENV] JWT_SECRET no puede usar el valor inseguro por defecto');
  }
  return secret;
};
