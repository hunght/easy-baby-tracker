import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { useBrandColor } from '@/hooks/use-brand-color';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
}

export function SummaryCard({ title, value, icon, color }: SummaryCardProps) {
  const brandColors = useBrandColor();
  const backgroundColor = color || brandColors.colors.primary;
  return (
    <View className="mb-3 flex-row items-center rounded-lg bg-card p-4 shadow-sm shadow-black/5">
      <View
        className="mr-4 h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: backgroundColor + '20' }}>
        {icon && <Ionicons name={icon} size={24} color={backgroundColor} />}
      </View>
      <View className="flex-1">
        <Text className="text-xl font-bold text-foreground">{value}</Text>
        <Text className="mt-0.5 text-sm text-muted-foreground">{title}</Text>
      </View>
    </View>
  );
}
