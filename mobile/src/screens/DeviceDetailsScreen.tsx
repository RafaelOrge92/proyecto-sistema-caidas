import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import { RootStackParamList } from '../navigation/types';
import { getDevice, getEventsByDevice } from '../api/endpoints';
import { GlassScreen } from '../components/GlassScreen';
import { GlassHeader } from '../components/GlassHeader';
import { GlassCard } from '../components/GlassCard';
import { GlassBanner } from '../components/GlassBanner';
import { StatusPill } from '../components/StatusPill';
import { InfoRow } from '../components/InfoRow';
import { AnimatedReveal } from '../components/AnimatedReveal';
import { theme } from '../theme';
import { formatDateTime } from '../utils/format';

const LIVE_REFETCH_INTERVAL_MS = 3000;

const getPatientDisplayName = (
  device?: { patientFullName?: string; patientFirstName?: string; patientLastName?: string; patientId?: string } | null
) => {
  if (!device) return 'Sin asignar';
  const computedName = [device.patientFirstName, device.patientLastName].filter(Boolean).join(' ').trim();
  return device.patientFullName || computedName || device.patientId || 'Sin asignar';
};

export const DeviceDetailsScreen = ({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'DeviceDetails'>) => {
  const { deviceId } = route.params;
  const deviceQuery = useQuery({
    queryKey: ['device', deviceId],
    queryFn: ({ signal }) => getDevice(deviceId, signal),
    refetchInterval: LIVE_REFETCH_INTERVAL_MS
  });
  const eventsQuery = useQuery({
    queryKey: ['events', 'device', deviceId],
    queryFn: ({ signal }) => getEventsByDevice(deviceId, signal),
    refetchInterval: LIVE_REFETCH_INTERVAL_MS
  });

  const device = deviceQuery.data;

  return (
    <GlassScreen scroll>
      <GlassHeader title={device?.alias || 'Dispositivo'} subtitle={`ID: ${deviceId}`} onBack={() => navigation.goBack()} />
      {deviceQuery.error ? <GlassBanner message="No se pudo cargar el detalle del dispositivo." /> : null}

      <AnimatedReveal>
        <GlassCard>
          <View style={styles.rowHeader}>
            <Text style={styles.sectionTitle} numberOfLines={1}>
              Estado operativo
            </Text>
            <StatusPill
              label={device?.isActive ? 'ACTIVO' : 'INACTIVO'}
              tone={device?.isActive ? 'success' : 'muted'}
              style={styles.rowPill}
            />
          </View>
          <View style={styles.section}>
            <InfoRow label="Ultimo latido" value={formatDateTime(device?.lastSeenAt)} />
            <InfoRow label="Paciente asignado" value={getPatientDisplayName(device)} />
          </View>
        </GlassCard>
      </AnimatedReveal>

      <AnimatedReveal delay={120}>
        <GlassCard>
          <Text style={styles.sectionTitle}>Eventos recientes</Text>
          {eventsQuery.isLoading ? (
            <Text style={styles.sectionValue}>Cargando eventos...</Text>
          ) : eventsQuery.data && eventsQuery.data.length > 0 ? (
            eventsQuery.data.slice(0, 3).map((event) => (
              <View key={event.id} style={styles.eventRow}>
                <Text style={[styles.sectionValue, styles.eventDate]} numberOfLines={1}>
                  {formatDateTime(event.occurredAt)}
                </Text>
                <StatusPill status={event.status} style={styles.rowPill} />
              </View>
            ))
          ) : (
            <Text style={styles.sectionValue}>No hay eventos asociados a este dispositivo.</Text>
          )}
        </GlassCard>
      </AnimatedReveal>

      <AnimatedReveal delay={200}>
        <GlassCard>
          <Text style={styles.sectionTitle}>Resumen asistencial</Text>
          <View style={styles.section}>
            <InfoRow label="Conectividad" value={device?.isActive ? 'Operativa' : 'Sin actividad'} />
            <InfoRow label="Paciente" value={getPatientDisplayName(device)} />
          </View>
        </GlassCard>
      </AnimatedReveal>

      <View style={styles.bottomSpacer} />
    </GlassScreen>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: theme.typography.family.semibold,
    fontSize: theme.typography.size.md,
    color: theme.colors.textPrimary,
    flex: 1,
    minWidth: 0
  },
  sectionValue: {
    fontFamily: theme.typography.family.medium,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary
  },
  section: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.md
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm
  },
  eventRow: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm
  },
  eventDate: {
    flex: 1,
    minWidth: 0
  },
  rowPill: {
    maxWidth: '46%'
  },
  bottomSpacer: {
    height: 84
  }
});
