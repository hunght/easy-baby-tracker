import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from './ui/text';

type TabPageHeaderProps = {
  title: string;
  subtitle?: string;
  accessory?: React.ReactNode;
};

export function TabPageHeader({ title, subtitle, accessory }: TabPageHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="rounded-b-2xl bg-background px-5 pb-3 shadow-sm shadow-black/5"
      style={{ paddingTop: insets.top + 6 }}>
      <View className="flex-row items-center gap-4">
        <View className="flex-1">
          <Text className="text-2xl font-bold text-foreground">{title}</Text>
          {subtitle ? <Text className="mt-1 text-sm text-gray-500">{subtitle}</Text> : null}
        </View>
        {accessory ? <View className="self-start">{accessory}</View> : null}
      </View>
    </View>
  );
}
