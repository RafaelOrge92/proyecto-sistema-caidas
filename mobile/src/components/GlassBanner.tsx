import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';

type Props = {
  message: string;
};

export const GlassBanner = ({ message }: Props) => {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="alert-circle-outline" size={18} color={theme.colors.error} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: 'rgba(239,68,68,0.14)',
    borderColor: 'rgba(239,68,68,0.3)',
    borderWidth: 1,
    borderRadius: theme.radii.card,
    padding: theme.spacing.md
  },
  text: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.family.medium,
    fontSize: theme.typography.size.sm
  }
});
