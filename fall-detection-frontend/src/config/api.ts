const API_URL_FALLBACK = 'http://localhost:3000/api';

const normalizeApiUrl = (value: string): string => value.replace(/\/+$/, '');

export const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL || API_URL_FALLBACK);

export const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${normalizedPath}`;
};
