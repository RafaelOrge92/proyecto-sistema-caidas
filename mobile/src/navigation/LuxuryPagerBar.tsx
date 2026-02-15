import React from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';

const BAR_PADDING = 10;
const BAR_HEIGHT = 78;
const SURFACE_RADIUS = 34;
const SIDE_TAB_SIZE = 54;
const SIDE_ICON_SIZE = 27;
const CENTER_TAB_SIZE = 64;
const CENTER_ELEVATION = 20;
const SIDE_ROW_BOTTOM = (BAR_HEIGHT - SIDE_TAB_SIZE) / 2;
const COMPACT_TAB_HEIGHT = 54;
const COMPACT_TAB_WIDTH = 76;
const COMPACT_ICON_SIZE = 27;
const COMPACT_ROW_BOTTOM = (BAR_HEIGHT - COMPACT_TAB_HEIGHT) / 2;
const SURFACE_COLOR = 'rgba(30,34,48,0.84)';

export type PagerTabItem = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

type Props = {
  items: PagerTabItem[];
  activeIndex: number;
  progress: Animated.AnimatedInterpolation<number>;
  onPress: (index: number) => void;
};

export const LuxuryPagerBar = ({ items, activeIndex, progress, onPress }: Props) => {
  const insets = useSafeAreaInsets();
  const safeActiveIndex = Math.max(0, Math.min(items.length - 1, activeIndex));
  const middleIndex = Math.floor(items.length / 2);
  const centerItem = items[middleIndex];
  const glowValuesRef = React.useRef<Animated.Value[]>([]);

  void progress;

  if (items.length === 0) {
    return null;
  }

  if (glowValuesRef.current.length !== items.length) {
    glowValuesRef.current = items.map((_, index) =>
      new Animated.Value(index === safeActiveIndex ? 1 : 0)
    );
  }

  React.useEffect(() => {
    const animations = glowValuesRef.current.map((value, index) =>
      Animated.timing(value, {
        toValue: index === safeActiveIndex ? 1 : 0,
        duration: 170,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    );
    Animated.parallel(animations).start();
  }, [safeActiveIndex, items.length]);

  if (items.length < 3) {
    return (
      <View pointerEvents="box-none" style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={[styles.container, styles.compactContainer]}>
          <View pointerEvents="none" style={styles.surface} />
          <View style={styles.compactRow}>
            {items.map((item, index) => {
              const isFocused = safeActiveIndex === index;
              const glowValue = glowValuesRef.current[index] ?? new Animated.Value(0);

              return (
                <View key={item.key} style={styles.compactSlot}>
                  <Pressable
                    accessibilityRole="tab"
                    accessibilityLabel={item.label}
                    accessibilityState={isFocused ? { selected: true } : {}}
                    onPress={() => onPress(index)}
                    style={styles.compactTabButton}
                  >
                    <Animated.View
                      pointerEvents="none"
                      style={[styles.compactActivePill, { opacity: glowValue }]}
                    >
                      <LinearGradient
                        colors={['rgba(126,89,240,0.62)', 'rgba(93,66,205,0.5)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                    </Animated.View>
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={COMPACT_ICON_SIZE}
                      color={isFocused ? '#FFFFFF' : 'rgba(169,178,205,0.96)'}
                    />
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  }

  const isCenterFocused = safeActiveIndex === middleIndex;
  const centerGlow = glowValuesRef.current[middleIndex] ?? new Animated.Value(isCenterFocused ? 1 : 0);
  const centerScale = centerGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1]
  });

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.container}>
        <View pointerEvents="none" style={styles.surface} />

        <View style={styles.tabRow}>
          {items.map((item, index) => {
            const isFocused = safeActiveIndex === index;
            const isMiddle = index === middleIndex;
            const glowValue = glowValuesRef.current[index] ?? new Animated.Value(0);

            return (
              <View key={item.key} style={styles.tabSlot}>
                {isMiddle ? (
                  <View style={styles.middleSpacer} />
                ) : (
                  <Pressable
                    accessibilityRole="tab"
                    accessibilityLabel={item.label}
                    accessibilityState={isFocused ? { selected: true } : {}}
                    onPress={() => onPress(index)}
                    style={styles.sideTabButton}
                  >
                    <Animated.View
                      pointerEvents="none"
                      style={[styles.sideActivePill, { opacity: glowValue }]}
                    >
                      <LinearGradient
                        colors={['rgba(126,89,240,0.62)', 'rgba(93,66,205,0.5)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                    </Animated.View>

                    <MaterialCommunityIcons
                      name={item.icon}
                      size={SIDE_ICON_SIZE}
                      color={isFocused ? '#FFFFFF' : 'rgba(169,178,205,0.96)'}
                    />
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>

        {centerItem ? (
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel={centerItem.label}
            accessibilityState={safeActiveIndex === middleIndex ? { selected: true } : {}}
            onPress={() => onPress(middleIndex)}
            style={styles.centerButton}
          >
            <LinearGradient
              pointerEvents="none"
              colors={[SURFACE_COLOR, 'rgba(30,34,48,0)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.centerMergeFade}
            />
            <View pointerEvents="none" style={styles.centerBase} />
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.centerNeutralSheen}
            />

            <Animated.View pointerEvents="none" style={[styles.centerShadowGlow, { opacity: centerGlow }]} />

            <Animated.View
              pointerEvents="none"
              style={[styles.centerActiveLayer, { opacity: centerGlow, transform: [{ scale: centerScale }] }]}
            >
              <LinearGradient
                colors={['rgba(148,110,255,0.96)', 'rgba(112,76,223,0.92)', 'rgba(88,61,194,0.9)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>

            <MaterialCommunityIcons
              name={centerItem.icon}
              size={30}
              color={isCenterFocused ? '#FFFFFF' : 'rgba(210,220,248,0.96)'}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0
  },
  container: {
    marginHorizontal: theme.spacing.lg,
    height: BAR_HEIGHT + CENTER_ELEVATION,
    overflow: 'visible'
  },
  compactContainer: {
    height: BAR_HEIGHT
  },
  surface: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: BAR_HEIGHT,
    borderRadius: SURFACE_RADIUS,
    borderWidth: 1,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: SURFACE_COLOR,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.24,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10
  },
  compactRow: {
    position: 'absolute',
    left: BAR_PADDING,
    right: BAR_PADDING,
    bottom: COMPACT_ROW_BOTTOM,
    height: COMPACT_TAB_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  compactSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  compactTabButton: {
    width: COMPACT_TAB_WIDTH,
    height: COMPACT_TAB_HEIGHT,
    borderRadius: COMPACT_TAB_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2
  },
  compactActivePill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: COMPACT_TAB_HEIGHT / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    overflow: 'hidden'
  },
  tabRow: {
    position: 'absolute',
    left: BAR_PADDING,
    right: BAR_PADDING,
    bottom: SIDE_ROW_BOTTOM,
    height: SIDE_TAB_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  tabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  middleSpacer: {
    width: CENTER_TAB_SIZE,
    height: CENTER_TAB_SIZE
  },
  sideTabButton: {
    width: SIDE_TAB_SIZE,
    height: SIDE_TAB_SIZE,
    borderRadius: SIDE_TAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2
  },
  sideActivePill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: SIDE_TAB_SIZE / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    overflow: 'hidden'
  },
  centerButton: {
    position: 'absolute',
    left: '50%',
    bottom: BAR_HEIGHT - CENTER_ELEVATION - CENTER_TAB_SIZE / 2,
    marginLeft: -(CENTER_TAB_SIZE / 2),
    width: CENTER_TAB_SIZE,
    height: CENTER_TAB_SIZE,
    borderRadius: CENTER_TAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 7 }
      },
      android: {
        elevation: 10
      }
    })
  },
  centerMergeFade: {
    position: 'absolute',
    left: -4,
    right: -4,
    bottom: -18,
    height: 24
  },
  centerBase: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CENTER_TAB_SIZE / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: SURFACE_COLOR
  },
  centerNeutralSheen: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CENTER_TAB_SIZE / 2,
    opacity: 0.44
  },
  centerActiveLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CENTER_TAB_SIZE / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    overflow: 'hidden'
  },
  centerShadowGlow: {
    position: 'absolute',
    width: CENTER_TAB_SIZE + 8,
    height: CENTER_TAB_SIZE + 8,
    borderRadius: (CENTER_TAB_SIZE + 8) / 2,
    backgroundColor: 'rgba(127,92,245,0.38)',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(136,92,246,0.95)',
        shadowOpacity: 0.55,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 3 }
      },
      android: {
        elevation: 12
      }
    })
  }
});
