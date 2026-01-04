import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { BookOpen, Search } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { WORDS_QUERY_KEY, WORD_COUNT_QUERY_KEY } from '@/constants/query-keys';
import { searchWords, getRecentWords, getWordCount } from '@/database/words';
import { useBrandColor } from '@/hooks/use-brand-color';
import type { Word } from '@/db/schema';

export default function WordsScreen() {
  const router = useRouter();
  const brandColors = useBrandColor();
  const [searchQuery, setSearchQuery] = useState('');

  // Get word count
  const { data: totalWords = 0 } = useQuery({
    queryKey: WORD_COUNT_QUERY_KEY,
    queryFn: getWordCount,
  });

  // Search or get recent words
  const { data: words = [], isLoading } = useQuery({
    queryKey: [...WORDS_QUERY_KEY, searchQuery],
    queryFn: () => (searchQuery.length > 0 ? searchWords(searchQuery, 50) : getRecentWords(50)),
  });

  const handleWordPress = (word: Word) => {
    router.push(`/(word)/${word.id}`);
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

  const renderWordItem = ({ item }: { item: Word }) => (
    <Pressable onPress={() => handleWordPress(item)}>
      <Card className="mb-2">
        <CardContent className="py-3">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-2">
              <Text className="text-lg font-semibold text-foreground">{item.word}</Text>
              {item.partOfSpeech && (
                <Text className="text-xs italic text-muted-foreground">{item.partOfSpeech}</Text>
              )}
              <Text className="mt-1 text-sm text-muted-foreground" numberOfLines={2}>
                {item.definition}
              </Text>
            </View>
            <Badge className={getDifficultyColor(item.difficulty)}>
              <Text className="text-xs">{getDifficultyLabel(item.difficulty)}</Text>
            </Badge>
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-4">
        {/* Header */}
        <View className="py-4">
          <Text className="text-2xl font-bold text-foreground">Word Library</Text>
          <Text className="text-muted-foreground">
            {totalWords} {totalWords === 1 ? 'word' : 'words'} in your collection
          </Text>
        </View>

        {/* Search */}
        <View className="mb-4 flex-row items-center gap-2 rounded-lg border border-border bg-card px-3">
          <Search size={20} color={brandColors.colors.mutedForeground} />
          <Input
            className="flex-1 border-0 bg-transparent"
            placeholder="Search words..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Word List */}
        {totalWords === 0 ? (
          <View className="flex-1 items-center justify-center">
            <BookOpen size={64} color={brandColors.colors.mutedForeground} />
            <Text className="mt-4 text-center text-lg font-medium text-muted-foreground">
              No words yet
            </Text>
            <Text className="mt-2 text-center text-muted-foreground">
              Add words to your collection to start learning!
            </Text>
          </View>
        ) : (
          <FlatList
            data={words}
            renderItem={renderWordItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <View className="items-center py-8">
                <Text className="text-muted-foreground">
                  {searchQuery ? 'No words found' : 'Loading...'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
