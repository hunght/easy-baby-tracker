import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Flame, Play, Target, Zap } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import {
  DUE_CARDS_QUERY_KEY,
  USER_STATS_QUERY_KEY,
  DAILY_PROGRESS_QUERY_KEY,
  WORD_COUNT_QUERY_KEY,
} from '@/constants/query-keys';
import { getDueCardCount } from '@/database/card-progress';
import { getActiveUserProfile } from '@/database/user-profile';
import { getUserStats, getOrCreateTodayProgress, getStreakInfo } from '@/database/user-stats';
import { getWordCount } from '@/database/words';
import { useBrandColor } from '@/hooks/use-brand-color';

export default function QuizScreen() {
  const router = useRouter();
  const brandColors = useBrandColor();

  // Get active user profile
  const { data: profile } = useQuery({
    queryKey: ['activeUserProfile'],
    queryFn: getActiveUserProfile,
  });

  const userId = profile?.id;

  // Get user stats
  const { data: stats } = useQuery({
    queryKey: USER_STATS_QUERY_KEY,
    queryFn: () => (userId ? getUserStats(userId) : null),
    enabled: !!userId,
  });

  // Get streak info
  const { data: streakInfo } = useQuery({
    queryKey: ['streakInfo', userId],
    queryFn: () => (userId ? getStreakInfo(userId) : null),
    enabled: !!userId,
  });

  // Get daily progress
  const { data: dailyProgress } = useQuery({
    queryKey: DAILY_PROGRESS_QUERY_KEY,
    queryFn: () => (userId ? getOrCreateTodayProgress(userId) : null),
    enabled: !!userId,
  });

  // Get due cards count
  const { data: dueCount = 0 } = useQuery({
    queryKey: [...DUE_CARDS_QUERY_KEY, userId],
    queryFn: () => (userId ? getDueCardCount(userId) : 0),
    enabled: !!userId,
  });

  // Get total word count
  const { data: totalWords = 0 } = useQuery({
    queryKey: WORD_COUNT_QUERY_KEY,
    queryFn: getWordCount,
  });

  const handleStartPractice = () => {
    router.push('/(quiz)/session');
  };

  const currentStreak = streakInfo?.isStreakActive ? streakInfo.currentStreak : 0;
  const wordsToday = dailyProgress?.wordsReviewed ?? 0;
  const dailyGoal = 10; // TODO: Get from user settings

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-4"
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="items-center py-4">
          <Text className="text-3xl font-bold text-foreground">Spelling Bee</Text>
          <Text className="text-muted-foreground">Master your vocabulary</Text>
        </View>

        {/* Stats Cards */}
        <View className="flex-row gap-3">
          {/* Streak Card */}
          <Card className="flex-1">
            <CardContent className="items-center py-4">
              <View className="mb-2 rounded-full bg-orange-100 p-2 dark:bg-orange-900/30">
                <Flame size={24} color={brandColors.colors.accent} />
              </View>
              <Text className="text-2xl font-bold text-foreground">{currentStreak}</Text>
              <Text className="text-xs text-muted-foreground">Day Streak</Text>
            </CardContent>
          </Card>

          {/* Today's Progress Card */}
          <Card className="flex-1">
            <CardContent className="items-center py-4">
              <View className="mb-2 rounded-full bg-green-100 p-2 dark:bg-green-900/30">
                <Target size={24} color={brandColors.colors.mint} />
              </View>
              <Text className="text-2xl font-bold text-foreground">
                {wordsToday}/{dailyGoal}
              </Text>
              <Text className="text-xs text-muted-foreground">Today</Text>
            </CardContent>
          </Card>

          {/* Level Card */}
          <Card className="flex-1">
            <CardContent className="items-center py-4">
              <View className="mb-2 rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
                <Zap size={24} color={brandColors.colors.lavender} />
              </View>
              <Text className="text-2xl font-bold text-foreground">{stats?.level ?? 1}</Text>
              <Text className="text-xs text-muted-foreground">Level</Text>
            </CardContent>
          </Card>
        </View>

        {/* Practice Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-center">Ready to Practice?</CardTitle>
          </CardHeader>
          <CardContent className="gap-4">
            {dueCount > 0 ? (
              <Text className="text-center text-muted-foreground">
                You have <Text className="font-bold text-primary">{dueCount} words</Text> ready for
                review
              </Text>
            ) : totalWords > 0 ? (
              <Text className="text-center text-muted-foreground">
                Learn new words from your collection of{' '}
                <Text className="font-bold text-primary">{totalWords} words</Text>
              </Text>
            ) : (
              <Text className="text-center text-muted-foreground">
                Add some words to your collection to start practicing!
              </Text>
            )}

            <Button
              size="lg"
              className="w-full"
              onPress={handleStartPractice}
              disabled={totalWords === 0}>
              <Play size={20} color="white" />
              <Text className="ml-2 text-lg font-semibold text-primary-foreground">
                Start Practice
              </Text>
            </Button>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-muted-foreground">Words Learned</Text>
                <Text className="font-semibold text-foreground">
                  {stats?.totalWordsLearned ?? 0}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-muted-foreground">Total Quizzes</Text>
                <Text className="font-semibold text-foreground">{stats?.totalQuizzes ?? 0}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-muted-foreground">Accuracy</Text>
                <Text className="font-semibold text-foreground">
                  {stats && stats.totalAttempts > 0
                    ? Math.round((stats.totalCorrect / stats.totalAttempts) * 100)
                    : 0}
                  %
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-muted-foreground">XP Points</Text>
                <Text className="font-semibold text-foreground">{stats?.xpPoints ?? 0}</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
