import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { TabPageHeader } from '@/components/TabPageHeader';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useLocalization } from '@/localization/LocalizationProvider';

export default function HabitScreen() {
  const { t } = useLocalization();
  const [isComingSoon] = useState(true);

  return (
    <View className="flex-1 bg-background">
      <TabPageHeader title={t('tracking.tiles.habit.label')} />
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-10 pt-6 gap-4">
        <View className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <Text className="text-lg font-semibold text-foreground">
            {t('habit.introTitle', { defaultValue: 'Track daily baby habits' })}
          </Text>
          <Text className="mt-2 text-sm text-muted-foreground">
            {t('habit.introSubtitle', {
              defaultValue:
                'Log routines like brushing teeth, tummy time, reading, and more to build healthy habits.',
            })}
          </Text>
        </View>

        {isComingSoon ? (
          <View className="rounded-2xl border border-dashed border-border bg-muted/50 p-4">
            <Text className="text-base font-semibold text-foreground">
              {t('habit.comingSoonTitle', { defaultValue: 'Habit logging coming soon' })}
            </Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              {t('habit.comingSoonSubtitle', {
                defaultValue: 'We are adding detailed habit tracking for daily routines.',
              })}
            </Text>
          </View>
        ) : null}

        <Button variant="outline" disabled className="rounded-xl">
          <Text className="font-semibold text-muted-foreground">
            {t('habit.logHabitCta', { defaultValue: 'Log a habit (coming soon)' })}
          </Text>
        </Button>
      </ScrollView>
    </View>
  );
}
