import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';

import { FeatureKey, useFeatureFlags } from '@/context/FeatureFlagContext';
import { TRACKING_TILES } from '@/constants/tracking-tiles';
import { useBrandColor } from '@/hooks/use-brand-color';

type QuickActionMenuProps = {
  isOpen: boolean;
  onToggle: () => void;
};

export function QuickActionMenu({ isOpen, onToggle }: QuickActionMenuProps) {
  const router = useRouter();
  const { features } = useFeatureFlags();
  const brandColors = useBrandColor();
  const progress = useSharedValue(0);

  // Update progress when isOpen changes
  React.useEffect(() => {
    progress.value = withSpring(isOpen ? 1 : 0, {
      damping: 20,
      stiffness: 300,
    });
  }, [isOpen]);

  const handleAction = (id: FeatureKey) => {
    // Toggle close
    onToggle();
    // Navigation will happen immediately, animation closes menu
    // Type-safe navigation using conditional logic instead of type assertions
    if (id === 'habit') {
      router.push('/(habit)/habit');
    } else if (id === 'feeding') {
      router.push('/(tracking)/feeding');
    } else if (id === 'diaper') {
      router.push('/(tracking)/diaper');
    } else if (id === 'sleep') {
      router.push('/(tracking)/sleep');
    } else if (id === 'health') {
      router.push('/(tracking)/health');
    } else if (id === 'growth') {
      router.push('/(tracking)/growth');
    } else if (id === 'pumping') {
      router.push('/(tracking)/pumping');
    } else if (id === 'diary') {
      router.push('/(tracking)/diary');
    }
  };

  const visibleActions = React.useMemo(() => {
    return TRACKING_TILES.filter((tile) => features[tile.id]);
  }, [features]);

  // Optimize radius based on item count
  // Lower count = smaller radius for easier reach
  const radius = visibleActions.length > 4 ? 150 : 120;

  const getAngle = (index: number, total: number) => {
    if (total <= 1) return -90 * (Math.PI / 180);

    // Distribute from right (-30) to left (-150) or tighter if fewer items
    // Step size: max 40 degrees, or fit within 120 degrees
    const maxSpan = 170; // degrees
    const itemSpacing = 40; // degrees

    // Actual span needed if we use 40 deg spacing
    const neededSpan = (total - 1) * itemSpacing;

    // If needed span fits in maxSpan, use itemSpacing. Else squeeze them.
    const step = neededSpan <= maxSpan ? itemSpacing : maxSpan / (total - 1);

    // Start angle (right-most)
    const startDeg = -90 + ((total - 1) * step) / 2;

    // Convert to radians
    const angleDeg = startDeg - index * step;
    return angleDeg * (Math.PI / 180);
  };

  return (
    <View
      className="absolute inset-0 z-[50] items-center justify-end pb-5"
      pointerEvents="box-none">
      {/* Background overlay when open */}
      {isOpen && (
        <Pressable className="absolute inset-0" onPress={onToggle}>
          <BlurView className="absolute inset-0" intensity={20} tint="systemMaterial" />
        </Pressable>
      )}

      {/* Action Buttons */}
      <View
        className="absolute bottom-[50px] left-0 right-0 items-center justify-center"
        pointerEvents="box-none">
        {visibleActions.map((action, index) => {
          const angle = getAngle(index, visibleActions.length);
          return (
            <ActionButton
              key={action.id}
              icon={action.icon}
              color={brandColors.get(action.colorKey)}
              onPress={() => handleAction(action.id)}
              angle={angle}
              progress={progress}
              radius={radius}
            />
          );
        })}
      </View>
    </View>
  );
}

function ActionButton({
  icon,
  color,
  onPress,
  angle,
  progress,
  radius,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  onPress: () => void;
  angle: number;
  progress: SharedValue<number>;
  radius: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(progress.value, [0, 1], [0, radius * Math.cos(angle)]);
    const translateY = interpolate(progress.value, [0, 1], [0, radius * Math.sin(angle)]);
    const scale = interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP);

    return {
      transform: [{ translateX }, { translateY }, { scale }],
      opacity: progress.value,
    };
  });

  return (
    <Animated.View className="absolute h-14 w-14 items-center justify-center" style={animatedStyle}>
      <Pressable
        className="h-[60px] w-[60px] items-center justify-center rounded-[30px]"
        style={{
          backgroundColor: color,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 4.65,
          elevation: 8,
        }}
        onPress={onPress}>
        <MaterialCommunityIcons name={icon} size={24} color="white" />
      </Pressable>
    </Animated.View>
  );
}
