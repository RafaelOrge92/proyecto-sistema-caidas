import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { getDevices } from '../api/endpoints';
import { Device } from '../api/types';
import { GlassScreen } from '../components/GlassScreen';
import { GlassBanner } from '../components/GlassBanner';
import { EmptyState } from '../components/EmptyState';
import { AnimatedReveal } from '../components/AnimatedReveal';
import { StatusPill } from '../components/StatusPill';
import { RootStackParamList } from '../navigation/types';
import { theme } from '../theme';

const DASHBOARD_TILE_HEIGHT = 218;
const DEVICE_FILTER = {
  ALL: 'ALL',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
} as const;

type DeviceFilter = (typeof DEVICE_FILTER)[keyof typeof DEVICE_FILTER];

const FILTER_ORDER: readonly DeviceFilter[] = [
  DEVICE_FILTER.ALL,
  DEVICE_FILTER.ACTIVE,
  DEVICE_FILTER.INACTIVE
];

const FILTER_META: Record<
  DeviceFilter,
  {
    chipLabel: string;
    subtitleLabel: string;
    emptySubtitle: string;
    match: (device: Device) => boolean;
  }
> = {
  [DEVICE_FILTER.ALL]: {
    chipLabel: 'Todos',
    subtitleLabel: 'Mostrando todos',
    emptySubtitle: 'Comprueba la conexion con el backend.',
    match: () => true
  },
  [DEVICE_FILTER.ACTIVE]: {
    chipLabel: 'Activos',
    subtitleLabel: 'Mostrando activos',
    emptySubtitle: 'No hay dispositivos activos con este filtro.',
    match: (device) => Boolean(device.isActive)
  },
  [DEVICE_FILTER.INACTIVE]: {
    chipLabel: 'Inactivos',
    subtitleLabel: 'Mostrando inactivos',
    emptySubtitle: 'No hay dispositivos inactivos con este filtro.',
    match: (device) => !device.isActive
  }
};

const minutesSince = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const ms = Date.now() - date.getTime();
  return Math.max(0, Math.round(ms / 60000));
};

const getPatientDisplayName = (device: Device) => {
  const computedName = [device.patientFirstName, device.patientLastName].filter(Boolean).join(' ').trim();
  return device.patientFullName || computedName || device.patientId || 'Sin asignar';
};

const getSignalIcon = (level: number): React.ComponentProps<typeof MaterialCommunityIcons>['name'] => {
  if (level >= 7) return 'wifi-strength-4';
  if (level >= 5) return 'wifi-strength-3';
  if (level >= 3) return 'wifi-strength-2';
  return 'wifi-strength-1';
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

const DeviceDeckItem = React.memo(
  ({
    item,
    onPress,
    delay
  }: {
    item: Device;
    onPress: (id: string) => void;
    delay?: number;
  }) => {
  const seen = minutesSince(item.lastSeenAt);
  const topGlowColors: readonly [string, string, string] = item.isActive
    ? ['rgba(16,185,129,0.2)', 'rgba(16,185,129,0.08)', 'rgba(16,185,129,0)']
    : ['rgba(239,68,68,0.18)', 'rgba(239,68,68,0.07)', 'rgba(239,68,68,0)'];

  return (
    <AnimatedReveal delay={delay}>
      <Pressable onPress={() => onPress(item.id)} style={styles.deviceCard}>
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.015)', 'rgba(255,255,255,0.02)']}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          pointerEvents="none"
          colors={topGlowColors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.deviceTopGlow}
        />
        <View style={styles.deviceHeaderRow}>
          <Text style={styles.deviceAlias} numberOfLines={2}>
            {item.alias || 'Sin nombre'}
          </Text>
          <StatusPill label={item.isActive ? 'ACTIVO' : 'INACTIVO'} tone={item.isActive ? 'success' : 'muted'} />
        </View>
        <Text style={styles.deviceMeta} numberOfLines={1}>
          {`Paciente: ${getPatientDisplayName(item)}`}
        </Text>
        <Text style={styles.deviceMeta} numberOfLines={1}>
          {seen === null ? 'Sin ultimo latido' : `Ultimo latido: hace ${seen} min`}
        </Text>
      </Pressable>
    </AnimatedReveal>
  );
  }
);

export const DevicesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [filter, setFilter] = useState<DeviceFilter>(DEVICE_FILTER.ALL);
  const query = useQuery({
    queryKey: ['devices'],
    queryFn: ({ signal }) => getDevices(signal)
  });

  const devices = useMemo(() => query.data ?? [], [query.data]);
  const filteredDevices = useMemo(
    () => devices.filter(FILTER_META[filter].match),
    [devices, filter]
  );
  const hasFilterRefinements = filter !== DEVICE_FILTER.ALL;
  const handleResetFilter = () => setFilter(DEVICE_FILTER.ALL);

  const stats = useMemo(() => {
    const total = devices.length;
    const active = devices.filter((device) => device.isActive).length;
    const inactive = Math.max(total - active, 0);
    const assigned = devices.filter((device) => Boolean(device.patientId)).length;

    const latest = devices
      .filter((device) => device.lastSeenAt)
      .sort((a, b) => (new Date(b.lastSeenAt as string).getTime() - new Date(a.lastSeenAt as string).getTime()))[0];

    const latestMinutes = latest ? minutesSince(latest.lastSeenAt) : null;
    const availability = total > 0 ? Math.round((active / total) * 100) : 0;
    const signalLevel = Math.max(1, Math.min(8, Math.round((availability / 100) * 8)));

    return {
      total,
      active,
      inactive,
      assigned,
      latestMinutes,
      availability,
      signalLevel
    };
  }, [devices]);

  return (
    <GlassScreen scroll={false} padding={false}>
      <View style={styles.stickyTopBar}>
        <AnimatedReveal>
          <View style={styles.topActionsRow}>
            <TopIconButton
              icon={hasFilterRefinements ? 'filter-remove-outline' : 'filter-variant'}
              active={hasFilterRefinements}
              onPress={handleResetFilter}
            />
            <TopIconButton icon="cog-outline" onPress={() => navigation.navigate('Settings')} />
          </View>
        </AnimatedReveal>
      </View>

      <FlatList
        style={styles.list}
        data={filteredDevices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <DeviceDeckItem
            item={item}
            delay={200 + Math.min(index, 8) * 28}
            onPress={(id) => navigation.navigate('DeviceDetails', { deviceId: id })}
          />
        )}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <AnimatedReveal delay={40}>
              <View>
                <Text style={styles.heroTitle}>Dispositivos</Text>
                <Text style={styles.heroSubtitle}>{`Panel de monitorizacion en tiempo real. ${FILTER_META[filter].subtitleLabel}.`}</Text>
              </View>
            </AnimatedReveal>

            <AnimatedReveal delay={60} distance={8}>
              <View style={styles.filterPanel}>
                <Text style={styles.filterTitle}>Filtrar dispositivos</Text>
                <View style={styles.filterRow}>
                  {FILTER_ORDER.map((filterKey) => (
                    <Pressable
                      key={filterKey}
                      onPress={() => setFilter(filterKey)}
                      style={[styles.filterChip, filter === filterKey && styles.filterChipActive]}
                    >
                      <Text style={[styles.filterChipText, filter === filterKey && styles.filterChipTextActive]}>
                        {FILTER_META[filterKey].chipLabel}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </AnimatedReveal>

            <View style={styles.tilesGrid}>
              <AnimatedReveal delay={80} style={styles.featuredTileWrap}>
                <Pressable style={styles.featuredTile}>
                  <LinearGradient
                    colors={['#8C3CFF', '#6A2CF2', '#5323C8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.featuredEyebrow}>Dispositivos activos</Text>
                  <View style={styles.ringOuter}>
                    <View style={styles.ringInner}>
                      <Text style={styles.ringValue}>{`${stats.active}/${stats.total}`}</Text>
                      <Text style={styles.ringLabel}>Activos</Text>
                    </View>
                  </View>
                  <Text
                    style={styles.featuredFoot}
                    numberOfLines={2}
                    minimumFontScale={0.9}
                    adjustsFontSizeToFit
                  >
                    {`${stats.availability}% de disponibilidad`}
                  </Text>
                </Pressable>
              </AnimatedReveal>

              <AnimatedReveal delay={120} style={styles.smallTileWrap}>
                <View style={[styles.smallTile, styles.largeSmallTile]}>
                  <Text style={styles.smallTileLabel}>Ultimo latido</Text>
                  <Text style={styles.smallTileValue}>
                    {stats.latestMinutes === null ? 'Sin datos' : `${stats.latestMinutes} min`}
                  </Text>
                  <Text style={styles.smallTileMeta}>Actualizacion reciente</Text>
                </View>
              </AnimatedReveal>

              <AnimatedReveal delay={160} style={styles.smallTileWrap}>
                <View style={styles.smallTile}>
                  <Text style={styles.smallTileLabel}>Senal de red</Text>
                  <MaterialCommunityIcons
                    name={getSignalIcon(stats.signalLevel)}
                    size={34}
                    color="#F7B928"
                    style={styles.signalIcon}
                  />
                  <Text style={styles.smallTileMeta}>{`${stats.availability}% estable`}</Text>
                </View>
              </AnimatedReveal>

              <AnimatedReveal delay={200} style={styles.smallTileWrap}>
                <View style={styles.smallTile}>
                  <Text style={styles.smallTileLabel}>Pacientes</Text>
                  <Text style={styles.smallTileValue}>{stats.assigned}</Text>
                  <Text style={styles.smallTileMeta}>{`${stats.inactive} sin conexion`}</Text>
                </View>
              </AnimatedReveal>
            </View>

            {query.error ? <GlassBanner message="No se pudieron cargar los dispositivos." /> : null}
          </View>
        }
        ListEmptyComponent={
          !query.isLoading ? (
            <EmptyState
              title="Sin dispositivos"
              subtitle={FILTER_META[filter].emptySubtitle}
            />
          ) : null
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
    height: DASHBOARD_TILE_HEIGHT,
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
    fontSize: 10,
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
    height: DASHBOARD_TILE_HEIGHT,
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
  signalIcon: {
    marginTop: 12
  },
  deviceCard: {
    borderRadius: 20,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    minHeight: 152,
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
  deviceTopGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 38,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  },
  deviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm
  },
  deviceAlias: {
    flex: 1,
    minWidth: 0,
    fontFamily: theme.typography.family.semibold,
    fontSize: theme.typography.size.md,
    lineHeight: 23,
    color: '#EEF3FF'
  },
  deviceMeta: {
    fontFamily: theme.typography.family.medium,
    fontSize: theme.typography.size.sm,
    color: '#A3B0CB'
  },
  bottomSpacer: {
    height: 20
  }
});
