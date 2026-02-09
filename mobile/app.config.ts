import 'dotenv/config';
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'FallGuard Mobile',
  slug: config.slug ?? 'fallguard-mobile',
  orientation: config.orientation ?? 'portrait',
  userInterfaceStyle: 'dark',
  plugins: ['expo-font', 'expo-secure-store'],
  androidNavigationBar: {
    backgroundColor: '#0B1016',
    barStyle: 'light-content'
  },
  extra: {
    ...(config.extra ?? {}),
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
    frontendUrl: process.env.FRONTEND_URL || ''
  }
});
