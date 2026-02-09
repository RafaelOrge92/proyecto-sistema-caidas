import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import { RootStackParamList } from '../navigation/types';
import { getEvent } from '../api/endpoints';
import { GlassScreen } from '../components/GlassScreen';
import { GlassHeader } from '../components/GlassHeader';
import { GlassCard } from '../components/GlassCard';
import { GlassBanner } from '../components/GlassBanner';
import { StatusPill } from '../components/StatusPill';
import { InfoRow } from '../components/InfoRow';
import { AnimatedReveal } from '../components/AnimatedReveal';
import { theme } from '../theme';
import { formatDateTime } from '../utils/format';

const getEventTypeLabel = (eventType?: string) => {
  switch (eventType) {
    case 'FALL':
      return 'Caida detectada';
    case 'EMERGENCY_BUTTON':
      return 'Boton de emergencia';
    case 'SIMULATED':
      return 'Evento simulado';
    default:
      return 'Detalle de evento';
  }
};

export const EventDetailsScreen = ({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'EventDetails'>) => {
  const { eventId } = route.params;
  const query = useQuery({
    queryKey: ['event', eventId],
    queryFn: ({ signal }) => getEvent(eventId, signal)
  });

  const event = query.data;

  return (
    <GlassScreen scroll>
      <GlassHeader title={getEventTypeLabel(event?.eventType)} subtitle={`ID del evento: ${eventId}`} onBack={() => navigation.goBack()} />
      {query.error ? <GlassBanner message="No se pudo cargar el detalle del evento." /> : null}

      <AnimatedReveal>
        <GlassCard>
          <View style={styles.rowHeader}>
            <Text style={styles.sectionTitle} numberOfLines={1}>
              Estado
            </Text>
            <StatusPill status={event?.status} style={styles.rowPill} />
          </View>
          <View style={styles.section}>
            <InfoRow label="Dispositivo" value={event?.deviceId} />
            <InfoRow label="Ocurrio" value={formatDateTime(event?.occurredAt)} />
            <InfoRow label="Registrado" value={formatDateTime(event?.createdAt)} />
          </View>
        </GlassCard>
      </AnimatedReveal>

      <AnimatedReveal delay={120}>
        <GlassCard>
          <Text style={styles.sectionTitle}>Revision</Text>
          <View style={styles.section}>
            <InfoRow label="Revisado por" value={event?.reviewedBy || 'Pendiente'} />
            <InfoRow label="Fecha de revision" value={formatDateTime(event?.reviewedAt)} />
            <InfoRow label="Comentario" value={event?.reviewComment || 'Sin comentario'} />
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
  rowPill: {
    maxWidth: '46%'
  },
  bottomSpacer: {
    height: 84
  }
});
