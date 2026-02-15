import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { GlassScreen } from '../components/GlassScreen';
import { GlassHeader } from '../components/GlassHeader';
import { GlassCard } from '../components/GlassCard';
import { InfoRow } from '../components/InfoRow';
import { PrimaryButton } from '../components/PrimaryButton';
import { AnimatedReveal } from '../components/AnimatedReveal';
import { API_BASE_URL } from '../config/env';
import { RootStackParamList } from '../navigation/types';
import { theme } from '../theme';
import { useAuth } from '../auth/AuthContext';

export const SettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('Tabs');
  };

  return (
    <GlassScreen scroll>
      <GlassHeader
        title="Ajustes"
        subtitle="Preferencias y configuracion de la aplicacion"
        onBack={handleBack}
      />

      <AnimatedReveal>
        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Cuenta activa</Text>
          <View style={styles.section}>
            <InfoRow label="Nombre" value={user?.fullName || 'Sin datos'} />
            <InfoRow label="Correo" value={user?.email || 'Sin datos'} />
            <InfoRow label="Rol" value={user?.role || 'Sin datos'} />
            <PrimaryButton title="Cerrar sesion" variant="danger" onPress={handleLogout} style={styles.actionButton} />
          </View>
        </GlassCard>
      </AnimatedReveal>

      <AnimatedReveal delay={120}>
        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Conectividad backend</Text>
          <View style={styles.section}>
            <InfoRow label="API base URL" value={API_BASE_URL} />
            <InfoRow label="Autenticacion" value="Bearer token" />
          </View>
        </GlassCard>
      </AnimatedReveal>

      <AnimatedReveal delay={200}>
        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Acerca de la app</Text>
          <View style={styles.section}>
            <InfoRow label="Estilo" value="Morado oscuro + cristal liquido" />
            <InfoRow label="Version" value={Constants.expoConfig?.version || '1.0.0'} />
            <PrimaryButton
              title="Refrescar datos"
              variant="ghost"
              onPress={() => queryClient.invalidateQueries()}
              style={styles.actionButton}
            />
          </View>
        </GlassCard>
      </AnimatedReveal>

      <View style={styles.bottomSpacer} />
    </GlassScreen>
  );
};

const styles = StyleSheet.create({
  card: {
    borderColor: theme.colors.borderStrong
  },
  sectionTitle: {
    fontFamily: theme.typography.family.semibold,
    fontSize: theme.typography.size.md,
    color: theme.colors.textPrimary
  },
  section: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.lg
  },
  actionButton: {
    marginTop: theme.spacing.xs
  },
  bottomSpacer: {
    height: 100
  }
});
