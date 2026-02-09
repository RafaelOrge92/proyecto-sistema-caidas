import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'danger' | 'ghost';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

export const PrimaryButton = ({ title, onPress, variant = 'primary', style, disabled = false }: Props) => {
  const variantStyle = stylesByVariant[variant];
  const textStyle = variantText[variant];
  const gradientColors = gradientByVariant[variant];
  const isGradient = Boolean(gradientColors);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {isGradient ? (
        <LinearGradient colors={gradientColors!} style={styles.gradientFill}>
          <Text style={[styles.text, textStyle]}>{title}</Text>
        </LinearGradient>
      ) : (
        <Text style={[styles.text, textStyle]}>{title}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: theme.radii.pill,
    overflow: 'hidden',
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  gradientFill: {
    alignSelf: 'stretch',
    minHeight: 48,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg
  },
  text: {
    fontFamily: theme.typography.family.semibold,
    fontSize: theme.typography.size.sm,
    letterSpacing: 0.35
  },
  disabled: {
    opacity: 0.6
  },
  pressed: {
    transform: [{ scale: 0.985 }]
  }
});

const stylesByVariant = {
  primary: {
    backgroundColor: theme.colors.bgElevated,
    borderColor: 'rgba(255,255,255,0.18)'
  },
  danger: {
    backgroundColor: theme.colors.bgElevated,
    borderColor: 'rgba(255,255,255,0.14)'
  },
  ghost: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg
  }
} as const;

const gradientByVariant = {
  primary: theme.gradients.primaryButton,
  danger: theme.gradients.dangerButton,
  ghost: null
} as const;

const variantText = {
  primary: {
    color: '#FFFFFF'
  },
  danger: {
    color: '#FFFFFF'
  },
  ghost: {
    color: theme.colors.textPrimary
  }
} as const;
