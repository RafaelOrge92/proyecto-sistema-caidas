import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { getEvents } from '../api/endpoints';
import { FallEvent } from '../api/types';
import { GlassScreen } from '../components/GlassScreen';
import { GlassBanner } from '../components/GlassBanner';
import { EmptyState } from '../components/EmptyState';
import { AnimatedReveal } from '../components/AnimatedReveal';
import { StatusPill } from '../components/StatusPill';
import { RootStackParamList } from '../navigation/types';
import { theme } from '../theme';
import { formatDateTime } from '../utils/format';

const FEATURED_TILE_HEIGHT = 218;

const EVENT_STATUS_FILTER = {
  ALL: 'ALL',
  OPEN: 'OPEN',
  CONFIRMED_FALL: 'CONFIRMED_FALL',
  RESOLVED: 'RESOLVED',
  FALSE_ALARM: 'FALSE_ALARM'
} as const;

type EventStatusFilter = (typeof EVENT_STATUS_FILTER)[keyof typeof EVENT_STATUS_FILTER];

const FILTER_ORDER: readonly EventStatusFilter[] = [
  EVENT_STATUS_FILTER.ALL,
  EVENT_STATUS_FILTER.OPEN,
  EVENT_STATUS_FILTER.CONFIRMED_FALL,
  EVENT_STATUS_FILTER.RESOLVED,
  EVENT_STATUS_FILTER.FALSE_ALARM
];

const FILTER_META: Record<
  EventStatusFilter,
  {
    chipLabel: string;
    subtitleLabel: string;
    emptySubtitle: string;
    match: (event: FallEvent) => boolean;
  }
> = {
  [EVENT_STATUS_FILTER.ALL]: {
    chipLabel: 'Todos',
    subtitleLabel: 'Mostrando todos',
    emptySubtitle: 'No se han encontrado eventos registrados.',
    match: () => true
  },
  [EVENT_STATUS_FILTER.OPEN]: {
    chipLabel: 'Abiertos',
    subtitleLabel: 'Mostrando abiertos',
    emptySubtitle: 'No hay eventos abiertos con este filtro.',
    match: (event) => event.status === EVENT_STATUS_FILTER.OPEN
  },
  [EVENT_STATUS_FILTER.CONFIRMED_FALL]: {
    chipLabel: 'Confirmadas',
    subtitleLabel: 'Mostrando caidas confirmadas',
    emptySubtitle: 'No hay caidas confirmadas con este filtro.',
    match: (event) => event.status === EVENT_STATUS_FILTER.CONFIRMED_FALL
  },
  [EVENT_STATUS_FILTER.RESOLVED]: {
    chipLabel: 'Resueltas',
    subtitleLabel: 'Mostrando resueltas',
    emptySubtitle: 'No hay eventos resueltos con este filtro.',
    match: (event) => event.status === EVENT_STATUS_FILTER.RESOLVED
  },
  [EVENT_STATUS_FILTER.FALSE_ALARM]: {
    chipLabel: 'Falsas',
    subtitleLabel: 'Mostrando falsas alarmas',
    emptySubtitle: 'No hay falsas alarmas con este filtro.',
    match: (event) => event.status === EVENT_STATUS_FILTER.FALSE_ALARM
  }
};

const getEventTypeLabel = (eventType?: FallEvent['eventType']) => {
  switch (eventType) {
    case 'FALL':
      return 'Caida detectada';
    case 'EMERGENCY_BUTTON':
      return 'Boton de emergencia';
    case 'SIMULATED':
      return 'Evento simulado';
    default:
      return 'Evento';
  }
};

const getEventIcon = (eventType?: FallEvent['eventType']) => {
  switch (eventType) {
    case 'FALL':
      return 'alert-octagon-outline';
    case 'EMERGENCY_BUTTON':
      return 'alarm-light-outline';
    case 'SIMULATED':
      return 'beaker-outline';
    default:
      return 'alert-circle-outline';
  }
};

const minutesSince = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const ms = Date.now() - date.getTime();
  return Math.max(0, Math.round(ms / 60000));
};

const getTopGlowColors = (status?: FallEvent['status']): readonly [string, string, string] => {
  switch (status) {
    case EVENT_STATUS_FILTER.OPEN:
      return ['rgba(239,68,68,0.22)', 'rgba(239,68,68,0.08)', 'rgba(239,68,68,0)'];
    case EVENT_STATUS_FILTER.CONFIRMED_FALL:
      return ['rgba(249,115,22,0.22)', 'rgba(249,115,22,0.08)', 'rgba(249,115,22,0)'];
    case EVENT_STATUS_FILTER.RESOLVED:
      return ['rgba(16,185,129,0.22)', 'rgba(16,185,129,0.08)', 'rgba(16,185,129,0)'];
    case EVENT_STATUS_FILTER.FALSE_ALARM:
      return ['rgba(100,116,139,0.22)', 'rgba(100,116,139,0.08)', 'rgba(100,116,139,0)'];
    default:
      return ['rgba(148,163,184,0.2)', 'rgba(148,163,184,0.08)', 'rgba(148,163,184,0)'];
  }
};

const TopIconButton = ({
  icon,
  onPress,
  active
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress?: () => void;
  active?: boolean;
}) => {
  return (
    <Pressable onPress={onPress} style={[styles.topIconButton, active && styles.topIconButtonActive]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.03)']}
        style={StyleSheet.absoluteFill}
      />
      <MaterialCommunityIcons name={icon} size={24} color="rgba(231,238,255,0.82)" />
    </Pressable>
  );
};

const EventDeckItem = React.memo(
  ({
    item,
    onPress,
    delay
  }: {
    item: FallEvent;
    onPress: (id: string) => void;
    delay?: number;
  }) => {
    return (
      <AnimatedReveal delay={delay}>
        <Pressable onPress={() => onPress(item.id)} style={styles.eventCard}>
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.015)', 'rgba(255,255,255,0.02)']}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            pointerEvents="none"
            colors={getTopGlowColors(item.status)}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.eventTopGlow}
          />

          <View style={styles.eventHeaderRow}>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {getEventTypeLabel(item.eventType)}
            </Text>
            <StatusPill status={item.status} style={styles.eventPill} />
          </View>

          <View style={styles.eventMetaRow}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#9FAED0" />
            <Text style={styles.eventMetaText} numberOfLines={1}>
              {formatDateTime(item.occurredAt)}
            </Text>
          </View>

          <View style={styles.eventMetaRow}>
            <MaterialCommunityIcons name="harddisk" size={16} color={theme.colors.accentCyan} />
            <Text style={styles.eventMetaText} numberOfLines={1}>
              {item.deviceId}
            </Text>
          </View>

          <View style={styles.eventMetaRow}>
            <MaterialCommunityIcons name={getEventIcon(item.eventType)} size={16} color="#D5B6FF" />
            <Text style={styles.eventMetaText} numberOfLines={1}>
              {item.eventType || 'SIN_TIPO'}
            </Text>
          </View>
        </Pressable>
      </AnimatedReveal>
    );
  }
);

export const EventsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [statusFilter, setStatusFilter] = useState<EventStatusFilter>(EVENT_STATUS_FILTER.ALL);
  const [queryText, setQueryText] = useState('');

  const query = useQuery({
    queryKey: ['events'],
    queryFn: ({ signal }) => getEvents(signal)
  });

  const events = useMemo(() => query.data ?? [], [query.data]);
  const normalizedQuery = queryText.trim().toLowerCase();

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (!FILTER_META[statusFilter].match(event)) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const typeText = getEventTypeLabel(event.eventType).toLowerCase();
      const statusText = (event.status || '').toLowerCase();

      return (
        event.deviceId.toLowerCase().includes(normalizedQuery) ||
        typeText.includes(normalizedQuery) ||
        statusText.includes(normalizedQuery)
      );
    });
  }, [events, normalizedQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = events.length;
    const open = events.filter((event) => event.status === EVENT_STATUS_FILTER.OPEN).length;
    const confirmed = events.filter((event) => event.status === EVENT_STATUS_FILTER.CONFIRMED_FALL).length;
    const resolved = events.filter((event) => event.status === EVENT_STATUS_FILTER.RESOLVED).length;
    const falseAlarms = events.filter((event) => event.status === EVENT_STATUS_FILTER.FALSE_ALARM).length;
    const critical = open + confirmed;

    const latest = events
      .filter((event) => event.occurredAt)
      .sort((a, b) => {
        const aTime = a.occurredAt ? new Date(a.occurredAt).getTime() : 0;
        const bTime = b.occurredAt ? new Date(b.occurredAt).getTime() : 0;
        return bTime - aTime;
      })[0];

    const latestMinutes = latest ? minutesSince(latest.occurredAt) : null;
    const criticalRatio = total > 0 ? Math.round((critical / total) * 100) : 0;

    return {
      total,
      open,
      confirmed,
      resolved,
      falseAlarms,
      critical,
      latestMinutes,
      criticalRatio
    };
  }, [events]);

  const hasRefinements = statusFilter !== EVENT_STATUS_FILTER.ALL || normalizedQuery.length > 0;

  const handleResetRefinements = () => {
    setStatusFilter(EVENT_STATUS_FILTER.ALL);
    setQueryText('');
  };

  const emptySubtitle = normalizedQuery
    ? 'No hay coincidencias para esa busqueda con los filtros actuales.'
    : FILTER_META[statusFilter].emptySubtitle;

  return (
    <GlassScreen scroll={false} padding={false}>
      <View style={styles.stickyTopBar}>
        <AnimatedReveal>
          <View style={styles.topActionsRow}>
            <TopIconButton
              icon={hasRefinements ? 'filter-remove-outline' : 'filter-variant'}
              active={hasRefinements}
              onPress={handleResetRefinements}
            />
            <TopIconButton icon="cog-outline" onPress={() => navigation.navigate('Settings')} />
          </View>
        </AnimatedReveal>
      </View>

      <FlatList
        style={styles.list}
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <EventDeckItem
            item={item}
            delay={220 + Math.min(index, 8) * 24}
            onPress={(id) => navigation.navigate('EventDetails', { eventId: id })}
          />
        )}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <AnimatedReveal delay={40}>
              <View>
                <Text style={styles.heroTitle}>Eventos</Text>
                <Text style={styles.heroSubtitle}>{`Historial de incidentes. ${FILTER_META[statusFilter].subtitleLabel}.`}</Text>
              </View>
            </AnimatedReveal>

            <AnimatedReveal delay={70} distance={8}>
              <View style={styles.filterPanel}>
                <Text style={styles.filterTitle}>Filtrar eventos</Text>
                <View style={styles.filterRow}>
                  {FILTER_ORDER.map((filterKey) => (
                    <Pressable
                      key={filterKey}
                      onPress={() => setStatusFilter(filterKey)}
                      style={[styles.filterChip, statusFilter === filterKey && styles.filterChipActive]}
                    >
                      <Text style={[styles.filterChipText, statusFilter === filterKey && styles.filterChipTextActive]}>
                        {FILTER_META[filterKey].chipLabel}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </AnimatedReveal>

            <AnimatedReveal delay={100}>
              <View style={styles.searchBox}>
                <MaterialCommunityIcons name="magnify" size={18} color={theme.colors.textSecondary} />
                <TextInput
                  placeholder="Buscar por dispositivo, tipo o estado"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={queryText}
                  onChangeText={setQueryText}
                  style={styles.searchInput}
                />
              </View>
            </AnimatedReveal>

            <View style={styles.tilesGrid}>
              <AnimatedReveal delay={130} style={styles.featuredTileWrap}>
                <View style={styles.featuredTile}>
                  <LinearGradient
                    colors={['#8C3CFF', '#6A2CF2', '#5323C8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.featuredEyebrow}>Incidentes criticos</Text>
                  <View style={styles.ringOuter}>
                    <View style={styles.ringInner}>
                      <Text style={styles.ringValue}>{stats.critical}</Text>
                      <Text style={styles.ringLabel}>Activos</Text>
                    </View>
                  </View>
                  <Text style={styles.featuredFoot}>{`${stats.criticalRatio}% del total de eventos`}</Text>
                </View>
              </AnimatedReveal>

              <AnimatedReveal delay={160} style={styles.smallTileWrap}>
                <View style={[styles.smallTile, styles.largeSmallTile]}>
                  <Text style={styles.smallTileLabel}>Ultimo evento</Text>
                  <Text style={styles.smallTileValue}>
                    {stats.latestMinutes === null ? 'Sin datos' : `${stats.latestMinutes} min`}
                  </Text>
                  <Text style={styles.smallTileMeta}>Tiempo desde la ultima deteccion</Text>
                </View>
              </AnimatedReveal>

              <AnimatedReveal delay={190} style={styles.smallTileWrap}>
                <View style={styles.smallTile}>
                  <Text style={styles.smallTileLabel}>Confirmadas</Text>
                  <Text style={styles.smallTileValue}>{stats.confirmed}</Text>
                  <Text style={styles.smallTileMeta}>{`${stats.open} abiertas`}</Text>
                </View>
              </AnimatedReveal>

              <AnimatedReveal delay={220} style={styles.smallTileWrap}>
                <View style={styles.smallTile}>
                  <Text style={styles.smallTileLabel}>Resolucion</Text>
                  <Text style={styles.smallTileValue}>{stats.resolved}</Text>
                  <Text style={styles.smallTileMeta}>{`${stats.falseAlarms} falsas alarmas`}</Text>
                </View>
              </AnimatedReveal>
            </View>

            {query.error ? <GlassBanner message="No se pudieron cargar los eventos." /> : null}
          </View>
        }
        ListEmptyComponent={
          !query.isLoading ? <EmptyState title="Sin eventos" subtitle={emptySubtitle} /> : null
        }
        ListFooterComponent={<View style={styles.bottomSpacer} />}
        refreshControl={<RefreshControl refreshing={query.isFetching} onRefresh={query.refetch} tintColor={theme.colors.primary} />}
      />
    </GlassScreen>
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1
  },
  stickyTopBar: {
    paddingBottom: theme.spacing.md
  },
  listContent: {
    paddingBottom: theme.spacing.xxl + 86,
    gap: theme.spacing.lg
  },
  headerWrap: {
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.sm
  },
  topActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  topIconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(18,24,35,0.72)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10
  },
  topIconButtonActive: {
    borderColor: 'rgba(138,92,246,0.82)',
    backgroundColor: 'rgba(44,24,86,0.62)'
  },
  heroTitle: {
    fontFamily: theme.typography.family.bold,
    fontSize: 31,
    color: '#F3F5FF'
  },
  heroSubtitle: {
    marginTop: 4,
    fontFamily: theme.typography.family.medium,
    fontSize: theme.typography.size.md,
    color: '#AAB5D2'
  },
  filterPanel: {
    borderRadius: 18,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    backgroundColor: 'rgba(16,22,34,0.82)',
    gap: theme.spacing.sm
  },
  filterTitle: {
    fontFamily: theme.typography.family.semibold,
    fontSize: theme.typography.size.sm,
    color: '#DFE5FA'
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.02)'
  },
  filterChipActive: {
    borderColor: 'rgba(149,114,255,0.72)',
    backgroundColor: 'rgba(104,65,215,0.34)'
  },
  filterChipText: {
    fontFamily: theme.typography.family.medium,
    fontSize: theme.typography.size.xs,
    color: '#B8C3DE'
  },
  filterChipTextActive: {
    color: '#FFFFFF'
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: theme.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12
  },
  searchInput: {
    flex: 1,
    fontFamily: theme.typography.family.medium,
    color: theme.colors.textPrimary
  },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: theme.spacing.md
  },
  featuredTileWrap: {
    width: '48%'
  },
  featuredTile: {
    borderRadius: 22,
    height: FEATURED_TILE_HEIGHT,
    padding: theme.spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.44,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14
  },
  featuredEyebrow: {
    fontFamily: theme.typography.family.medium,
    fontSize: theme.typography.size.xs,
    color: 'rgba(242,237,255,0.92)'
  },
  ringOuter: {
    marginTop: 12,
    alignSelf: 'center',
    width: 114,
    height: 114,
    borderRadius: 57,
    borderWidth: 3,
    borderColor: 'rgba(248,246,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  ringInner: {
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(29,10,76,0.28)'
  },
  ringValue: {
    fontFamily: theme.typography.family.bold,
    fontSize: theme.typography.size.lg,
    color: '#FFFFFF'
  },
  ringLabel: {
    marginTop: 2,
    fontFamily: theme.typography.family.medium,
    fontSize: theme.typography.size.xs,
    color: 'rgba(243,237,255,0.9)'
  },
  featuredFoot: {
    marginTop: 14,
    textAlign: 'center',
    fontFamily: theme.typography.family.medium,
    fontSize: 11,
    lineHeight: 14,
    paddingHorizontal: 4,
    color: 'rgba(240,234,255,0.88)'
  },
  smallTileWrap: {
    width: '48%'
  },
  smallTile: {
    minHeight: 144,
    borderRadius: 20,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'rgba(16,21,31,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#02040A',
    shadowOpacity: 0.44,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 9
  },
  largeSmallTile: {
    height: FEATURED_TILE_HEIGHT,
    justifyContent: 'space-between'
  },
  smallTileLabel: {
    fontFamily: theme.typography.family.medium,
    fontSize: theme.typography.size.xs,
    color: '#A7B2CC'
  },
  smallTileValue: {
    marginTop: 8,
    fontFamily: theme.typography.family.bold,
    fontSize: 30,
    color: '#F2F5FF'
  },
  smallTileMeta: {
    marginTop: 6,
    fontFamily: theme.typography.family.medium,
    fontSize: theme.typography.size.xs,
    color: '#8F9BBC'
  },
  eventCard: {
    borderRadius: 20,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    minHeight: 174,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(15,20,31,0.84)',
    overflow: 'hidden',
    shadowColor: '#03060E',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 },
    elevation: 8,
    gap: theme.spacing.sm
  },
  eventTopGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 38,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  },
  eventHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm
  },
  eventTitle: {
    flex: 1,
    minWidth: 0,
    fontFamily: theme.typography.family.semibold,
    fontSize: theme.typography.size.md,
    lineHeight: 23,
    color: '#EEF3FF'
  },
  eventPill: {
    maxWidth: '44%'
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm
  },
  eventMetaText: {
    flex: 1,
    fontFamily: theme.typography.family.medium,
    fontSize: theme.typography.size.sm,
    color: '#A3B0CB'
  },
  bottomSpacer: {
    height: 20
  }
});
