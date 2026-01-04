import { Tabs } from 'expo-router';
import { BookOpen, ChartBar, Settings, Trophy } from 'lucide-react-native';

import { useBrandColor } from '@/hooks/use-brand-color';

export default function TabLayout() {
  const brandColors = useBrandColor();
  const primaryColor = brandColors.colors.primary;
  const mutedColor = brandColors.colors.mutedForeground;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: mutedColor,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: brandColors.colors.border,
          backgroundColor: brandColors.colors.background,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}>
      <Tabs.Screen
        name="quiz"
        options={{
          title: 'Practice',
          tabBarIcon: ({ color, size }) => <Trophy size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }) => <ChartBar size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="words"
        options={{
          title: 'Words',
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
