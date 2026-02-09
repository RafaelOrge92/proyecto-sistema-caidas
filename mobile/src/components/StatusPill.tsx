import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { theme } from '../theme';

type Tone = 'success' | 'warning' | 'error' | 'muted' | 'info';

type Props = {
  status?: string | null;
  label?: string;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
};

const mapStatus = (status?: string | null) => {
  switch (status) {
    case 'OPEN':
      return { label: 'Abierta', color: theme.colors.error, background: 'rgba(239,68,68,0.18)' };
    case 'CONFIRMED_FALL':
      return { label: 'Confirmada', color: theme.colors.warning, background: 'rgba(249,115,22,0.18)' };
    case 'FALSE_ALARM':
      return { label: 'Falsa alarma', color: theme.colors.muted, background: 'rgba(100,116,139,0.18)' };
    case 'RESOLVED':
      return { label: 'Resuelta', color: theme.colors.success, background: 'rgba(16,185,129,0.18)' };
    default:
      return { label: status || 'Sin datos', color: theme.colors.textSecondary, background: 'rgba(148,163,184,0.18)' };
  }
};

const toneMap: Record<Tone, { color: string; background: string }> = {
  success: { color: theme.colors.success, background: 'rgba(16,185,129,0.18)' },
  warning: { color: theme.colors.warning, background: 'rgba(249,115,22,0.18)' },
  error: { color: theme.colors.error, background: 'rgba(239,68,68,0.18)' },
  muted: { color: theme.colors.muted, background: 'rgba(100,116,139,0.18)' },
  info: { color: theme.colors.textSecondary, background: 'rgba(148,163,184,0.18)' }
};

export const StatusPill = ({ status, label, tone = 'info', style }: Props) => {
  const config = label ? { label, ...toneMap[tone] } : mapStatus(status);

  return (
    <View style={[styles.pill, { borderColor: config.color, backgroundColor: config.background }, style]}>
      <Text style={[styles.text, { color: config.color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.86}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 5,
    borderWidth: 1,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    minHeight: 28
  },
  text: {
    fontFamily: theme.typography.family.semibold,
    fontSize: theme.typography.size.xs,
    letterSpacing: 0.2,
    flexShrink: 1
  }
});
