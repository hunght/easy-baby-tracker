import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Moon, Sun, Volume2, Vibrate, Target, Info } from 'lucide-react-native';
import { ScrollView, View, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { USER_PROFILE_QUERY_KEY } from '@/constants/query-keys';
import {
  getActiveUserProfile,
  getUserSettings,
  updateUserSettings,
  type UserSettings,
} from '@/database/user-profile';
import { useTheme } from '@/lib/ThemeContext';
import { useBrandColor } from '@/hooks/use-brand-color';

export default function SettingsScreen() {
  const brandColors = useBrandColor();
  const queryClient = useQueryClient();
  const { themeMode, setThemeMode } = useTheme();

  // Get active user profile
  const { data: profile } = useQuery({
    queryKey: ['activeUserProfile'],
    queryFn: getActiveUserProfile,
  });

  const userId = profile?.id;

  // Get user settings
  const { data: settings } = useQuery({
    queryKey: ['userSettings', userId],
    queryFn: () => (userId ? getUserSettings(userId) : null),
    enabled: !!userId,
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<UserSettings>) => {
      if (!userId) return;
      await updateUserSettings(userId, newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings', userId] });
    },
  });

  const handleToggleSetting = (key: keyof UserSettings, value: boolean) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  const handleDailyGoalChange = (goal: number) => {
    updateSettingsMutation.mutate({ dailyGoal: goal });
  };

  const dailyGoalOptions = [5, 10, 15, 20, 30];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-4"
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="py-2">
          <Text className="text-2xl font-bold text-foreground">Settings</Text>
          <Text className="text-muted-foreground">Customize your experience</Text>
        </View>

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex-row items-center justify-between">
              <Text className="text-foreground">Name</Text>
              <Text className="text-muted-foreground">{profile?.name ?? 'Player'}</Text>
            </View>
          </CardContent>
        </Card>

        {/* Learning Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex-row items-center gap-2">
              <Target size={20} color={brandColors.colors.foreground} />
              <Text className="text-lg font-semibold">Learning</Text>
            </CardTitle>
          </CardHeader>
          <CardContent className="gap-4">
            {/* Daily Goal */}
            <View>
              <Text className="mb-2 font-medium text-foreground">Daily Goal</Text>
              <View className="flex-row gap-2">
                {dailyGoalOptions.map((goal) => (
                  <Pressable
                    key={goal}
                    onPress={() => handleDailyGoalChange(goal)}
                    className={`flex-1 items-center rounded-lg border py-2 ${
                      settings?.dailyGoal === goal
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card'
                    }`}>
                    <Text
                      className={`font-medium ${
                        settings?.dailyGoal === goal ? 'text-primary' : 'text-foreground'
                      }`}>
                      {goal}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text className="mt-1 text-xs text-muted-foreground">Words per day</Text>
            </View>

            {/* Difficulty Preference */}
            <View>
              <Text className="mb-2 font-medium text-foreground">Preferred Difficulty</Text>
              <View className="flex-row gap-2">
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <Pressable
                    key={level}
                    onPress={() => updateSettingsMutation.mutate({ preferredDifficulty: level })}
                    className={`flex-1 items-center rounded-lg border py-2 ${
                      settings?.preferredDifficulty === level
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card'
                    }`}>
                    <Text
                      className={`text-sm font-medium capitalize ${
                        settings?.preferredDifficulty === level ? 'text-primary' : 'text-foreground'
                      }`}>
                      {level}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex-row items-center gap-2">
              {themeMode === 'dark' ? (
                <Moon size={20} color={brandColors.colors.foreground} />
              ) : (
                <Sun size={20} color={brandColors.colors.foreground} />
              )}
              <Text className="text-lg font-semibold">Appearance</Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex-row gap-2">
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <Pressable
                  key={mode}
                  onPress={() => setThemeMode(mode)}
                  className={`flex-1 items-center rounded-lg border py-2 ${
                    themeMode === mode ? 'border-primary bg-primary/10' : 'border-border bg-card'
                  }`}>
                  <Text
                    className={`text-sm font-medium capitalize ${
                      themeMode === mode ? 'text-primary' : 'text-foreground'
                    }`}>
                    {mode}
                  </Text>
                </Pressable>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Sound & Haptics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex-row items-center gap-2">
              <Volume2 size={20} color={brandColors.colors.foreground} />
              <Text className="text-lg font-semibold">Sound & Haptics</Text>
            </CardTitle>
          </CardHeader>
          <CardContent className="gap-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Volume2 size={18} color={brandColors.colors.mutedForeground} />
                <Text className="text-foreground">Sound Effects</Text>
              </View>
              <Switch
                value={settings?.soundEnabled ?? true}
                onValueChange={(value) => handleToggleSetting('soundEnabled', value)}
                trackColor={{ false: brandColors.colors.muted, true: brandColors.colors.primary }}
              />
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Vibrate size={18} color={brandColors.colors.mutedForeground} />
                <Text className="text-foreground">Haptic Feedback</Text>
              </View>
              <Switch
                value={settings?.hapticEnabled ?? true}
                onValueChange={(value) => handleToggleSetting('hapticEnabled', value)}
                trackColor={{ false: brandColors.colors.muted, true: brandColors.colors.primary }}
              />
            </View>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle className="flex-row items-center gap-2">
              <Info size={20} color={brandColors.colors.foreground} />
              <Text className="text-lg font-semibold">About</Text>
            </CardTitle>
          </CardHeader>
          <CardContent className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-foreground">Version</Text>
              <Text className="text-muted-foreground">1.0.0</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-foreground">Algorithm</Text>
              <Text className="text-muted-foreground">FSRS-4.5</Text>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
