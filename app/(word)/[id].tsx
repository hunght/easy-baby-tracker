import { useQuery } from '@tanstack/react-query';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Volume2, BookOpen, History, Brain } from 'lucide-react-native';
import { ScrollView, View, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { wordByIdKey } from '@/constants/query-keys';
import { getWordById } from '@/database/words';
import { getCardProgress } from '@/database/card-progress';
import { getActiveUserProfile } from '@/database/user-profile';
import { useBrandColor } from '@/hooks/use-brand-color';
import { useAudioPlayer, getTextToSpeechUrl } from '@/hooks/use-audio-player';
import { formatInterval, State } from '@/lib/fsrs';

export default function WordDetailScreen() {
  const router = useRouter();
  const brandColors = useBrandColor();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status: audioStatus, playAudio } = useAudioPlayer();

  const wordId = parseInt(id ?? '0', 10);

  // Get word
  const { data: word, isLoading: wordLoading } = useQuery({
    queryKey: wordByIdKey(wordId),
    queryFn: () => getWordById(wordId),
    enabled: !!wordId,
  });

  // Get user profile
  const { data: profile } = useQuery({
    queryKey: ['activeUserProfile'],
    queryFn: getActiveUserProfile,
  });

  // Get card progress
  const { data: cardProgress } = useQuery({
    queryKey: ['cardProgress', profile?.id, wordId],
    queryFn: () => (profile?.id ? getCardProgress(profile.id, wordId) : null),
    enabled: !!profile?.id && !!wordId,
  });

  const handleClose = () => {
    router.back();
  };

  const handlePlayAudio = () => {
    if (!word) return;
    const audioUrl = word.audioUrl || getTextToSpeechUrl(word.word);
    playAudio(audioUrl);
  };

  const getDifficultyLabel = (difficulty: number): string => {
    if (difficulty < 800) return 'Easy';
    if (difficulty < 1200) return 'Medium';
    return 'Hard';
  };

  const getDifficultyColor = (difficulty: number): string => {
    if (difficulty < 800) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    if (difficulty < 1200) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  };

  const getStateLabel = (state: number): string => {
    switch (state) {
      case State.New:
        return 'New';
      case State.Learning:
        return 'Learning';
      case State.Review:
        return 'Review';
      case State.Relearning:
        return 'Relearning';
      default:
        return 'Unknown';
    }
  };

  if (wordLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={brandColors.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!word) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Word not found</Text>
        <Pressable onPress={handleClose} className="mt-4">
          <Text className="text-primary">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const accuracy =
    cardProgress && cardProgress.totalAttempts > 0
      ? Math.round((cardProgress.correctAttempts / cardProgress.totalAttempts) * 100)
      : null;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable onPress={handleClose} className="rounded-full p-2 active:bg-muted">
          <X size={24} color={brandColors.colors.foreground} />
        </Pressable>
        <Badge className={getDifficultyColor(word.difficulty)}>
          <Text className="text-xs">{getDifficultyLabel(word.difficulty)}</Text>
        </Badge>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-4"
        showsVerticalScrollIndicator={false}>
        {/* Word Header */}
        <View className="items-center py-4">
          <Text className="text-4xl font-bold text-foreground">{word.word}</Text>
          {word.pronunciation && (
            <Text className="mt-1 text-lg text-muted-foreground">{word.pronunciation}</Text>
          )}
          {word.partOfSpeech && (
            <Text className="mt-1 italic text-muted-foreground">{word.partOfSpeech}</Text>
          )}

          {/* Audio Button */}
          <Pressable
            onPress={handlePlayAudio}
            disabled={audioStatus === 'loading'}
            className={`mt-4 flex-row items-center gap-2 rounded-full px-4 py-2 ${
              audioStatus === 'playing' ? 'bg-primary/20' : 'bg-primary/10'
            }`}>
            {audioStatus === 'loading' ? (
              <ActivityIndicator size={20} color={brandColors.colors.primary} />
            ) : (
              <Volume2 size={20} color={brandColors.colors.primary} />
            )}
            <Text className="text-primary">
              {audioStatus === 'loading'
                ? 'Loading...'
                : audioStatus === 'playing'
                  ? 'Playing...'
                  : 'Play pronunciation'}
            </Text>
          </Pressable>
        </View>

        {/* Definition */}
        <Card>
          <CardHeader>
            <CardTitle className="flex-row items-center gap-2">
              <BookOpen size={20} color={brandColors.colors.foreground} />
              <Text className="text-lg font-semibold">Definition</Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="text-foreground">{word.definition}</Text>
            {word.exampleSentence && (
              <View className="mt-3 rounded-lg bg-muted/50 p-3">
                <Text className="text-sm italic text-muted-foreground">
                  "{word.exampleSentence}"
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Etymology */}
        {word.etymology && (
          <Card>
            <CardHeader>
              <CardTitle className="flex-row items-center gap-2">
                <History size={20} color={brandColors.colors.foreground} />
                <Text className="text-lg font-semibold">Etymology</Text>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="text-foreground">{word.etymology}</Text>
            </CardContent>
          </Card>
        )}

        {/* Learning Progress */}
        {cardProgress && (
          <Card>
            <CardHeader>
              <CardTitle className="flex-row items-center gap-2">
                <Brain size={20} color={brandColors.colors.foreground} />
                <Text className="text-lg font-semibold">Your Progress</Text>
              </CardTitle>
            </CardHeader>
            <CardContent className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-muted-foreground">Status</Text>
                <Badge variant="outline">
                  <Text className="text-xs">{getStateLabel(cardProgress.state)}</Text>
                </Badge>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-muted-foreground">Reviews</Text>
                <Text className="font-medium text-foreground">{cardProgress.reps}</Text>
              </View>
              {accuracy !== null && (
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted-foreground">Accuracy</Text>
                  <Text className="font-medium text-foreground">{accuracy}%</Text>
                </View>
              )}
              {cardProgress.stability > 0 && (
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted-foreground">Memory Stability</Text>
                  <Text className="font-medium text-foreground">
                    {formatInterval(cardProgress.stability)}
                  </Text>
                </View>
              )}
              {cardProgress.scheduledDays > 0 && (
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted-foreground">Next Review</Text>
                  <Text className="font-medium text-foreground">
                    in {formatInterval(cardProgress.scheduledDays)}
                  </Text>
                </View>
              )}
            </CardContent>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
