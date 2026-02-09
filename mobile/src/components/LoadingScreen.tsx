import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GlassScreen } from './GlassScreen';
import { theme } from '../theme';

export const LoadingScreen = () => {
  return (
    <GlassScreen scroll={false}>
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.text}>Inicializando panel clinico...</Text>
      </View>
    </GlassScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    gap: theme.spacing.md
  },
  text: {
    fontFamily: theme.typography.family.medium,
    color: theme.colors.textSecondary
  }
});
