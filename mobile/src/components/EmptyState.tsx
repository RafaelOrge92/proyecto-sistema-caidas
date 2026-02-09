import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard } from './GlassCard';
import { theme } from '../theme';

type Props = {
  title: string;
  subtitle?: string;
  icon?: string;
};

export const EmptyState = ({ title, subtitle, icon = 'database-off-outline' }: Props) => {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={icon as any} size={24} color={theme.colors.textSecondary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center'
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md
  },
  title: {
    fontFamily: theme.typography.family.semibold,
    fontSize: theme.typography.size.lg,
    color: theme.colors.textPrimary
  },
  subtitle: {
    marginTop: theme.spacing.sm,
    fontFamily: theme.typography.family.medium,
    fontSize: theme.typography.size.md,
    color: theme.colors.textSecondary,
    textAlign: 'center'
  }
});
