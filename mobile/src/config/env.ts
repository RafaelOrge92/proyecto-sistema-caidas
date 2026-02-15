import Constants from 'expo-constants';

type ExtraConfig = {
  apiBaseUrl?: string;
  frontendUrl?: string;
  googleWebClientId?: string;
  googleAndroidClientId?: string;
  googleIosClientId?: string;
};

const extra = (Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {}) as ExtraConfig;

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

export const API_BASE_URL = normalizeBaseUrl(
  extra.apiBaseUrl || process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:3000/api'
);

export const FRONTEND_URL = (extra.frontendUrl || '').trim();

export const GOOGLE_WEB_CLIENT_ID = (
  extra.googleWebClientId ||
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  ''
).trim();

export const GOOGLE_ANDROID_CLIENT_ID = (
  extra.googleAndroidClientId ||
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
  ''
).trim();

export const GOOGLE_IOS_CLIENT_ID = (
  extra.googleIosClientId ||
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
  ''
).trim();
