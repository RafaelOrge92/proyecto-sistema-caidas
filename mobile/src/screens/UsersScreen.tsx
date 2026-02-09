import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { deactivateUser, getUsers } from '../api/endpoints';
import { AppUser, UserRole } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { AnimatedReveal } from '../components/AnimatedReveal';
import { EmptyState } from '../components/EmptyState';
import { GlassBanner } from '../components/GlassBanner';
import { GlassScreen } from '../components/GlassScreen';
import { RootStackParamList } from '../navigation/types';
import { theme } from '../theme';

const FEATURED_TILE_HEIGHT = 218;

const USER_FILTER = {
  ALL: 'ALL',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER'
} as const;

type UserFilter = (typeof USER_FILTER)[keyof typeof USER_FILTER];

const FILTER_ORDER: readonly UserFilter[] = [
  USER_FILTER.ALL,
  USER_FILTER.ADMIN,
  USER_FILTER.MEMBER
];

const FILTER_META: Record<
  UserFilter,
  {
    chipLabel: string;
    subtitleLabel: string;
    emptySubtitle: string;
    match: (user: AppUser) => boolean;
  }
> = {
  [USER_FILTER.ALL]: {
    chipLabel: 'Todos',
    subtitleLabel: 'Mostrando todos',
    emptySubtitle: 'No hay usuarios disponibles.',
    match: () => true
  },
  [USER_FILTER.ADMIN]: {
    chipLabel: 'Admins',
    subtitleLabel: 'Mostrando administradores',
    emptySubtitle: 'No hay administradores con este filtro.',
    match: (user) => user.role === USER_FILTER.ADMIN
  },
  [USER_FILTER.MEMBER]: {
    chipLabel: 'Miembros',
    subtitleLabel: 'Mostrando miembros',
    emptySubtitle: 'No hay miembros con este filtro.',
    match: (user) => user.role === USER_FILTER.MEMBER
  }
};

const roleLabel: Record<UserRole, string> = {
  ADMIN: 'ADMIN',
  MEMBER: 'MIEMBRO'
};

const getTopGlowColors = (role: UserRole): readonly [string, string, string] => {
  if (role === 'ADMIN') {
    return ['rgba(140,92,255,0.24)', 'rgba(140,92,255,0.08)', 'rgba(140,92,255,0)'];
  }
  return ['rgba(6,182,212,0.24)', 'rgba(6,182,212,0.08)', 'rgba(6,182,212,0)'];
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

const UserDeckItem = React.memo(
  ({
    item,
    delay,
    onDeactivate,
    isBusy,
    isSelf
  }: {
    item: AppUser;
    delay?: number;
    onDeactivate: (id: string) => void;
    isBusy: boolean;
    isSelf: boolean;
  }) => {
    return (
      <AnimatedReveal delay={delay}>
        <View style={styles.userCard}>
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.015)', 'rgba(255,255,255,0.02)']}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            pointerEvents="none"
            colors={getTopGlowColors(item.role)}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.userTopGlow}
          />

          <View style={styles.userHeaderRow}>
            <View style={styles.identityWrap}>
              <Text style={styles.userName} numberOfLines={2}>
                {item.fullName || 'Sin nombre'}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {item.email || 'Sin correo'}
              </Text>
            </View>
            <View style={[styles.rolePill, item.role === 'ADMIN' ? styles.rolePillAdmin : styles.rolePillMember]}>
              <Text style={styles.rolePillText}>{roleLabel[item.role]}</Text>
            </View>
          </View>

          <View style={styles.userMetaRow}>
            <MaterialCommunityIcons name="phone-outline" size={16} color="#9FAED0" />
            <Text style={styles.userMetaText} numberOfLines={1}>
              {item.phone || 'Sin telefono'}
            </Text>
          </View>

          <View style={styles.userMetaRow}>
            <MaterialCommunityIcons name="identifier" size={16} color="#9FAED0" />
            <Text style={styles.userMetaText} numberOfLines={1}>
              {`ID: ${item.id}`}
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => onDeactivate(item.id)}
              disabled={isBusy || isSelf}
              style={({ pressed }) => [
                styles.deactivateButton,
                (isBusy || isSelf) && styles.deactivateButtonDisabled,
                pressed && !(isBusy || isSelf) && styles.deactivateButtonPressed
              ]}
            >
              <MaterialCommunityIcons name="account-off-outline" size={16} color="#FFD3D3" />
              <Text style={styles.deactivateButtonText}>{isSelf ? 'Cuenta actual' : 'Desactivar'}</Text>
            </Pressable>
          </View>
        </View>
      </AnimatedReveal>
    );
  }
);

export const UsersScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [roleFilter, setRoleFilter] = useState<UserFilter>(USER_FILTER.ALL);
  const [queryText, setQueryText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['users'],
    queryFn: ({ signal }) => getUsers(signal)
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateUser(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setFeedback(result.note || 'Usuario desactivado correctamente.');
    },
    onError: () => {
      setFeedback('No se pudo desactivar el usuario.');
    }
  });

  const users = useMemo(() => query.data ?? [], [query.data]);
  const normalizedQuery = queryText.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    return users.filter((entry) => {
      if (!FILTER_META[roleFilter].match(entry)) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      const phoneText = (entry.phone || '').toLowerCase();
      return (
        entry.fullName.toLowerCase().includes(normalizedQuery) ||
        entry.email.toLowerCase().includes(normalizedQuery) ||
        phoneText.includes(normalizedQuery)
      );
    });
  }, [users, roleFilter, normalizedQuery]);

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((entry) => entry.role === 'ADMIN').length;
    const members = users.filter((entry) => entry.role === 'MEMBER').length;
    const withPhone = users.filter((entry) => Boolean(entry.phone)).length;
    const coverage = total > 0 ? Math.round((withPhone / total) * 100) : 0;
    return {
      total,
      admins,
      members,
      withPhone,
      coverage
    };
  }, [users]);

  const hasRefinements = roleFilter !== USER_FILTER.ALL || normalizedQuery.length > 0;

  const handleResetRefinements = () => {
    setRoleFilter(USER_FILTER.ALL);
    setQueryText('');
    setFeedback(null);
  };

  if (user?.role !== 'ADMIN') {
    return (
      <GlassScreen scroll={false} padding={false}>
        <View style={styles.centerContent}>
          <EmptyState
            title="Solo administradores"
            subtitle="Tu cuenta no tiene permisos para gestionar usuarios."
          />
        </View>
      </GlassScreen>
    );
  }

  const emptySubtitle = normalizedQuery
    ? 'No hay coincidencias para esa busqueda.'
    : FILTER_META[roleFilter].emptySubtitle;

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
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <UserDeckItem
            item={item}
            delay={220 + Math.min(index, 8) * 24}
            onDeactivate={(id) => {
              setFeedback(null);
              deactivateMutation.mutate(id);
            }}
            isBusy={deactivateMutation.isPending && deactivateMutation.variables === item.id}
            isSelf={item.id === user.id}
          />
        )}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <AnimatedReveal delay={40}>
              <View>
                <Text style={styles.heroTitle}>Usuarios</Text>
                <Text style={styles.heroSubtitle}>{`Gestion de cuentas del sistema. ${FILTER_META[roleFilter].subtitleLabel}.`}</Text>
              </View>
            </AnimatedReveal>

            <AnimatedReveal delay={70} distance={8}>
              <View style={styles.filterPanel}>
                <Text style={styles.filterTitle}>Filtrar usuarios</Text>
                <View style={styles.filterRow}>
                  {FILTER_ORDER.map((filterKey) => (
                    <Pressable
                      key={filterKey}
                      onPress={() => setRoleFilter(filterKey)}
                      style={[styles.filterChip, roleFilter === filterKey && styles.filterChipActive]}
                    >
                      <Text style={[styles.filterChipText, roleFilter === filterKey && styles.filterChipTextActive]}>
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
                  placeholder="Buscar por nombre, correo o telefono"
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
                  <Text style={styles.featuredEyebrow}>Usuarios totales</Text>
                  <View style={styles.ringOuter}>
                    <View style={styles.ringInner}>
                      <Text style={styles.ringValue}>{stats.total}</Text>
                      <Text style={styles.ringLabel}>Cuentas</Text>
                    </View>
                  </View>
                  <Text style={styles.featuredFoot}>{`${stats.coverage}% con telefono`}</Text>
                </View>
              </AnimatedReveal>

              <AnimatedReveal delay={160} style={styles.smallTileWrap}>
                <View style={[styles.smallTile, styles.largeSmallTile]}>
                  <Text style={styles.smallTileLabel}>Administradores</Text>
                  <Text style={styles.smallTileValue}>{stats.admins}</Text>
                  <Text style={styles.smallTileMeta}>Control y gestion global</Text>
                </View>
              </AnimatedReveal>

              <AnimatedReveal delay={190} style={styles.smallTileWrap}>
                <View style={styles.smallTile}>
                  <Text style={styles.smallTileLabel}>Miembros</Text>
                  <Text style={styles.smallTileValue}>{stats.members}</Text>
                  <Text style={styles.smallTileMeta}>Acceso operativo</Text>
                </View>
              </AnimatedReveal>

              <AnimatedReveal delay={220} style={styles.smallTileWrap}>
                <View style={styles.smallTile}>
                  <Text style={styles.smallTileLabel}>Con telefono</Text>
                  <Text style={styles.smallTileValue}>{stats.withPhone}</Text>
                  <Text style={styles.smallTileMeta}>Contacto registrado</Text>
                </View>
              </AnimatedReveal>
            </View>

            {feedback ? <GlassBanner message={feedback} /> : null}
            {query.error ? <GlassBanner message="No se pudieron cargar los usuarios." /> : null}
          </View>
        }
        ListEmptyComponent={
          !query.isLoading ? <EmptyState title="Sin usuarios" subtitle={emptySubtitle} /> : null
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
  centerContent: {
    flex: 1,
    justifyContent: 'center'
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
  userCard: {
    borderRadius: 20,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    minHeight: 184,
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
  userTopGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 38,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  },
  userHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm
  },
  identityWrap: {
    flex: 1,
    minWidth: 0
  },
  userName: {
    fontFamily: theme.typography.family.semibold,
    fontSize: theme.typography.size.md,
    lineHeight: 23,
    color: '#EEF3FF'
  },
  userEmail: {
    marginTop: 4,
    fontFamily: theme.typography.family.medium,
    fontSize: theme.typography.size.sm,
    color: '#A3B0CB'
  },
  rolePill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1
  },
  rolePillAdmin: {
    backgroundColor: 'rgba(96,57,205,0.4)',
    borderColor: 'rgba(191,166,255,0.65)'
  },
  rolePillMember: {
    backgroundColor: 'rgba(6,125,145,0.28)',
    borderColor: 'rgba(111,222,245,0.45)'
  },
  rolePillText: {
    fontFamily: theme.typography.family.semibold,
    fontSize: 11,
    color: '#EDF1FF'
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm
  },
  userMetaText: {
    flex: 1,
    fontFamily: theme.typography.family.medium,
    fontSize: theme.typography.size.sm,
    color: '#A3B0CB'
  },
  actionsRow: {
    marginTop: theme.spacing.xs,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  deactivateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(127,29,29,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.5)'
  },
  deactivateButtonPressed: {
    opacity: 0.84
  },
  deactivateButtonDisabled: {
    opacity: 0.48
  },
  deactivateButtonText: {
    fontFamily: theme.typography.family.medium,
    fontSize: 12,
    color: '#FFD3D3'
  },
  bottomSpacer: {
    height: 20
  }
});
