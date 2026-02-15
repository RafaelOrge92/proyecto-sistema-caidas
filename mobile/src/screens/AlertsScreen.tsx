import React, { useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { getEvents } from '../api/endpoints';
import { FallEvent } from '../api/types';
import { GlassScreen } from '../components/GlassScreen';
import { GlassHeader } from '../components/GlassHeader';
import { GlassCard } from '../components/GlassCard';
import { StatusPill } from '../components/StatusPill';
import { GlassBanner } from '../components/GlassBanner';
import { EmptyState } from '../components/EmptyState';
import { AnimatedReveal } from '../components/AnimatedReveal';
import { RootStackParamList } from '../navigation/types';
import { theme } from '../theme';
import { formatDateTime } from '../utils/format';

const LIVE_REFETCH_INTERVAL_MS = 3000;

const getEventTypeLabel = (eventType?: FallEvent['eventType']) => {
  switch (eventType) {
    case 'FALL':
      return 'Caida';
    case 'EMERGENCY_BUTTON':
      return 'Boton de emergencia';
    case 'SIMULATED':
      return 'Simulado';
    default:
      return 'Alerta';
  }
};

const AlertItem = React.memo(({ item, onPress }: { item: FallEvent; onPress: (id: string) => void }) => {
  return (
    <AnimatedReveal>
      <GlassCard onPress={() => onPress(item.id)} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.alertTitle} numberOfLines={2}>
              {getEventTypeLabel(item.eventType)}
            </Text>
            <StatusPill status={item.status} style={styles.headerPill} />
          </View>
          <Text style={styles.alertMeta} numberOfLines={1}>
            {formatDateTime(item.occurredAt)}
          </Text>
        </View>
        <View style={styles.alertRow}>
          <MaterialCommunityIcons name="harddisk" size={18} color={theme.colors.accentCyan} />
          <Text style={styles.alertDevice} numberOfLines={1}>
            {item.deviceId}
          </Text>
        </View>
      </GlassCard>
    </AnimatedReveal>
  );
});

export const AlertsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const query = useQuery({
    queryKey: ['events'],
    queryFn: ({ signal }) => getEvents(signal),
    refetchInterval: LIVE_REFETCH_INTERVAL_MS
  });

  const alerts = useMemo(() => {
    const events = query.data ?? [];
    return events.filter((event) => event.status === 'OPEN' || event.status === 'CONFIRMED_FALL');
  }, [query.data]);

  return (
    <GlassScreen scroll={false} padding={false}>
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <AlertItem item={item} onPress={(id) => navigation.navigate('EventDetails', { eventId: id })} />}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <AnimatedReveal>
              <GlassHeader title="Alertas" subtitle="Incidentes abiertos o confirmados" />
            </AnimatedReveal>
            {query.error ? <GlassBanner message="No se pudieron cargar las alertas." /> : null}
          </View>
        }
        ListEmptyComponent={!query.isLoading ? <EmptyState title="Sin alertas activas" subtitle="Todos los incidentes estan resueltos." /> : null}
        refreshControl={<RefreshControl refreshing={query.isFetching} onRefresh={query.refetch} tintColor={theme.colors.primary} />}
      />
    </GlassScreen>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xxl + 86,
    gap: theme.spacing.lg
  },
  headerWrap: {
    gap: theme.spacing.lg
  },
  card: {
    gap: theme.spacing.lg,
    borderColor: theme.colors.borderStrong,
    minHeight: 168
  },
  cardHeader: {
    alignItems: 'flex-start',
    gap: theme.spacing.xs
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    width: '100%'
  },
  headerPill: {
    marginLeft: theme.spacing.xs,
    maxWidth: '46%'
  },
  alertTitle: {
    flex: 1,
    minWidth: 0,
    fontFamily: theme.typography.family.semibold,
    fontSize: theme.typography.size.md,
    lineHeight: 24,
    color: theme.colors.textPrimary
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm
  },
  alertDevice: {
    flex: 1,
    fontFamily: theme.typography.family.medium,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textPrimary
  },
  alertMeta: {
    fontFamily: theme.typography.family.medium,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary
  }
});
