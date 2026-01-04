import { useQuery } from '@tanstack/react-query';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Trophy, Target, RotateCcw, Home, Star } from 'lucide-react-native';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { getSessionAttempts } from '@/database/quiz-sessions';
import { useBrandColor } from '@/hooks/use-brand-color';

export default function QuizResultScreen() {
  const router = useRouter();
  const brandColors = useBrandColor();
  const { total, correct, sessionId } = useLocalSearchParams<{
    total: string;
    correct: string;
    sessionId: string;
  }>();

  const totalWords = parseInt(total ?? '0', 10);
  const correctWords = parseInt(correct ?? '0', 10);
  const accuracy = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0;

  // Get session attempts for detailed results
  const { data: attempts } = useQuery({
    queryKey: ['sessionAttempts', sessionId],
    queryFn: () => (sessionId ? getSessionAttempts(parseInt(sessionId, 10)) : []),
    enabled: !!sessionId,
  });

  const getResultMessage = () => {
    if (accuracy >= 90) return { message: 'Outstanding!', emoji: '🏆' };
    if (accuracy >= 70) return { message: 'Great job!', emoji: '⭐' };
    if (accuracy >= 50) return { message: 'Good effort!', emoji: '👍' };
    return { message: 'Keep practicing!', emoji: '💪' };
  };

  const { message, emoji } = getResultMessage();

  const handlePracticeAgain = () => {
    router.replace('/(quiz)/session');
  };

  const handleGoHome = () => {
    router.replace('/(tabs)/quiz');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-4">
        {/* Result Icon */}
        <View className="mb-4 rounded-full bg-primary/10 p-6">
          {accuracy >= 70 ? (
            <Trophy size={64} color={brandColors.colors.primary} />
          ) : (
            <Target size={64} color={brandColors.colors.primary} />
          )}
        </View>

        {/* Result Message */}
        <Text className="text-4xl">{emoji}</Text>
        <Text className="mt-2 text-2xl font-bold text-foreground">{message}</Text>

        {/* Score Card */}
        <Card className="mt-6 w-full">
          <CardContent className="py-6">
            {/* Accuracy Circle */}
            <View className="mb-4 items-center">
              <View
                className={`h-32 w-32 items-center justify-center rounded-full border-8 ${
                  accuracy >= 70
                    ? 'border-green-500'
                    : accuracy >= 50
                      ? 'border-yellow-500'
                      : 'border-red-500'
                }`}>
                <Text className="text-4xl font-bold text-foreground">{accuracy}%</Text>
              </View>
            </View>

            {/* Stats */}
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-2xl font-bold text-green-600">{correctWords}</Text>
                <Text className="text-sm text-muted-foreground">Correct</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-red-600">
                  {totalWords - correctWords}
                </Text>
                <Text className="text-sm text-muted-foreground">Incorrect</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-foreground">{totalWords}</Text>
                <Text className="text-sm text-muted-foreground">Total</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Word Results (if available) */}
        {attempts && attempts.length > 0 && (
          <Card className="mt-4 w-full">
            <CardContent className="py-4">
              <Text className="mb-2 font-semibold text-foreground">Words Practiced:</Text>
              <View className="gap-1">
                {attempts.slice(0, 5).map((attempt) => (
                  <View
                    key={attempt.id}
                    className="flex-row items-center justify-between border-b border-border py-1 last:border-0">
                    <Text className="text-foreground">{attempt.word.word}</Text>
                    {attempt.isCorrect ? (
                      <Star size={16} color={brandColors.colors.mint} fill={brandColors.colors.mint} />
                    ) : (
                      <Text className="text-xs text-red-500">Review</Text>
                    )}
                  </View>
                ))}
                {attempts.length > 5 && (
                  <Text className="text-center text-xs text-muted-foreground">
                    +{attempts.length - 5} more words
                  </Text>
                )}
              </View>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <View className="mt-6 w-full gap-3">
          <Button size="lg" onPress={handlePracticeAgain} className="w-full">
            <RotateCcw size={20} color="white" />
            <Text className="ml-2 text-lg font-semibold text-primary-foreground">
              Practice Again
            </Text>
          </Button>

          <Button
            size="lg"
            variant="outline"
            onPress={handleGoHome}
            className="w-full">
            <Home size={20} color={brandColors.colors.foreground} />
            <Text className="ml-2 text-lg font-semibold text-foreground">Go Home</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
