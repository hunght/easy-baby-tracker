import { useRouter } from 'expo-router';
import { BookOpen, Brain, Trophy } from 'lucide-react-native';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useBrandColor } from '@/hooks/use-brand-color';

export default function WelcomeScreen() {
  const router = useRouter();
  const brandColors = useBrandColor();

  const handleGetStarted = () => {
    router.push('/(onboarding)/difficulty');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-6">
        {/* Logo/Icon */}
        <View className="mb-8 rounded-full bg-primary/10 p-8">
          <BookOpen size={80} color={brandColors.colors.primary} />
        </View>

        {/* Title */}
        <Text className="text-center text-3xl font-bold text-foreground">
          Welcome to Spelling Bee
        </Text>

        {/* Subtitle */}
        <Text className="mt-2 text-center text-lg text-muted-foreground">
          Master spelling with adaptive learning
        </Text>

        {/* Features */}
        <View className="mt-10 w-full gap-4">
          <View className="flex-row items-center gap-4 rounded-xl bg-card p-4">
            <View className="rounded-full bg-primary/10 p-3">
              <Brain size={24} color={brandColors.colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-foreground">Smart Learning</Text>
              <Text className="text-sm text-muted-foreground">
                FSRS algorithm adapts to your learning pace
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-4 rounded-xl bg-card p-4">
            <View className="rounded-full bg-accent/10 p-3">
              <Trophy size={24} color={brandColors.colors.accent} />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-foreground">Track Progress</Text>
              <Text className="text-sm text-muted-foreground">
                Build streaks and level up as you learn
              </Text>
            </View>
          </View>
        </View>

        {/* CTA Button */}
        <View className="mt-auto w-full pb-4">
          <Button size="lg" onPress={handleGetStarted} className="w-full">
            <Text className="text-lg font-semibold text-primary-foreground">Get Started</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
