import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { ModalHeader } from '@/components/ModalHeader';
import { Text } from '@/components/ui/text';
import { DIARY_ENTRIES_QUERY_KEY } from '@/constants/query-keys';
import type { DiaryEntryRecord } from '@/database/diary';
import { getDiaryEntries } from '@/database/diary';
import { useLocalization } from '@/localization/LocalizationProvider';

type GroupedEntry = {
  label: string;
  entries: (DiaryEntryRecord & { date: Date })[];
};

function formatDateLabel(date: Date, t: (key: string) => string): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const entryDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (entryDate.getTime() === today.getTime()) {
    return t('diary.today');
  }
  if (entryDate.getTime() === yesterday.getTime()) {
    return t('diary.yesterday');
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DiaryListScreen() {
  const router = useRouter();
  const { t } = useLocalization();

  const { data: entries = [], isLoading } = useQuery<DiaryEntryRecord[]>({
    queryKey: DIARY_ENTRIES_QUERY_KEY,
    queryFn: () => getDiaryEntries(),
  });

  // Group entries by date
  const groupedEntries = useMemo<GroupedEntry[]>(() => {
    const entriesWithDates = entries.map((entry) => ({
      ...entry,
      date: new Date(entry.createdAt * 1000),
    }));

    // Sort by date descending (newest first)
    entriesWithDates.sort((a, b) => b.date.getTime() - a.date.getTime());

    const groups = new Map<string, (DiaryEntryRecord & { date: Date })[]>();

    entriesWithDates.forEach((entry) => {
      const label = formatDateLabel(entry.date, t);
      if (!groups.has(label)) {
        groups.set(label, []);
      }
      groups.get(label)!.push(entry);
    });

    return Array.from(groups.entries()).map(([label, groupEntries]) => ({
      label,
      entries: groupEntries,
    }));
  }, [entries, t]);

  const handleCreateEntry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(tracking)/diary');
  };

  const handleOpenEntry = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(tracking)/diary?id=${id}`);
  };

  const handleViewPhoto = (photoUri: string, title?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const params = new URLSearchParams({ uri: photoUri });
    if (title) {
      params.set('title', title);
    }
    router.push(`/(tracking)/photo-viewer?${params.toString()}`);
  };

  return (
    <View className="flex-1 bg-background">
      <ModalHeader title={t('diary.listTitle')} closeLabel={t('common.close')} />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">{t('common.loading')}</Text>
        </View>
      ) : entries.length === 0 ? (
        /* Empty State */
        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-accent/10">
            <MaterialCommunityIcons name="book-heart-outline" size={48} color="#7C3AED" />
          </View>
          <Text className="mb-2 text-center text-xl font-bold text-foreground">
            {t('diary.emptyState')}
          </Text>
          <Text className="mb-8 text-center text-base text-muted-foreground">
            {t('diary.emptyStateHint')}
          </Text>
          <Pressable
            onPress={handleCreateEntry}
            className="h-14 w-full flex-row items-center justify-center gap-2 rounded-2xl bg-accent">
            <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
            <Text className="text-lg font-bold text-white">{t('diary.title')}</Text>
          </Pressable>
        </View>
      ) : (
        /* Entries List */
        <ScrollView contentContainerClassName="p-5 pb-24" showsVerticalScrollIndicator={false}>
          {groupedEntries.map((group) => (
            <View key={group.label} className="mb-6">
              {/* Date Header */}
              <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </Text>

              {/* Entries */}
              {group.entries.map((entry) => (
                <Pressable
                  key={entry.id}
                  onPress={() => handleOpenEntry(entry.id)}
                  className="mb-3 overflow-hidden rounded-2xl border border-border bg-card"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}>
                  {/* Photo if available - tappable to view full size */}
                  {entry.photoUri && (
                    <Pressable
                      onPress={() =>
                        handleViewPhoto(entry.photoUri!, entry.title || t('diary.title'))
                      }
                      className="relative">
                      <Image
                        source={{ uri: entry.photoUri }}
                        style={{ width: '100%', aspectRatio: 4 / 3 }}
                        contentFit="cover"
                        transition={200}
                      />
                      {/* Zoom hint icon */}
                      <View className="absolute bottom-2 right-2 rounded-full bg-black/40 p-1.5">
                        <MaterialCommunityIcons
                          name="magnify-plus-outline"
                          size={16}
                          color="#FFF"
                        />
                      </View>
                    </Pressable>
                  )}

                  <View className="p-4">
                    {/* Title and Time */}
                    <View className="mb-2 flex-row items-center justify-between">
                      <Text
                        className="flex-1 text-base font-semibold text-foreground"
                        numberOfLines={1}>
                        {entry.title || t('diary.title')}
                      </Text>
                      <Text className="text-sm text-muted-foreground">
                        {entry.date.toLocaleTimeString(undefined, {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>

                    {/* Content Preview */}
                    {entry.content && (
                      <Text className="text-sm leading-5 text-muted-foreground" numberOfLines={2}>
                        {entry.content}
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      {/* FAB - Add New Entry */}
      {entries.length > 0 && (
        <Pressable
          onPress={handleCreateEntry}
          className="absolute bottom-8 right-5 h-14 w-14 items-center justify-center rounded-full bg-accent"
          style={{
            shadowColor: '#7C3AED',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}>
          <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
        </Pressable>
      )}
    </View>
  );
}
