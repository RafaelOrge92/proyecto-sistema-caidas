import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { RootStackParamList } from '../navigation/types';
import { ApiError } from '../api/client';
import { getEvent, updateEventStatus } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { GlassScreen } from '../components/GlassScreen';
import { GlassHeader } from '../components/GlassHeader';
import { GlassCard } from '../components/GlassCard';
import { GlassBanner } from '../components/GlassBanner';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatusPill } from '../components/StatusPill';
import { InfoRow } from '../components/InfoRow';
import { AnimatedReveal } from '../components/AnimatedReveal';
import { theme } from '../theme';
import { formatDateTime } from '../utils/format';

const LIVE_REFETCH_INTERVAL_MS = 3000;
const REVIEW_STATUS = {
  CONFIRMED_FALL: 'CONFIRMED_FALL',
  FALSE_ALARM: 'FALSE_ALARM'
} as const;

type ReviewStatus = (typeof REVIEW_STATUS)[keyof typeof REVIEW_STATUS];

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

const getReviewErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.status === 403) return 'Solo administradores pueden revisar eventos.';
    if (error.status === 404) return 'No se encontro el evento para actualizar.';
    if (error.status >= 500) return 'El backend no pudo actualizar el evento.';
    return error.message || 'No se pudo actualizar el estado del evento.';
  }

  return 'No se pudo actualizar el estado del evento.';
};

export const EventDetailsScreen = ({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'EventDetails'>) => {
  const { eventId } = route.params;
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const query = useQuery({
    queryKey: ['event', eventId],
    queryFn: ({ signal }) => getEvent(eventId, signal),
    refetchInterval: LIVE_REFETCH_INTERVAL_MS
  });

  const event = query.data;
  const canReview = user?.role === 'ADMIN' && Boolean(event);

  const updateStatusMutation = useMutation({
    mutationFn: (status: ReviewStatus) => updateEventStatus(eventId, status),
    onSuccess: (_, status) => {
      setFeedback({
        type: 'success',
        message:
          status === REVIEW_STATUS.CONFIRMED_FALL
            ? 'Evento marcado como caida confirmada.'
            : 'Evento marcado como falsa alarma.'
      });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getReviewErrorMessage(error) });
    }
  });

  const isConfirmed = event?.status === REVIEW_STATUS.CONFIRMED_FALL;
  const isFalseAlarm = event?.status === REVIEW_STATUS.FALSE_ALARM;
  const isPending = updateStatusMutation.isPending;

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

      <AnimatedReveal delay={200}>
        <GlassCard>
          <Text style={styles.sectionTitle}>Clasificacion del evento</Text>
          <Text style={styles.sectionHint}>Define si fue una caida real o una falsa alarma.</Text>

          <View style={styles.actionsWrap}>
            <PrimaryButton
              title={
                isPending && updateStatusMutation.variables === REVIEW_STATUS.CONFIRMED_FALL
                  ? 'Guardando...'
                  : isConfirmed
                    ? 'Caida confirmada'
                    : 'Confirmar caida'
              }
              onPress={() => {
                setFeedback(null);
                updateStatusMutation.mutate(REVIEW_STATUS.CONFIRMED_FALL);
              }}
              disabled={!canReview || isPending || isConfirmed}
            />
            <PrimaryButton
              title={
                isPending && updateStatusMutation.variables === REVIEW_STATUS.FALSE_ALARM
                  ? 'Guardando...'
                  : isFalseAlarm
                    ? 'Falsa alarma'
                    : 'Marcar falsa alarma'
              }
              variant="ghost"
              onPress={() => {
                setFeedback(null);
                updateStatusMutation.mutate(REVIEW_STATUS.FALSE_ALARM);
              }}
              disabled={!canReview || isPending || isFalseAlarm}
            />
          </View>

          {user?.role !== 'ADMIN' ? <Text style={styles.sectionHelp}>Solo usuarios ADMIN pueden cambiar el estado.</Text> : null}
          {feedback ? (
            <Text style={[styles.feedbackText, feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError]}>
              {feedback.message}
            </Text>
          ) : null}
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
  sectionHint: {
    marginTop: theme.spacing.sm,
    fontFamily: theme.typography.family.medium,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary
  },
  actionsWrap: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm
  },
  sectionHelp: {
    marginTop: theme.spacing.sm,
    fontFamily: theme.typography.family.medium,
    fontSize: theme.typography.size.xs,
    color: theme.colors.textSecondary
  },
  feedbackText: {
    marginTop: theme.spacing.sm,
    fontFamily: theme.typography.family.medium,
    fontSize: theme.typography.size.sm
  },
  feedbackSuccess: {
    color: theme.colors.success
  },
  feedbackError: {
    color: theme.colors.error
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
