import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

type Props = {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
};

export const AnimatedReveal = ({
  children,
  delay = 0,
  duration = 420,
  distance = 14,
  style
}: Props) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;
  const scale = useRef(new Animated.Value(0.985)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        damping: 16,
        stiffness: 170,
        mass: 0.75,
        useNativeDriver: true
      }),
      Animated.spring(scale, {
        toValue: 1,
        delay,
        damping: 18,
        stiffness: 180,
        mass: 0.8,
        useNativeDriver: true
      })
    ]);
    animation.start();
    return () => animation.stop();
  }, [delay, duration, opacity, scale, translateY]);

  return (
    <Animated.View
      style={[
        {
          opacity,
          transform: [{ translateY }, { scale }]
        },
        style
      ]}
    >
      {children}
    </Animated.View>
  );
};
