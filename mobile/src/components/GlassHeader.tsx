import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
};

export const GlassHeader = ({ title, subtitle, right, onBack }: Props) => {
  const hasTopControls = Boolean(onBack || right);

  return (
    <View style={styles.wrapper}>
      {hasTopControls ? (
        <View style={styles.controlsRow}>
          {onBack ? (
            <Pressable style={styles.backButton} onPress={onBack}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={theme.colors.textPrimary} />
            </Pressable>
          ) : (
            <View style={styles.sideSlot} />
          )}
          {right ? <View style={styles.right}>{right}</View> : <View style={styles.sideSlot} />}
        </View>
      ) : null}
      <View style={[styles.textBlock, hasTopControls && styles.textBlockWithControls]}>
        <Text style={[styles.title, onBack && styles.titleWithBack]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 42
  },
  sideSlot: {
    width: 42,
    height: 42
  },
  textBlock: {
    minHeight: 56
  },
  textBlockWithControls: {
    marginTop: theme.spacing.sm
  },
  right: {
    alignItems: 'flex-end'
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.glassStrong,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.26,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5
  },
  title: {
    fontFamily: theme.typography.family.semibold,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
    color: theme.colors.textPrimary
  },
  titleWithBack: {
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl
  },
  subtitle: {
    marginTop: 4,
    fontFamily: theme.typography.family.medium,
    fontSize: theme.typography.size.sm,
    letterSpacing: 0.2,
    color: theme.colors.textSecondary
  }
});
