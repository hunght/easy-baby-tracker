import React from 'react';
import { Text, View, ViewStyle } from 'react-native';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function ChartCard({ title, subtitle, children, style }: ChartCardProps) {
  return (
    <View className="mb-4 rounded-lg bg-card p-4 shadow-sm shadow-black/5" style={style}>
      <View className="mb-4">
        <Text className="text-lg font-semibold text-foreground">{title}</Text>
        {subtitle && <Text className="mt-1 text-sm text-muted-foreground">{subtitle}</Text>}
      </View>
      <View className="items-center justify-center">{children}</View>
    </View>
  );
}
