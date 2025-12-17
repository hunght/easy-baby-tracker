import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState, useRef } from 'react';
import {
  Dimensions,
  Pressable,
  View,
  StatusBar,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { useLocalization } from '@/localization/LocalizationProvider';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PhotoViewerScreen() {
  const router = useRouter();
  const { t } = useLocalization();
  const insets = useSafeAreaInsets();
  const { uri, title } = useLocalSearchParams<{ uri: string; title?: string }>();

  const [scale, setScale] = useState(1);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScale = event.nativeEvent.zoomScale;
    setScale(currentScale);
  };

  const handleDoubleTap = () => {
    if (scale > 1) {
      scrollViewRef.current?.scrollResponderZoomTo({
        x: 0,
        y: 0,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        animated: true,
      });
    } else {
      // Zoom to 2x at center
      scrollViewRef.current?.scrollResponderZoomTo({
        x: SCREEN_WIDTH / 4,
        y: SCREEN_HEIGHT / 4,
        width: SCREEN_WIDTH / 2,
        height: SCREEN_HEIGHT / 2,
        animated: true,
      });
    }
  };

  if (!uri) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-white">{t('common.error')}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View
        className="absolute left-0 right-0 z-10 flex-row items-center justify-between px-4"
        style={{ top: insets.top }}>
        <Pressable
          onPress={handleClose}
          className="h-10 w-10 items-center justify-center rounded-full bg-black/50">
          <MaterialCommunityIcons name="close" size={24} color="#FFF" />
        </Pressable>

        {title && (
          <View className="mx-4 flex-1">
            <Text className="text-center text-base font-semibold text-white" numberOfLines={1}>
              {title}
            </Text>
          </View>
        )}

        <View className="w-10" />
      </View>

      {/* Zoomable Image */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT,
        }}
        centerContent
        maximumZoomScale={5}
        minimumZoomScale={1}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bouncesZoom>
        <Pressable onPress={handleDoubleTap} style={{ flex: 1 }}>
          <Image
            source={{ uri }}
            style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
            contentFit="contain"
            transition={200}
          />
        </Pressable>
      </ScrollView>

      {/* Zoom indicator */}
      {scale > 1 && (
        <View
          className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1"
          style={{ bottom: insets.bottom + 16 }}>
          <Text className="text-sm font-medium text-white">{Math.round(scale * 100)}%</Text>
        </View>
      )}
    </View>
  );
}
