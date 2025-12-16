import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { useTheme } from '@/lib/ThemeContext';
import { NAV_THEME } from '@/lib/theme';
import { useLocalization } from '@/localization/LocalizationProvider';
import { QuickActionMenu } from '@/components/QuickActionMenu';
import { useFeatureFlags } from '@/context/FeatureFlagContext';

export default function TabLayout() {
  const { colorScheme } = useTheme();
  const { t } = useLocalization();
  const insets = useSafeAreaInsets();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { features } = useFeatureFlags();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Tabs
        initialRouteName="tracking"
        screenOptions={{
          tabBarActiveTintColor: NAV_THEME[colorScheme].colors.text,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            height: 60 + insets.bottom,
            paddingBottom: 10 + insets.bottom,
            paddingTop: 10,
          },
        }}>
        <Tabs.Screen
          name="easy-schedule"
          options={{
            title: t('tabs.easySchedule'),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name="calendar-number-outline"
                size={26}
                color={focused ? '#FF5C8D' : color}
              />
            ),
            tabBarButton: (props) => <HapticTab {...props} testID="tab-easy-schedule" />,
          }}
        />
        <Tabs.Screen
          name="charts"
          options={{
            title: t('tabs.charts'),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name="stats-chart" size={30} color={focused ? '#FF5C8D' : color} />
            ),
            tabBarButton: (props) => <HapticTab {...props} testID="tab-charts" />,
          }}
        />
        <Tabs.Screen
          name="tracking"
          options={{
            title: t('tabs.tracking'),
            tabBarLabel: () => null, // Hide label for the FAB look
            tabBarIcon: ({ focused, color }) => (
              <View
                className="elevation-lg items-center justify-center shadow-lg"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  marginBottom: 0,
                  backgroundColor: focused ? '#FF5C8D' : color,
                  shadowColor: focused ? '#FF5C8D' : 'transparent',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: focused ? 0.3 : 0,
                  shadowRadius: 4,
                  elevation: focused ? 5 : 0,
                }}>
                <Ionicons name="add" size={32} color={focused ? 'white' : 'white'} />
              </View>
            ),
            tabBarButton: (props) => <HapticTab {...props} testID="tab-tracking" />,
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              if (navigation.isFocused()) {
                e.preventDefault();
                setIsMenuOpen((prev) => !prev);
              } else {
                // If navigating to tab, ensure menu is closed or open?
                // Default behavior is fine, but maybe close menu if it was somehow open?
                if (isMenuOpen) setIsMenuOpen(false);
              }
            },
          })}
        />
        <Tabs.Screen
          name="scheduling"
          options={{
            title: t('tabs.schedules'),
            href: features.habit ? undefined : null,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name="calendar-outline" size={26} color={focused ? '#FF5C8D' : color} />
            ),
            tabBarButton: features.habit
              ? (props) => <HapticTab {...props} testID="tab-scheduling" />
              : undefined,
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            title: t('tabs.settings'),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name="settings-outline" size={26} color={focused ? '#FF5C8D' : color} />
            ),
            tabBarButton: (props) => <HapticTab {...props} testID="tab-settings" />,
          }}
        />
      </Tabs>
      <QuickActionMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />
    </SafeAreaView>
  );
}
