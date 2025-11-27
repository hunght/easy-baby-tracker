import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocalization } from '@/localization/LocalizationProvider';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useLocalization();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: 10 + insets.bottom,
          paddingTop: 10,
        },
      }}>
      <Tabs.Screen
        name="timeline"
        options={{
          title: t('tabs.timeline'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="time-outline" size={26} color={focused ? '#FF5C8D' : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="charts"
        options={{
          title: t('tabs.charts'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="stats-chart" size={30} color={focused ? '#FF5C8D' : color} />
          ),

        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.tracking'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="medkit" size={30} color={focused ? '#FF5C8D' : color} />
          ),

        }}
      />
      <Tabs.Screen
        name="scheduling"
        options={{
          title: t('tabs.schedules'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="calendar-outline" size={26} color={focused ? '#FF5C8D' : color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="settings-outline" size={26} color={focused ? '#FF5C8D' : color} />
          ),
        }}
      />
    </Tabs>
  );
}
