import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  BookOpen,
  Calendar,
  Dumbbell,
  Heart,
  Moon,
  Users,
  Apple,
  Info,
  Bell,
  BellOff,
  Plus,
  Trash2,
  Save,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View, ScrollView, Switch, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ModalHeader } from '@/components/ModalHeader';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useNotification } from '@/components/NotificationContext';
import { BABY_HABITS_QUERY_KEY } from '@/constants/query-keys';
import { getActiveBabyProfileId } from '@/database/baby-profile';
import {
  getBabyHabits,
  addBabyHabit,
  removeBabyHabit,
  updateBabyHabitReminder,
  type HabitCategory,
} from '@/database/habits';
import { useLocalization } from '@/localization/LocalizationProvider';

// Icon mapping for categories
const categoryIcons: Record<HabitCategory, typeof Heart> = {
  health: Heart,
  learning: BookOpen,
  physical: Dumbbell,
  sleep: Moon,
  social: Users,
  nutrition: Apple,
};

// Color mapping for categories
const categoryColors: Record<HabitCategory, string> = {
  health: '#FF5C8D',
  learning: '#6366F1',
  physical: '#22C55E',
  sleep: '#8B5CF6',
  social: '#F59E0B',
  nutrition: '#10B981',
};

export default function HabitDetailScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  const params = useLocalSearchParams<{
    id: string;
    labelKey: string;
    descriptionKey: string;
    category: string;
    minAge: string;
    maxAge: string;
  }>();

  const [babyId, setBabyId] = useState<number | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [hasReminderChanges, setHasReminderChanges] = useState(false);

  const category = (params.category as HabitCategory) || 'health';
  const CategoryIcon = categoryIcons[category] || Heart;
  const categoryColor = categoryColors[category] || '#FF5C8D';

  const minAge = params.minAge ? parseInt(params.minAge, 10) : 0;
  const maxAge = params.maxAge ? parseInt(params.maxAge, 10) : null;

  const ageRangeText = maxAge
    ? `${minAge} - ${maxAge} ${t('common.months', { defaultValue: 'months' })}`
    : `${minAge}+ ${t('common.months', { defaultValue: 'months' })}`;

  // Load baby ID
  useEffect(() => {
    const loadBabyId = async () => {
      const id = await getActiveBabyProfileId();
      setBabyId(id);
    };
    loadBabyId();
  }, []);

  // Fetch baby's current habits
  const { data: babyHabits } = useQuery({
    queryKey: [BABY_HABITS_QUERY_KEY, babyId],
    queryFn: () => (babyId ? getBabyHabits(babyId) : []),
    enabled: !!babyId,
  });

  const existingHabit = babyHabits?.find((h) => h.habitDefinitionId === params.id);
  const isAdded = !!existingHabit;

  // Initialize reminder state from existing habit
  useEffect(() => {
    if (existingHabit?.reminderTime) {
      const [hours, minutes] = existingHabit.reminderTime.split(':').map(Number);
      const time = new Date();
      time.setHours(hours, minutes, 0, 0);
      setReminderTime(time);
      setReminderEnabled(true);
    } else if (existingHabit) {
      setReminderEnabled(false);
    }
  }, [existingHabit]);

  // Add habit mutation
  const addMutation = useMutation({
    mutationFn: async () => {
      if (!babyId || !params.id) throw new Error('Missing data');
      const timeStr = reminderEnabled
        ? `${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime.getMinutes().toString().padStart(2, '0')}`
        : undefined;
      await addBabyHabit(babyId, params.id, undefined, timeStr);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BABY_HABITS_QUERY_KEY] });
      showNotification(t('habit.habitLogged', { defaultValue: 'Habit added!' }), 'success');
    },
    onError: (error) => {
      console.error('Failed to add habit:', error);
      showNotification(t('common.saveError'), 'error');
    },
  });

  // Remove habit mutation
  const removeMutation = useMutation({
    mutationFn: async () => {
      if (!existingHabit) throw new Error('Habit not found');
      await removeBabyHabit(existingHabit.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BABY_HABITS_QUERY_KEY] });
      showNotification(t('habit.removeHabit', { defaultValue: 'Habit removed' }), 'success');
      router.back();
    },
    onError: (error) => {
      console.error('Failed to remove habit:', error);
      showNotification(t('common.saveError'), 'error');
    },
  });

  // Update reminder mutation
  const updateReminderMutation = useMutation({
    mutationFn: async () => {
      if (!existingHabit) throw new Error('Habit not found');
      const timeStr = reminderEnabled
        ? `${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime.getMinutes().toString().padStart(2, '0')}`
        : null;
      await updateBabyHabitReminder(existingHabit.id, timeStr);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BABY_HABITS_QUERY_KEY] });
      showNotification(
        t('habit.reminderUpdated', { defaultValue: 'Reminder updated!' }),
        'success'
      );
      setHasReminderChanges(false);
    },
    onError: (error) => {
      console.error('Failed to update reminder:', error);
      showNotification(t('common.saveError'), 'error');
    },
  });

  const handleAddHabit = () => {
    addMutation.mutate();
  };

  const handleRemoveHabit = () => {
    removeMutation.mutate();
  };

  const handleSaveReminder = () => {
    updateReminderMutation.mutate();
  };

  const handleTimeChange = (_event: unknown, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setReminderTime(selectedTime);
      setHasReminderChanges(true);
    }
  };

  const handleReminderToggle = (value: boolean) => {
    setReminderEnabled(value);
    setHasReminderChanges(true);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isPending =
    addMutation.isPending || removeMutation.isPending || updateReminderMutation.isPending;

  return (
    <View className="flex-1 bg-background">
      <ModalHeader
        title={t('habit.habitDetail', { defaultValue: 'About this Habit' })}
        closeLabel={t('common.close')}
      />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-6"
        showsVerticalScrollIndicator={false}>
        {/* Icon and Title */}
        <View className="mb-6 items-center">
          <View
            className="mb-4 h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: `${categoryColor}20` }}>
            <CategoryIcon size={40} color={categoryColor} />
          </View>
          <Text className="text-center text-2xl font-bold text-foreground">
            {t(params.labelKey || '', { defaultValue: params.id })}
          </Text>
          <Text className="mt-2 text-sm text-muted-foreground">
            {t(`habit.category.${category}`, { defaultValue: category })}
          </Text>
        </View>

        {/* Age Range Card */}
        <View className="mb-4 rounded-xl border border-border bg-card p-4">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-accent/20">
              <Calendar size={20} color={categoryColor} />
            </View>
            <View className="flex-1">
              <Text className="text-xs uppercase tracking-wide text-muted-foreground">
                {t('habit.recommendedAge', { defaultValue: 'Recommended Age' })}
              </Text>
              <Text className="text-base font-semibold text-foreground">{ageRangeText}</Text>
            </View>
          </View>
        </View>

        {/* Description Card */}
        <View className="mb-4 rounded-xl border border-border bg-card p-4">
          <View className="flex-row items-start gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-accent/20">
              <Info size={20} color={categoryColor} />
            </View>
            <View className="flex-1">
              <Text className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                {t('habit.whyImportant', { defaultValue: 'Why is this important?' })}
              </Text>
              <Text className="text-base leading-relaxed text-foreground">
                {t(params.descriptionKey || '', {
                  defaultValue: 'This habit helps your baby develop important skills and routines.',
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Benefits section */}
        <View className="mb-4 rounded-xl border border-border bg-card p-4">
          <Text className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
            {t('habit.benefits', { defaultValue: 'Benefits for your baby' })}
          </Text>
          <View className="gap-2">
            <View className="flex-row items-center gap-2">
              <View className="h-2 w-2 rounded-full" style={{ backgroundColor: categoryColor }} />
              <Text className="text-sm text-foreground">
                {t('habit.benefitDevelopment', { defaultValue: 'Supports healthy development' })}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="h-2 w-2 rounded-full" style={{ backgroundColor: categoryColor }} />
              <Text className="text-sm text-foreground">
                {t('habit.benefitRoutine', { defaultValue: 'Builds consistent routines' })}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="h-2 w-2 rounded-full" style={{ backgroundColor: categoryColor }} />
              <Text className="text-sm text-foreground">
                {t('habit.benefitBonding', { defaultValue: 'Strengthens parent-child bonding' })}
              </Text>
            </View>
          </View>
        </View>

        {/* Reminder section - show for both added and not added */}
        <View className="mb-4 rounded-xl border border-border bg-card p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-accent/20">
                {reminderEnabled ? (
                  <Bell size={20} color={categoryColor} />
                ) : (
                  <BellOff size={20} color="#9CA3AF" />
                )}
              </View>
              <View>
                <Text className="text-base font-semibold text-foreground">
                  {t('habit.setReminder', { defaultValue: 'Set Reminder' })}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {reminderEnabled
                    ? t('habit.reminderEnabled', { defaultValue: 'Reminder enabled' })
                    : t('habit.reminderDisabled', { defaultValue: 'No reminder set' })}
                </Text>
              </View>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={handleReminderToggle}
              trackColor={{ false: '#767577', true: categoryColor }}
              thumbColor="#FFFFFF"
            />
          </View>

          {reminderEnabled && (
            <View className="mt-2 border-t border-border pt-3">
              <Text className="mb-2 text-xs text-muted-foreground">
                {t('habit.reminderTime', { defaultValue: 'Reminder Time' })}
              </Text>
              {Platform.OS === 'ios' ? (
                <DateTimePicker
                  value={reminderTime}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                  style={{ height: 120 }}
                />
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="rounded-lg"
                    onPress={() => setShowTimePicker(true)}>
                    <Text className="text-foreground">{formatTime(reminderTime)}</Text>
                  </Button>
                  {showTimePicker && (
                    <DateTimePicker
                      value={reminderTime}
                      mode="time"
                      display="default"
                      onChange={handleTimeChange}
                    />
                  )}
                </>
              )}
            </View>
          )}

          {/* Save reminder button for already added habits */}
          {isAdded && hasReminderChanges && (
            <Button
              variant="outline"
              className="mt-4 flex-row gap-2 rounded-xl"
              onPress={handleSaveReminder}
              disabled={isPending}>
              <Save size={16} color={categoryColor} />
              <Text className="font-semibold" style={{ color: categoryColor }}>
                {t('habit.saveReminder', { defaultValue: 'Save Reminder Settings' })}
              </Text>
            </Button>
          )}
        </View>

        {/* Add/Remove button */}
        {isAdded ? (
          <Button
            variant="destructive"
            className="flex-row gap-2 rounded-xl"
            onPress={handleRemoveHabit}
            disabled={isPending}>
            <Trash2 size={18} color="#FFF" />
            <Text className="font-semibold text-white">
              {t('habit.removeThisHabit', { defaultValue: 'Remove This Habit' })}
            </Text>
          </Button>
        ) : (
          <Button
            className="flex-row gap-2 rounded-xl"
            onPress={handleAddHabit}
            disabled={isPending}>
            <Plus size={18} color="#FFF" />
            <Text className="font-semibold text-white">
              {t('habit.addThisHabit', { defaultValue: 'Add This Habit' })}
            </Text>
          </Button>
        )}
      </ScrollView>
    </View>
  );
}
