import React from 'react';
import { Animated, Platform, Pressable, StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

export const GlassCard = ({ children, style, onPress }: Props) => {
  const scale = React.useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 22,
      bounciness: 4
    }).start();
  };

  return (
    <Animated.View style={[styles.animated, { transform: [{ scale }] }]}>
      <Pressable
        style={[styles.card, style]}
        disabled={!onPress}
        onPress={onPress}
        onPressIn={() => animateTo(0.985)}
        onPressOut={() => animateTo(1)}
      >
        {Platform.OS === 'ios' ? (
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.fallback]} />
        )}
        <LinearGradient colors={theme.gradients.glassSheen} style={styles.sheen} />
        <View style={styles.content}>{children}</View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  animated: {
    shadowColor: '#000',
    shadowOpacity: 0.34,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8
  },
  card: {
    borderRadius: theme.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.glass,
    overflow: 'hidden'
  },
  sheen: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.44
  },
  fallback: {
    backgroundColor: theme.colors.glassStrong
  },
  content: {
    padding: theme.spacing.xl
  }
});
