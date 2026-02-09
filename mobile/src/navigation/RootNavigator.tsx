import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { TabsNavigator } from './TabsNavigator';
import { DeviceDetailsScreen } from '../screens/DeviceDetailsScreen';
import { EventDetailsScreen } from '../screens/EventDetailsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { useAuth } from '../auth/AuthContext';
import { LoadingScreen } from '../components/LoadingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { user, isReady } = useAuth();

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Tabs" component={TabsNavigator} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="DeviceDetails" component={DeviceDetailsScreen} />
          <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};
