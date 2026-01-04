import { useQuery } from '@tanstack/react-query';
import { Award, BookCheck, Calendar, TrendingUp } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { USER_STATS_QUERY_KEY, RECENT_SESSIONS_QUERY_KEY } from '@/constants/query-keys';
import { getActiveUserProfile } from '@/database/user-profile';
import { getCardCountsByState } from '@/database/card-progress';
import {
  getUserStats,
  getWeeklyProgress,
  getXPProgress,
  getStreakInfo,
} from '@/database/user-stats';
import { getRecentSessions } from '@/database/quiz-sessions';
import { useBrandColor } from '@/hooks/use-brand-color';

export default function ProgressScreen() {
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

  // Get card counts by state
  const { data: cardCounts } = useQuery({
    queryKey: ['cardCounts', userId],
    queryFn: () => (userId ? getCardCountsByState(userId) : null),
    enabled: !!userId,
  });

  // Get weekly progress
  const { data: weeklyProgress } = useQuery({
    queryKey: ['weeklyProgress', userId],
    queryFn: () => (userId ? getWeeklyProgress(userId) : []),
    enabled: !!userId,
  });

  // Get recent sessions
  const { data: recentSessions } = useQuery({
    queryKey: RECENT_SESSIONS_QUERY_KEY,
    queryFn: () => (userId ? getRecentSessions(userId, 5) : []),
    enabled: !!userId,
  });

  const xpProgress = stats ? getXPProgress(stats) : { current: 0, needed: 100, percentage: 0 };
  const accuracy =
    stats && stats.totalAttempts > 0
      ? Math.round((stats.totalCorrect / stats.totalAttempts) * 100)
      : 0;

  const totalCards =
    (cardCounts?.new ?? 0) +
    (cardCounts?.learning ?? 0) +
    (cardCounts?.review ?? 0) +
    (cardCounts?.relearning ?? 0);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-4"
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="py-2">
          <Text className="text-2xl font-bold text-foreground">Your Progress</Text>
          <Text className="text-muted-foreground">Track your learning journey</Text>
        </View>

        {/* Level & XP Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Award size={24} color={brandColors.colors.primary} />
                <Text className="text-lg font-semibold text-foreground">
                  Level {stats?.level ?? 1}
                </Text>
              </View>
              <Text className="text-muted-foreground">
                {xpProgress.current} / {xpProgress.needed} XP
              </Text>
            </View>
            <Progress value={xpProgress.percentage} className="h-3" />
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <View className="flex-row gap-3">
          <Card className="flex-1">
            <CardContent className="items-center py-4">
              <Text className="text-2xl font-bold text-foreground">
                {streakInfo?.currentStreak ?? 0}
              </Text>
              <Text className="text-xs text-muted-foreground">Current Streak</Text>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="items-center py-4">
              <Text className="text-2xl font-bold text-foreground">
                {streakInfo?.longestStreak ?? 0}
              </Text>
              <Text className="text-xs text-muted-foreground">Best Streak</Text>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="items-center py-4">
              <Text className="text-2xl font-bold text-foreground">{accuracy}%</Text>
              <Text className="text-xs text-muted-foreground">Accuracy</Text>
            </CardContent>
          </Card>
        </View>

        {/* Learning Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex-row items-center gap-2">
              <BookCheck size={20} color={brandColors.colors.foreground} />
              <Text className="text-lg font-semibold">Learning Progress</Text>
            </CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-muted-foreground">Words Learned</Text>
              <Text className="font-semibold text-foreground">{stats?.totalWordsLearned ?? 0}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-muted-foreground">In Learning</Text>
              <Text className="font-semibold text-foreground">
                {(cardCounts?.learning ?? 0) + (cardCounts?.relearning ?? 0)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-muted-foreground">Mastered (Review)</Text>
              <Text className="font-semibold text-foreground">{cardCounts?.review ?? 0}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-muted-foreground">Total Cards</Text>
              <Text className="font-semibold text-foreground">{totalCards}</Text>
            </View>
          </CardContent>
        </Card>

        {/* Weekly Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex-row items-center gap-2">
              <Calendar size={20} color={brandColors.colors.foreground} />
              <Text className="text-lg font-semibold">This Week</Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex-row justify-between">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
                const dayProgress = weeklyProgress?.find((p) => {
                  const date = new Date(p.date * 1000);
                  return date.getDay() === index;
                });
                const hasActivity = (dayProgress?.wordsReviewed ?? 0) > 0;

                return (
                  <View key={day + index} className="items-center gap-1">
                    <View
                      className={`h-8 w-8 items-center justify-center rounded-full ${
                        hasActivity ? 'bg-primary' : 'bg-muted'
                      }`}>
                      <Text
                        className={`text-xs font-medium ${
                          hasActivity ? 'text-primary-foreground' : 'text-muted-foreground'
                        }`}>
                        {dayProgress?.wordsReviewed ?? 0}
                      </Text>
                    </View>
                    <Text className="text-xs text-muted-foreground">{day}</Text>
                  </View>
                );
              })}
            </View>
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex-row items-center gap-2">
              <TrendingUp size={20} color={brandColors.colors.foreground} />
              <Text className="text-lg font-semibold">Recent Sessions</Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSessions && recentSessions.length > 0 ? (
              <View className="gap-2">
                {recentSessions.map((session) => {
                  const sessionAccuracy =
                    session.wordsAttempted > 0
                      ? Math.round((session.wordsCorrect / session.wordsAttempted) * 100)
                      : 0;
                  const date = new Date(session.startedAt * 1000);

                  return (
                    <View
                      key={session.id}
                      className="flex-row items-center justify-between border-b border-border py-2 last:border-0">
                      <View>
                        <Text className="text-sm font-medium text-foreground">
                          {session.wordsCorrect}/{session.wordsAttempted} words
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                          {date.toLocaleDateString()}
                        </Text>
                      </View>
                      <Text
                        className={`text-sm font-semibold ${
                          sessionAccuracy >= 80
                            ? 'text-green-600'
                            : sessionAccuracy >= 50
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        }`}>
                        {sessionAccuracy}%
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text className="text-center text-muted-foreground">
                No practice sessions yet. Start practicing to see your progress!
              </Text>
            )}
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
