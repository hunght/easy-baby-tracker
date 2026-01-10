import { useQuery } from "convex/react";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from "react-native";

import { BabyInfoBanner } from "@/components/BabyInfoBanner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useSetActiveBabyProfile } from "@/hooks/use-set-active-baby-profile";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 0; // Main card width - leaves 32px on each side for peek
const CARD_GAP = 10; // Gap between cards
const SIDE_CARD_SCALE = 0.92; // Scale for adjacent cards
const SIDE_CARD_OPACITY = 0.7; // Opacity for adjacent cards
// Calculate horizontal padding to center the first card
const HORIZONTAL_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2;

export function SwipeableBabyProfiles() {
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeBabyIndex, setActiveBabyIndex] = useState<number>(0);
  const setActiveBabyMutation = useSetActiveBabyProfile();

  // Queries - Convex reactive queries
  const profile = useQuery(api.babyProfiles.getActive);
  const babyProfiles = useQuery(api.babyProfiles.list) ?? [];

  // Growth query - fetch latest 2 records
  const latestGrowthRecords =
    useQuery(
      api.growthRecords.list,
      profile?._id ? { babyId: profile._id, limit: 2 } : "skip"
    ) ?? [];

  // Compute display babies list
  const displayBabies = useMemo(() => {
    return babyProfiles.length > 0 ? babyProfiles : profile ? [profile] : [];
  }, [babyProfiles, profile]);

  // Sync active index with profile
  useEffect(() => {
    if (profile && displayBabies.length > 0) {
      const index = displayBabies.findIndex((b) => b._id === profile._id);
      if (index !== -1 && index !== activeBabyIndex) {
        setActiveBabyIndex(index);
        // Scroll to active baby without animation on mount/sync
        const scrollToX = index * (CARD_WIDTH + CARD_GAP);
        scrollRef.current?.scrollTo({ x: scrollToX, animated: false });
      }
    }
  }, [profile?._id, displayBabies]);

  // Handle baby selection
  const handleSelectBaby = async (babyId: Id<"babyProfiles">) => {
    if (babyId === profile?._id) {
      return;
    }
    await setActiveBabyMutation.mutateAsync(babyId);
  };

  // Handle scroll end to switch baby
  const onMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const x = event.nativeEvent.contentOffset.x;
    const snapInterval = CARD_WIDTH + CARD_GAP;
    const index = Math.round(x / snapInterval);
    if (index >= 0 && index < displayBabies.length) {
      setActiveBabyIndex(index);
      const baby = displayBabies[index];
      if (baby && baby._id !== profile?._id) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        handleSelectBaby(baby._id);
      }
    }
  };

  // Extract latest and previous records
  const latestGrowthRecord = latestGrowthRecords[0];
  const previousGrowthRecord = latestGrowthRecords[1];

  if (displayBabies.length === 0) {
    return null;
  }

  const hasPeek = displayBabies.length > 1;
  const snapInterval = CARD_WIDTH + CARD_GAP;

  // Get animated scale and opacity for each card
  const getCardStyle = (index: number) => {
    if (!hasPeek) {
      return { transform: [{ scale: 1 }], opacity: 1 };
    }

    const inputRange = [
      (index - 1) * snapInterval,
      index * snapInterval,
      (index + 1) * snapInterval,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [SIDE_CARD_SCALE, 1, SIDE_CARD_SCALE],
      extrapolate: "clamp",
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [SIDE_CARD_OPACITY, 1, SIDE_CARD_OPACITY],
      extrapolate: "clamp",
    });

    return { transform: [{ scale }], opacity };
  };

  return (
    <View>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        snapToInterval={snapInterval}
        snapToAlignment="center"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          {
            useNativeDriver: true,
          }
        )}
        scrollEventThrottle={16}
        decelerationRate="fast"
        contentContainerStyle={{
          paddingHorizontal: HORIZONTAL_PADDING,
          gap: CARD_GAP,
        }}
        className="mb-2 pt-4"
      >
        {displayBabies.map((baby, index) => (
          <Animated.View
            key={baby._id}
            style={[{ width: CARD_WIDTH }, getCardStyle(index)]}
          >
            <BabyInfoBanner
              profile={baby}
              latestGrowthRecord={
                baby._id === profile?._id ? latestGrowthRecord : undefined
              }
              previousGrowthRecord={
                baby._id === profile?._id ? previousGrowthRecord : undefined
              }
            />
          </Animated.View>
        ))}
      </Animated.ScrollView>
    </View>
  );
}
