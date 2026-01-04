import { Volume2, Eye, EyeOff, HelpCircle, Loader2 } from 'lucide-react-native';
import { useState, useRef, useEffect } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { SpellingInput, type SpellingInputRef } from './SpellingInput';
import { FeedbackDisplay } from './FeedbackDisplay';
import { useBrandColor } from '@/hooks/use-brand-color';
import { useAudioPlayer, getTextToSpeechUrl } from '@/hooks/use-audio-player';
import { levenshteinToRating, type LevenshteinResult } from '@/lib/fsrs';
import type { Word } from '@/db/schema';

interface QuizCardProps {
  word: Word;
  onAnswer: (result: {
    userInput: string;
    isCorrect: boolean;
    levenshteinResult: LevenshteinResult;
    responseTimeMs: number;
  }) => void;
  onContinue: () => void;
}

type QuizState = 'input' | 'feedback';

export function QuizCard({ word, onAnswer, onContinue }: QuizCardProps) {
  const brandColors = useBrandColor();
  const inputRef = useRef<SpellingInputRef>(null);
  const { status: audioStatus, playAudio, error: audioError } = useAudioPlayer();

  const [state, setState] = useState<QuizState>('input');
  const [userInput, setUserInput] = useState('');
  const [showDefinition, setShowDefinition] = useState(false);
  const [showFirstLetter, setShowFirstLetter] = useState(false);
  const [levenshteinResult, setLevenshteinResult] = useState<LevenshteinResult | null>(null);
  const [startTime] = useState(Date.now());

  // Reset state when word changes
  useEffect(() => {
    setState('input');
    setUserInput('');
    setShowDefinition(false);
    setShowFirstLetter(false);
    setLevenshteinResult(null);
    inputRef.current?.clear();
    inputRef.current?.focus();
  }, [word.id]);

  const handleSubmit = () => {
    if (!userInput.trim()) return;

    const responseTimeMs = Date.now() - startTime;
    const result = levenshteinToRating(userInput.trim(), word.word);

    setLevenshteinResult(result);
    setState('feedback');

    onAnswer({
      userInput: userInput.trim(),
      isCorrect: result.isCorrect,
      levenshteinResult: result,
      responseTimeMs,
    });
  };

  const handleContinue = () => {
    onContinue();
  };

  const handlePlayAudio = () => {
    // Use audioUrl from word if available, otherwise use TTS
    const audioUrl = word.audioUrl || getTextToSpeechUrl(word.word);
    playAudio(audioUrl);
  };

  // Auto-play audio when word changes
  useEffect(() => {
    handlePlayAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.id]);

  if (state === 'feedback' && levenshteinResult) {
    return (
      <View className="gap-4">
        <FeedbackDisplay
          userInput={userInput}
          targetWord={word.word}
          isCorrect={levenshteinResult.isCorrect}
          errorType={levenshteinResult.errorType}
          etymology={word.etymology}
        />

        <Button size="lg" onPress={handleContinue} className="w-full">
          <Text className="text-lg font-semibold text-primary-foreground">Continue</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="gap-4">
      {/* Word Info Card */}
      <Card>
        <CardContent className="items-center gap-4 py-6">
          {/* Audio Button */}
          <Pressable
            onPress={handlePlayAudio}
            disabled={audioStatus === 'loading'}
            className={`rounded-full p-6 active:opacity-80 ${
              audioStatus === 'playing' ? 'bg-primary/80' : 'bg-primary'
            }`}>
            {audioStatus === 'loading' ? (
              <ActivityIndicator size={48} color="white" />
            ) : (
              <Volume2 size={48} color="white" />
            )}
          </Pressable>

          <Text className="text-center text-muted-foreground">
            {audioStatus === 'loading'
              ? 'Loading...'
              : audioStatus === 'playing'
                ? 'Playing...'
                : 'Tap to hear the word'}
          </Text>

          {audioError && (
            <Text className="text-center text-xs text-destructive">
              Audio unavailable
            </Text>
          )}

          {/* Part of Speech */}
          {word.partOfSpeech && (
            <Text className="text-sm italic text-muted-foreground">
              ({word.partOfSpeech})
            </Text>
          )}

          {/* Definition Toggle */}
          <Pressable
            onPress={() => setShowDefinition(!showDefinition)}
            className="flex-row items-center gap-2 rounded-lg bg-muted/50 px-4 py-2">
            {showDefinition ? (
              <EyeOff size={18} color={brandColors.colors.mutedForeground} />
            ) : (
              <Eye size={18} color={brandColors.colors.mutedForeground} />
            )}
            <Text className="text-sm text-muted-foreground">
              {showDefinition ? 'Hide' : 'Show'} definition
            </Text>
          </Pressable>

          {/* Definition */}
          {showDefinition && (
            <View className="w-full rounded-lg bg-muted/30 p-3">
              <Text className="text-center text-foreground">{word.definition}</Text>
            </View>
          )}

          {/* First Letter Hint */}
          {showFirstLetter && (
            <View className="rounded-lg bg-primary/10 px-4 py-2">
              <Text className="text-lg font-semibold text-primary">
                Starts with: {word.word[0].toUpperCase()}
              </Text>
            </View>
          )}

          {/* Hint Button */}
          {!showFirstLetter && (
            <Pressable
              onPress={() => setShowFirstLetter(true)}
              className="flex-row items-center gap-1 opacity-60">
              <HelpCircle size={14} color={brandColors.colors.mutedForeground} />
              <Text className="text-xs text-muted-foreground">Need a hint?</Text>
            </Pressable>
          )}
        </CardContent>
      </Card>

      {/* Input */}
      <SpellingInput
        ref={inputRef}
        value={userInput}
        onChangeText={setUserInput}
        onSubmit={handleSubmit}
      />

      {/* Submit Button */}
      <Button
        size="lg"
        onPress={handleSubmit}
        disabled={!userInput.trim()}
        className="w-full">
        <Text className="text-lg font-semibold text-primary-foreground">Check Spelling</Text>
      </Button>
    </View>
  );
}
