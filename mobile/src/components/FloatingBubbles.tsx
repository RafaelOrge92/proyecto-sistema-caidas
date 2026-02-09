import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

type Bubble = {
  size: number;
  leftPct: number;
  topPct: number;
  color: string;
  duration: number;
  delay: number;
  drift: number;
  rise: number;
};

const BUBBLES: Bubble[] = [
  {
    size: 120,
    leftPct: 8,
    topPct: 16,
    color: 'rgba(129,140,248,0.14)',
    duration: 9800,
    delay: 200,
    drift: 12,
    rise: 20
  },
  {
    size: 86,
    leftPct: 78,
    topPct: 24,
    color: 'rgba(139,92,246,0.12)',
    duration: 11200,
    delay: 650,
    drift: -10,
    rise: 24
  },
  {
    size: 68,
    leftPct: 18,
    topPct: 64,
    color: 'rgba(6,182,212,0.11)',
    duration: 9200,
    delay: 350,
    drift: 9,
    rise: 18
  },
  {
    size: 104,
    leftPct: 70,
    topPct: 72,
    color: 'rgba(255,255,255,0.08)',
    duration: 12600,
    delay: 900,
    drift: -8,
    rise: 22
  }
];

export const FloatingBubbles = () => {
  const progress = useRef(BUBBLES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const loops = progress.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: BUBBLES[index].duration,
            delay: BUBBLES[index].delay,
            useNativeDriver: true
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: BUBBLES[index].duration,
            useNativeDriver: true
          })
        ])
      )
    );

    loops.forEach((loop) => loop.start());

    return () => {
      loops.forEach((loop) => loop.stop());
    };
  }, [progress]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {BUBBLES.map((bubble, index) => {
        const anim = progress[index];
        return (
          <Animated.View
            key={`${bubble.leftPct}-${bubble.topPct}-${bubble.size}`}
            style={[
              styles.bubble,
              {
                width: bubble.size,
                height: bubble.size,
                borderRadius: bubble.size / 2,
                backgroundColor: bubble.color,
                left: `${bubble.leftPct}%` as `${number}%`,
                top: `${bubble.topPct}%` as `${number}%`,
                opacity: anim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.2, 0.48, 0.2]
                }),
                transform: [
                  {
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [bubble.rise, -bubble.rise]
                    })
                  },
                  {
                    translateX: anim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [-bubble.drift, bubble.drift, -bubble.drift]
                    })
                  },
                  {
                    scale: anim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.94, 1.06, 0.94]
                    })
                  }
                ]
              }
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute'
  }
});
