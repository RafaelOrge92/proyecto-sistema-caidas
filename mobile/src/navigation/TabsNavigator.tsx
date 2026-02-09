import React from 'react';
import { Animated, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { DevicesScreen } from '../screens/DevicesScreen';
import { EventsScreen } from '../screens/EventsScreen';
import { UsersScreen } from '../screens/UsersScreen';
import { TabParamList } from './types';
import { LuxuryPagerBar, PagerTabItem } from './LuxuryPagerBar';
import { theme } from '../theme';
import { useAuth } from '../auth/AuthContext';

type PagerRoute = {
  key: keyof TabParamList;
  component: React.ComponentType;
} & PagerTabItem;

const PEEK_SIZE = 0;
const PAGE_GAP = 0;
const BAR_RESERVED_HEIGHT = 124;

export const TabsNavigator = () => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const routes = React.useMemo<PagerRoute[]>(() => {
    const sharedRoutes: PagerRoute[] = [
      {
        key: 'Devices',
        label: 'Dispositivos',
        icon: 'view-grid-outline',
        component: DevicesScreen
      },
      {
        key: 'Events',
        label: 'Eventos',
        icon: 'heart-pulse',
        component: EventsScreen
      }
    ];

    if (user?.role !== 'ADMIN') {
      return sharedRoutes;
    }

    return [
      {
        key: 'Users',
        label: 'Usuarios',
        icon: 'account-group-outline',
        component: UsersScreen
      },
      ...sharedRoutes
    ];
  }, [user?.role]);

  const initialIndex = React.useMemo(() => {
    const index = routes.findIndex((route) => route.key === 'Devices');
    return index >= 0 ? index : 0;
  }, [routes]);

  const desiredPageWidth = width - PEEK_SIZE * 2 - PAGE_GAP * 2;
  const pageWidth = Math.max(Math.min(desiredPageWidth, width), 260);
  const sideInset = Math.max((width - pageWidth) / 2, 0);
  const snapInterval = pageWidth + PAGE_GAP;
  const initialOffset = initialIndex * snapInterval;
  const scrollRef = React.useRef<ScrollView>(null);
  const scrollX = React.useRef(new Animated.Value(initialOffset)).current;
  const activeIndexRef = React.useRef(initialIndex);
  const isProgrammaticScrollRef = React.useRef(false);
  const [activeIndex, setActiveIndex] = React.useState(initialIndex);
  const pagerBottomPadding = BAR_RESERVED_HEIGHT + insets.bottom;

  const progress = React.useMemo(
    () => Animated.divide(scrollX, snapInterval || 1),
    [scrollX, snapInterval]
  );

  const updateActiveIndex = React.useCallback(
    (offsetX: number) => {
      const rawIndex = offsetX / snapInterval;
      const boundedIndex = Math.max(0, Math.min(routes.length - 1, Math.round(rawIndex)));
      if (activeIndexRef.current === boundedIndex) return;
      activeIndexRef.current = boundedIndex;
      setActiveIndex(boundedIndex);
    },
    [routes.length, snapInterval]
  );

  React.useEffect(() => {
    activeIndexRef.current = initialIndex;
    setActiveIndex(initialIndex);
    isProgrammaticScrollRef.current = false;
    scrollX.setValue(initialOffset);
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: initialOffset, y: 0, animated: false });
      updateActiveIndex(initialOffset);
    });
    return () => cancelAnimationFrame(frame);
  }, [initialIndex, initialOffset, scrollX, snapInterval, updateActiveIndex]);

  const handleTabPress = React.useCallback(
    (index: number) => {
      if (index === activeIndexRef.current) return;
      isProgrammaticScrollRef.current = true;
      activeIndexRef.current = index;
      setActiveIndex(index);
      scrollRef.current?.scrollTo({ x: index * snapInterval, y: 0, animated: true });
    },
    [snapInterval]
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        pointerEvents="none"
        colors={theme.gradients.dark}
        style={StyleSheet.absoluteFill}
      />
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        snapToInterval={snapInterval}
        snapToAlignment="start"
        decelerationRate={0.992}
        nestedScrollEnabled
        directionalLockEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.pagerContent, { paddingHorizontal: sideInset }]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          {
            useNativeDriver: true,
            listener: (event: unknown) => {
              if (isProgrammaticScrollRef.current) return;
              const offsetX = (event as { nativeEvent?: { contentOffset?: { x?: number } } })?.nativeEvent?.contentOffset?.x;
              if (typeof offsetX === 'number') {
                updateActiveIndex(offsetX);
              }
            }
          }
        )}
        onMomentumScrollEnd={(event) => {
          isProgrammaticScrollRef.current = false;
          updateActiveIndex(event.nativeEvent.contentOffset.x);
        }}
        scrollEventThrottle={16}
      >
        {routes.map((route, index) => {
          const ScreenComponent = route.component;
          const isLast = index === routes.length - 1;
          const inputRange = [
            (index - 1) * snapInterval,
            index * snapInterval,
            (index + 1) * snapInterval
          ];
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.965, 1, 0.965],
            extrapolate: 'clamp'
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.72, 1, 0.72],
            extrapolate: 'clamp'
          });
          const translateY = scrollX.interpolate({
            inputRange,
            outputRange: [10, 0, 10],
            extrapolate: 'clamp'
          });

          return (
            <Animated.View
              key={route.key}
              style={[
                styles.pageItem,
                {
                  width: pageWidth,
                  marginRight: isLast ? 0 : PAGE_GAP,
                  paddingBottom: pagerBottomPadding,
                  opacity,
                  transform: [{ translateY }, { scale }]
                }
              ]}
            >
              <Animated.View style={styles.pageCard}>
                <ScreenComponent />
              </Animated.View>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>

      <LuxuryPagerBar
        items={routes}
        activeIndex={activeIndex}
        progress={progress}
        onPress={handleTabPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary
  },
  pagerContent: {
    flexGrow: 1
  },
  pageItem: {
    flex: 1,
    paddingTop: 0
  },
  pageCard: {
    flex: 1,
    borderRadius: theme.radii.apple + 8,
    overflow: 'hidden',
    backgroundColor: 'transparent'
  }
});
