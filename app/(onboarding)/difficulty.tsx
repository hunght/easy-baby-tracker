import { useRouter } from 'expo-router';
import { GraduationCap, Sparkles, Flame } from 'lucide-react-native';
import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useBrandColor } from '@/hooks/use-brand-color';

type Difficulty = 'beginner' | 'intermediate' | 'advanced';

const difficulties: {
  id: Difficulty;
  title: string;
  description: string;
  icon: typeof GraduationCap;
  color: string;
}[] = [
  {
    id: 'beginner',
    title: 'Beginner',
    description: 'Start with common words and build your foundation',
    icon: GraduationCap,
    color: 'text-green-500',
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    description: 'Challenge yourself with more complex vocabulary',
    icon: Sparkles,
    color: 'text-yellow-500',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'Master difficult and uncommon words',
    icon: Flame,
    color: 'text-red-500',
  },
];

export default function DifficultyScreen() {
  const router = useRouter();
  const brandColors = useBrandColor();
  const [selected, setSelected] = useState<Difficulty>('beginner');

  const handleContinue = () => {
    router.push({
      pathname: '/(onboarding)/daily-goal',
      params: { difficulty: selected },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 py-4">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-center text-2xl font-bold text-foreground">
            Choose Your Level
          </Text>
          <Text className="mt-2 text-center text-muted-foreground">
            Select your starting difficulty
          </Text>
        </View>

        {/* Difficulty Options */}
        <View className="flex-1 gap-4">
          {difficulties.map((difficulty) => {
            const Icon = difficulty.icon;
            const isSelected = selected === difficulty.id;

            return (
              <Pressable
                key={difficulty.id}
                onPress={() => setSelected(difficulty.id)}
                className={`rounded-xl border-2 p-4 ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                }`}>
                <View className="flex-row items-center gap-4">
                  <View
                    className={`rounded-full p-3 ${
                      isSelected ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                    <Icon
                      size={28}
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
                      {difficulty.title}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      {difficulty.description}
                    </Text>
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

        {/* Continue Button */}
        <View className="pb-4">
          <Button size="lg" onPress={handleContinue} className="w-full">
            <Text className="text-lg font-semibold text-primary-foreground">Continue</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
