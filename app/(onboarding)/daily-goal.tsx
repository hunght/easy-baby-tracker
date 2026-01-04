import { useMutation } from '@tanstack/react-query';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Target, Clock, Zap } from 'lucide-react-native';
import { useState } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import {
  createUserProfile,
  setActiveUserProfile,
  type UserSettings,
} from '@/database/user-profile';
import { useBrandColor } from '@/hooks/use-brand-color';

const goalOptions = [
  { value: 5, label: '5 words', description: '~5 min/day', icon: Clock },
  { value: 10, label: '10 words', description: '~10 min/day', icon: Target },
  { value: 15, label: '15 words', description: '~15 min/day', icon: Target },
  { value: 20, label: '20 words', description: '~20 min/day', icon: Zap },
];

export default function DailyGoalScreen() {
  const router = useRouter();
  const brandColors = useBrandColor();
  const { difficulty } = useLocalSearchParams<{ difficulty: string }>();
  const [selected, setSelected] = useState(10);

  // Create profile mutation
  const createProfileMutation = useMutation({
    mutationFn: async () => {
      const settings: Partial<UserSettings> = {
        dailyGoal: selected,
        preferredDifficulty: (difficulty as UserSettings['preferredDifficulty']) ?? 'beginner',
        soundEnabled: true,
        hapticEnabled: true,
        theme: 'system',
      };

      const profile = await createUserProfile('Player', settings);
      await setActiveUserProfile(profile.id);
      return profile;
    },
    onSuccess: () => {
      // Navigate to main app
      router.replace('/(tabs)/quiz');
    },
    onError: (error) => {
      console.error('Failed to create profile:', error);
    },
  });

  const handleComplete = () => {
    createProfileMutation.mutate();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 py-4">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-center text-2xl font-bold text-foreground">
            Set Your Daily Goal
          </Text>
          <Text className="mt-2 text-center text-muted-foreground">
            How many words do you want to practice each day?
          </Text>
        </View>

        {/* Goal Options */}
        <View className="flex-1 gap-3">
          {goalOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selected === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() => setSelected(option.value)}
                className={`rounded-xl border-2 p-4 ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                }`}>
                <View className="flex-row items-center gap-4">
                  <View
                    className={`rounded-full p-3 ${
                      isSelected ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                    <Icon
                      size={24}
                      color={
                        isSelected
                          ? brandColors.colors.primary
                          : brandColors.colors.mutedForeground
                      }
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-lg font-semibold ${
                        isSelected ? 'text-primary' : 'text-foreground'
                      }`}>
                      {option.label}
                    </Text>
                    <Text className="text-sm text-muted-foreground">{option.description}</Text>
                  </View>
                  <View
                    className={`h-6 w-6 rounded-full border-2 ${
                      isSelected
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground bg-transparent'
                    }`}>
                    {isSelected && (
                      <View className="m-auto h-2 w-2 rounded-full bg-white" />
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Info */}
        <View className="mb-4 rounded-xl bg-muted/50 p-4">
          <Text className="text-center text-sm text-muted-foreground">
            You can always change this later in Settings
          </Text>
        </View>

        {/* Complete Button */}
        <View className="pb-4">
          <Button
            size="lg"
            onPress={handleComplete}
            disabled={createProfileMutation.isPending}
            className="w-full">
            {createProfileMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-lg font-semibold text-primary-foreground">
                Start Learning
              </Text>
            )}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
