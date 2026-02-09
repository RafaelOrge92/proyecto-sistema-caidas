import React from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';

import { RootNavigator } from './navigation/RootNavigator';
import { navigationTheme } from './theme';
import { LoadingScreen } from './components/LoadingScreen';
import { AuthProvider } from './auth/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false
    }
  }
});

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold
  });

  React.useEffect(() => {
    if (Platform.OS !== 'android') return;

    SystemUI.setBackgroundColorAsync('#0B1016').catch(() => undefined);
    NavigationBar.setPositionAsync('relative').catch(() => undefined);
    NavigationBar.setVisibilityAsync('visible').catch(() => undefined);
    NavigationBar.setBackgroundColorAsync('#0B1016').catch(() => undefined);
    NavigationBar.setBorderColorAsync('#0B1016').catch(() => undefined);
    NavigationBar.setButtonStyleAsync('light').catch(() => undefined);
  }, []);

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NavigationContainer theme={navigationTheme}>
            <StatusBar style="light" backgroundColor="#0B1016" translucent={false} />
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
