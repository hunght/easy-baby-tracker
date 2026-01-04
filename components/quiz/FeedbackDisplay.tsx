import { Check, X, AlertTriangle, Lightbulb } from 'lucide-react-native';
import { View } from 'react-native';

import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useBrandColor } from '@/hooks/use-brand-color';
import { generateDiff, analyzeError, type ErrorType, type DiffSegment } from '@/lib/fsrs';

interface FeedbackDisplayProps {
  userInput: string;
  targetWord: string;
  isCorrect: boolean;
  errorType: ErrorType;
  etymology?: string | null;
  showEtymology?: boolean;
}

export function FeedbackDisplay({
  userInput,
  targetWord,
  isCorrect,
  errorType,
  etymology,
  showEtymology = true,
}: FeedbackDisplayProps) {
  const brandColors = useBrandColor();
  const errorAnalysis = analyzeError(userInput, targetWord);
  const diffSegments = !isCorrect ? generateDiff(userInput, targetWord) : [];

  const getIconAndColor = () => {
    if (isCorrect) {
      return {
        icon: <Check size={32} color="white" />,
        bgColor: 'bg-green-500',
        textColor: 'text-green-600 dark:text-green-400',
        borderColor: 'border-green-500',
      };
    }

    switch (errorType) {
      case 'typo':
        return {
          icon: <AlertTriangle size={32} color="white" />,
          bgColor: 'bg-yellow-500',
          textColor: 'text-yellow-600 dark:text-yellow-400',
          borderColor: 'border-yellow-500',
        };
      case 'phonetic':
        return {
          icon: <Lightbulb size={32} color="white" />,
          bgColor: 'bg-orange-500',
          textColor: 'text-orange-600 dark:text-orange-400',
          borderColor: 'border-orange-500',
        };
      default:
        return {
          icon: <X size={32} color="white" />,
          bgColor: 'bg-red-500',
          textColor: 'text-red-600 dark:text-red-400',
          borderColor: 'border-red-500',
        };
    }
  };

  const { icon, bgColor, textColor, borderColor } = getIconAndColor();

  const renderDiffSegment = (segment: DiffSegment, index: number) => {
    let className = 'text-2xl font-bold ';

    switch (segment.type) {
      case 'correct':
        className += 'text-green-600 dark:text-green-400';
        break;
      case 'wrong':
        className += 'text-red-600 dark:text-red-400 line-through';
        break;
      case 'missing':
        className += 'text-blue-600 dark:text-blue-400 underline';
        break;
      case 'extra':
        className += 'text-orange-600 dark:text-orange-400 line-through';
        break;
    }

    return (
      <Text key={index} className={className}>
        {segment.text}
      </Text>
    );
  };

  return (
    <Card className={`border-2 ${borderColor}`}>
      <CardContent className="items-center gap-4 py-6">
        {/* Icon */}
        <View className={`rounded-full p-3 ${bgColor}`}>{icon}</View>

        {/* Title */}
        <Text className={`text-xl font-bold ${textColor}`}>
          {isCorrect ? 'Correct!' : errorAnalysis.description}
        </Text>

        {/* Correct Answer */}
        <View className="items-center">
          <Text className="text-sm text-muted-foreground">Correct spelling:</Text>
          <Text className="text-2xl font-bold text-foreground">{targetWord}</Text>
        </View>

        {/* Diff visualization (only for incorrect) */}
        {!isCorrect && diffSegments.length > 0 && (
          <View className="items-center">
            <Text className="mb-1 text-sm text-muted-foreground">Your answer:</Text>
            <View className="flex-row flex-wrap justify-center">
              {diffSegments.map(renderDiffSegment)}
            </View>
          </View>
        )}

        {/* Suggestions */}
        {!isCorrect && errorAnalysis.suggestions.length > 0 && (
          <View className="mt-2 w-full rounded-lg bg-muted/50 p-3">
            <Text className="mb-1 text-xs font-medium text-muted-foreground">Tips:</Text>
            {errorAnalysis.suggestions.map((suggestion, index) => (
              <Text key={index} className="text-sm text-foreground">
                • {suggestion}
              </Text>
            ))}
          </View>
        )}

        {/* Etymology (for learning) */}
        {showEtymology && etymology && (
          <View className="mt-2 w-full rounded-lg bg-primary/10 p-3">
            <Text className="mb-1 text-xs font-medium text-primary">Etymology:</Text>
            <Text className="text-sm text-foreground">{etymology}</Text>
          </View>
        )}
      </CardContent>
    </Card>
  );
}
