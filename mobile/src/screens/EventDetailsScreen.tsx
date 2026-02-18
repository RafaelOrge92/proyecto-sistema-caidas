import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { RootStackParamList } from '../navigation/types';
import { ApiError } from '../api/client';
import { getEvent, updateEventStatus } from '../api/endpoints';
import { FallEvent } from '../api/types';
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
type ReviewStatus = NonNullable<FallEvent['status']>;

const REVIEW_STATUS_OPTIONS: { value: ReviewStatus; label: string }[] = [
  { value: 'OPEN', label: 'Abierto' },
  { value: 'CONFIRMED_FALL', label: 'Caida confirmada' },
  { value: 'FALSE_ALARM', label: 'Falsa alarma' },
  { value: 'RESOLVED', label: 'Resuelto' }
];

const normalizeReviewStatus = (status?: string | null): ReviewStatus => {
  switch (status) {
    case 'CONFIRMED_FALL':
    case 'FALSE_ALARM':
    case 'RESOLVED':
      return status;
    default:
      return 'OPEN';
  }
};

const normalizeReviewComment = (value?: string | null): string => (typeof value === 'string' ? value.trim() : '');

const getReviewStatusLabel = (status: ReviewStatus) => {
  switch (status) {
    case 'CONFIRMED_FALL':
      return 'caida confirmada';
    case 'FALSE_ALARM':
      return 'falsa alarma';
    case 'RESOLVED':
      return 'resuelto';
    default:
      return 'abierto';
  }
};

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
    if (error.status === 403) return 'No tienes permiso para revisar este evento.';
    if (error.status === 404) return 'No se encontro el evento para actualizar.';
    if (error.status >= 500) return 'El backend no pudo actualizar el evento.';
    return error.message || 'No se pudo guardar la revision del evento.';
  }

  return 'No se pudo guardar la revision del evento.';
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
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('OPEN');
  const [reviewComment, setReviewComment] = useState('');
  const [isEditingReview, setIsEditingReview] = useState(false);
  const canReview = Boolean(user && event);

  const updateStatusMutation = useMutation({
    mutationFn: (payload: { status: ReviewStatus; reviewComment: string }) =>
      updateEventStatus(eventId, {
        status: payload.status,
        reviewComment: payload.reviewComment
      }),
    onSuccess: (updatedEvent, payload) => {
      setFeedback({
        type: 'success',
        message: `Evento actualizado a ${getReviewStatusLabel(payload.status)}.`
      });
      setIsEditingReview(false);
      setReviewStatus(normalizeReviewStatus(updatedEvent?.status ?? payload.status));
      setReviewComment((updatedEvent?.reviewComment ?? payload.reviewComment ?? '').slice(0, 255));
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getReviewErrorMessage(error) });
    }
  });

  useEffect(() => {
    if (!event || isEditingReview || updateStatusMutation.isPending) return;
    setReviewStatus(normalizeReviewStatus(event.status));
    setReviewComment((event.reviewComment || '').slice(0, 255));
  }, [event?.id, event?.status, event?.reviewComment, isEditingReview, updateStatusMutation.isPending]);

  const hasPendingChanges = Boolean(event) &&
    (reviewStatus !== normalizeReviewStatus(event?.status) ||
      normalizeReviewComment(reviewComment) !== normalizeReviewComment(event?.reviewComment));

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
          <Text style={styles.sectionTitle}>Revision editable</Text>
          <Text style={styles.sectionHint}>Actualiza estado y comentario como en el panel web.</Text>

          <View style={styles.statusGrid}>
            {REVIEW_STATUS_OPTIONS.map((option) => {
              const isSelected = reviewStatus === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setFeedback(null);
                    setIsEditingReview(true);
                    setReviewStatus(option.value);
                  }}
                  style={[
                    styles.statusOption,
                    isSelected && styles.statusOptionActive,
                    (!canReview || isPending) && styles.statusOptionDisabled
                  ]}
                  disabled={!canReview || isPending}
                >
                  <StatusPill status={option.value} />
                  <Text style={[styles.statusOptionLabel, isSelected && styles.statusOptionLabelActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.commentWrap}>
            <Text style={styles.commentLabel}>Comentario</Text>
            <TextInput
              value={reviewComment}
              onChangeText={(value) => {
                setFeedback(null);
                setIsEditingReview(true);
                setReviewComment(value);
              }}
              editable={canReview && !isPending}
              maxLength={255}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder="Anade observaciones de la revision..."
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.commentInput}
            />
            <Text style={styles.commentCounter}>{reviewComment.length}/255</Text>
          </View>

          <View style={styles.actionsWrap}>
            <PrimaryButton
              title={isPending ? 'Guardando...' : 'Guardar revision'}
              onPress={() => {
                setFeedback(null);
                updateStatusMutation.mutate({ status: reviewStatus, reviewComment });
              }}
              disabled={!canReview || isPending || !hasPendingChanges}
            />
          </View>

          {!canReview ? <Text style={styles.sectionHelp}>No tienes permisos para revisar este evento.</Text> : null}
          {canReview && !hasPendingChanges ? <Text style={styles.sectionHelp}>No hay cambios pendientes por guardar.</Text> : null}
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
  statusGrid: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm
  },
  statusOption: {
    flexGrow: 1,
    minWidth: '46%',
    borderRadius: theme.radii.apple,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs
  },
  statusOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(99,102,241,0.16)'
  },
  statusOptionDisabled: {
    opacity: 0.6
  },
  statusOptionLabel: {
    fontFamily: theme.typography.family.medium,
    fontSize: theme.typography.size.xs,
    color: theme.colors.textSecondary
  },
  statusOptionLabelActive: {
    color: theme.colors.textPrimary
  },
  commentWrap: {
    marginTop: theme.spacing.md
  },
  commentLabel: {
    fontFamily: theme.typography.family.semibold,
    fontSize: theme.typography.size.xs,
    letterSpacing: 0.8,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase'
  },
  commentInput: {
    marginTop: theme.spacing.xs,
    minHeight: 108,
    borderRadius: theme.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bgSecondary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    fontFamily: theme.typography.family.medium,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textPrimary
  },
  commentCounter: {
    marginTop: theme.spacing.xs,
    alignSelf: 'flex-end',
    fontFamily: theme.typography.family.medium,
    fontSize: theme.typography.size.xs,
    color: theme.colors.textSecondary
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
