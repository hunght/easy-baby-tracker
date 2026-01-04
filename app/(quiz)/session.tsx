import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuizCard } from '@/components/quiz';
import { Progress } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import {
  DUE_CARDS_QUERY_KEY,
  NEW_CARDS_QUERY_KEY,
  USER_STATS_QUERY_KEY,
  DAILY_PROGRESS_QUERY_KEY,
} from '@/constants/query-keys';
import {
  getDueCards,
  getNewCards,
  getOrCreateCardProgress,
  updateCardAfterReview,
  type CardProgressWithWord,
} from '@/database/card-progress';
import { createQuizSession, recordQuizAttempt, endQuizSession } from '@/database/quiz-sessions';
import { getActiveUserProfile } from '@/database/user-profile';
import {
  updateStreak,
  recordCorrectAnswer,
  recordIncorrectAnswer,
  recordWordLearned,
  updateDailyProgress,
  incrementQuizCount,
} from '@/database/user-stats';
import { useBrandColor } from '@/hooks/use-brand-color';
import { type LevenshteinResult } from '@/lib/fsrs';
import type { Word } from '@/db/schema';

const WORDS_PER_SESSION = 10;

interface SessionWord {
  word: Word;
  cardProgressId: number;
  isNew: boolean;
}

export default function QuizSessionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const brandColors = useBrandColor();

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [words, setWords] = useState<SessionWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Get active user profile
  const { data: profile } = useQuery({
    queryKey: ['activeUserProfile'],
    queryFn: getActiveUserProfile,
  });

  const userId = profile?.id;

  // Initialize session
  useEffect(() => {
    if (!userId) return;

    const initSession = async () => {
      try {
        setIsLoading(true);

        // Create session
        const session = await createQuizSession(userId, 'practice');
        setSessionId(session.id);

        // Get due cards first
        const dueCards = await getDueCards(userId, WORDS_PER_SESSION);
        const sessionWords: SessionWord[] = dueCards.map((card) => ({
          word: card.word,
          cardProgressId: card.id,
          isNew: false,
        }));

        // If we need more words, get new ones
        const remainingSlots = WORDS_PER_SESSION - sessionWords.length;
        if (remainingSlots > 0) {
          const newWords = await getNewCards(userId, remainingSlots);
          for (const word of newWords) {
            const cardProgress = await getOrCreateCardProgress(userId, word.id);
            sessionWords.push({
              word,
              cardProgressId: cardProgress.id,
              isNew: true,
            });
          }
        }

        // Shuffle words
        const shuffled = sessionWords.sort(() => Math.random() - 0.5);
        setWords(shuffled);

        // Update streak
        await updateStreak(userId);
      } catch (error) {
        console.error('Failed to initialize session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, [userId]);

  // Handle answer submission
  const handleAnswer = useCallback(
    async (result: {
      userInput: string;
      isCorrect: boolean;
      levenshteinResult: LevenshteinResult;
      responseTimeMs: number;
    }) => {
      if (!userId || !sessionId || currentIndex >= words.length) return;

      const currentWord = words[currentIndex];

      try {
        // Record the attempt
        await recordQuizAttempt({
          sessionId,
          cardProgressId: currentWord.cardProgressId,
          wordId: currentWord.word.id,
          userInput: result.userInput,
          isCorrect: result.isCorrect ? 1 : 0,
          levenshteinDistance: result.levenshteinResult.distance,
          normalizedError: result.levenshteinResult.normalizedError,
          fsrsRating: result.levenshteinResult.rating,
          responseTimeMs: result.responseTimeMs,
        });

        // Update card progress with FSRS
        await updateCardAfterReview(
          currentWord.cardProgressId,
          result.levenshteinResult.rating,
          result.levenshteinResult.distance,
          result.isCorrect
        );

        // Update stats
        if (result.isCorrect) {
          await recordCorrectAnswer(userId);
          setCorrectCount((prev) => prev + 1);

          // If this was a new word and answered correctly, count as learned
          if (currentWord.isNew) {
            await recordWordLearned(userId);
          }
        } else {
          await recordIncorrectAnswer(userId);
        }

        // Update daily progress
        await updateDailyProgress(userId, {
          wordsReviewed: 1,
          wordsLearned: currentWord.isNew && result.isCorrect ? 1 : 0,
        });
      } catch (error) {
        console.error('Failed to record answer:', error);
      }
    },
    [userId, sessionId, currentIndex, words]
  );

  // Handle continue to next word
  const handleContinue = useCallback(async () => {
    if (currentIndex >= words.length - 1) {
      // End of session
      if (sessionId && userId) {
        await endQuizSession(sessionId, {
          wordsAttempted: words.length,
          wordsCorrect: correctCount,
          accuracy: Math.round((correctCount / words.length) * 100),
          totalResponseTimeMs: 0,
          averageResponseTimeMs: 0,
        });
        await incrementQuizCount(userId);

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: USER_STATS_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: DAILY_PROGRESS_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: DUE_CARDS_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: NEW_CARDS_QUERY_KEY });
      }

      // Navigate to results
      router.replace({
        pathname: '/(quiz)/result',
        params: {
          total: words.length.toString(),
          correct: correctCount.toString(),
          sessionId: sessionId?.toString() ?? '',
        },
      });
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, words.length, sessionId, userId, correctCount, queryClient, router]);

  // Handle close/exit
  const handleClose = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={brandColors.colors.primary} />
        <Text className="mt-4 text-muted-foreground">Loading words...</Text>
      </SafeAreaView>
    );
  }

  if (words.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-4">
        <Text className="text-center text-lg text-muted-foreground">
          No words available for practice.
        </Text>
        <Text className="mt-2 text-center text-muted-foreground">
          Add some words to your collection first!
        </Text>
        <Pressable
          onPress={handleClose}
          className="mt-6 rounded-lg bg-primary px-6 py-3">
          <Text className="font-semibold text-primary-foreground">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-4">
        {/* Header */}
        <View className="flex-row items-center justify-between py-4">
          <Pressable onPress={handleClose} className="rounded-full p-2 active:bg-muted">
            <X size={24} color={brandColors.colors.foreground} />
          </Pressable>

          <View className="flex-1 px-4">
            <Progress value={progress} className="h-2" />
          </View>

          <Text className="text-sm font-medium text-muted-foreground">
            {currentIndex + 1}/{words.length}
          </Text>
        </View>

        {/* Quiz Card */}
        <View className="flex-1 justify-center">
          <QuizCard
            key={currentWord.word.id}
            word={currentWord.word}
            onAnswer={handleAnswer}
            onContinue={handleContinue}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
