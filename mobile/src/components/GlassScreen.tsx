import React, { useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, StyleProp, ViewStyle, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { FloatingBubbles } from './FloatingBubbles';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  padding?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
};

export const GlassScreen = ({ children, scroll = false, padding = true, contentContainerStyle, style }: Props) => {
  const orbA = useRef(new Animated.Value(0)).current;
  const orbB = useRef(new Animated.Value(0)).current;
  const orbC = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loopA = Animated.loop(
      Animated.sequence([
        Animated.timing(orbA, { toValue: 1, duration: 8000, useNativeDriver: true }),
        Animated.timing(orbA, { toValue: 0, duration: 8000, useNativeDriver: true })
      ])
    );
    const loopB = Animated.loop(
      Animated.sequence([
        Animated.timing(orbB, { toValue: 1, duration: 10000, useNativeDriver: true }),
        Animated.timing(orbB, { toValue: 0, duration: 10000, useNativeDriver: true })
      ])
    );
    const loopC = Animated.loop(
      Animated.sequence([
        Animated.timing(orbC, { toValue: 1, duration: 12000, useNativeDriver: true }),
        Animated.timing(orbC, { toValue: 0, duration: 12000, useNativeDriver: true })
      ])
    );

    loopA.start();
    loopB.start();
    loopC.start();

    return () => {
      loopA.stop();
      loopB.stop();
      loopC.stop();
    };
  }, [orbA, orbB, orbC]);

  const contentStyles = [
    styles.content,
    scroll ? styles.scrollGrow : styles.fill,
    !padding && styles.noPadding,
    contentContainerStyle
  ];

  return (
    <LinearGradient colors={theme.gradients.dark} style={styles.root}>
      <Animated.View
        style={[
          styles.glowA,
          {
            transform: [
              {
                translateY: orbA.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-8, 14]
                })
              },
              {
                translateX: orbA.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 12]
                })
              }
            ],
            opacity: orbA.interpolate({
              inputRange: [0, 1],
              outputRange: [0.06, 0.16]
            })
          }
        ]}
      />
      <Animated.View
        style={[
          styles.glowB,
          {
            transform: [
              {
                translateY: orbB.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, -14]
                })
              },
              {
                translateX: orbB.interpolate({
                  inputRange: [0, 1],
                  outputRange: [14, -6]
                })
              }
            ],
            opacity: orbB.interpolate({
              inputRange: [0, 1],
              outputRange: [0.05, 0.14]
            })
          }
        ]}
      />
      <Animated.View
        style={[
          styles.glowC,
          {
            transform: [
              {
                scale: orbC.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.92, 1.08]
                })
              },
              {
                translateY: orbC.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, -12]
                })
              }
            ],
            opacity: orbC.interpolate({
              inputRange: [0, 1],
              outputRange: [0.04, 0.1]
            })
          }
        ]}
      />
      <FloatingBubbles />
      <SafeAreaView style={[styles.safe, style]} edges={['top', 'left', 'right']}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={contentStyles}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={contentStyles}>{children}</View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary
  },
  safe: {
    flex: 1
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.xl
  },
  fill: {
    flex: 1
  },
  scrollGrow: {
    flexGrow: 1
  },
  noPadding: {
    paddingHorizontal: 0,
    paddingBottom: 0
  },
  glowA: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: theme.colors.primary,
    top: -40,
    left: -40
  },
  glowB: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: theme.colors.accent,
    bottom: -80,
    right: -80
  },
  glowC: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: theme.colors.accentCyan,
    top: '36%',
    right: -90
  }
});
