import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

type Props = {
  label: string;
  value?: string | null;
};

export const InfoRow = ({ label, value }: Props) => {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || 'Sin datos'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    gap: theme.spacing.xs
  },
  label: {
    fontFamily: theme.typography.family.semibold,
    fontSize: theme.typography.size.xs,
    letterSpacing: 0.85,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase'
  },
  value: {
    fontFamily: theme.typography.family.medium,
    fontSize: theme.typography.size.md,
    color: theme.colors.textPrimary
  }
});
