import Constants from 'expo-constants';

type ExtraConfig = {
  apiBaseUrl?: string;
  frontendUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {}) as ExtraConfig;

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

export const API_BASE_URL = normalizeBaseUrl(
  extra.apiBaseUrl || process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:3000/api'
);

export const FRONTEND_URL = (extra.frontendUrl || '').trim();
