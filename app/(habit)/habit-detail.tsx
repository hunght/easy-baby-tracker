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
  ChevronDown,
  ChevronUp,
  Repeat,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View, ScrollView, Switch, Pressable, Modal } from 'react-native';

import { ModalHeader } from '@/components/ModalHeader';
import { TimePickerField } from '@/components/TimePickerField';
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
  const [reminderDays, setReminderDays] = useState<string>('daily'); // 'daily', 'weekdays', 'weekends', or 'custom'
  const [customDays, setCustomDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // Array of day indices (0=Sun, 6=Sat)
  const [hasReminderChanges, setHasReminderChanges] = useState(false);
  const [showBenefits, setShowBenefits] = useState(true);
  const [showReminderModal, setShowReminderModal] = useState(false);

  // Frequency options
  const frequencyOptions = [
    { id: 'daily', label: t('habit.frequency.daily', { defaultValue: 'Daily' }) },
    { id: 'weekdays', label: t('habit.frequency.weekdays', { defaultValue: 'Weekdays' }) },
    { id: 'weekends', label: t('habit.frequency.weekends', { defaultValue: 'Weekends' }) },
    { id: 'custom', label: t('habit.frequency.custom', { defaultValue: 'Custom' }) },
  ];

  // Day labels for custom picker
  const dayLabels = [
    {
      id: 0,
      short: t('common.days.sun', { defaultValue: 'S' }),
      full: t('common.days.sunday', { defaultValue: 'Sunday' }),
    },
    {
      id: 1,
      short: t('common.days.mon', { defaultValue: 'M' }),
      full: t('common.days.monday', { defaultValue: 'Monday' }),
    },
    {
      id: 2,
      short: t('common.days.tue', { defaultValue: 'T' }),
      full: t('common.days.tuesday', { defaultValue: 'Tuesday' }),
    },
    {
      id: 3,
      short: t('common.days.wed', { defaultValue: 'W' }),
      full: t('common.days.wednesday', { defaultValue: 'Wednesday' }),
    },
    {
      id: 4,
      short: t('common.days.thu', { defaultValue: 'T' }),
      full: t('common.days.thursday', { defaultValue: 'Thursday' }),
    },
    {
      id: 5,
      short: t('common.days.fri', { defaultValue: 'F' }),
      full: t('common.days.friday', { defaultValue: 'Friday' }),
    },
    {
      id: 6,
      short: t('common.days.sat', { defaultValue: 'S' }),
      full: t('common.days.saturday', { defaultValue: 'Saturday' }),
    },
  ];

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
      // Load saved frequency
      if (existingHabit.reminderDays) {
        try {
          // Check if it's a JSON array (custom days)
          const parsed = JSON.parse(existingHabit.reminderDays);
          if (Array.isArray(parsed)) {
            setCustomDays(parsed);
            setReminderDays('custom');
          }
        } catch {
          // Not JSON, it's a preset like 'daily', 'weekdays', 'weekends'
          setReminderDays(existingHabit.reminderDays);
          if (existingHabit.reminderDays === 'daily') {
            setCustomDays([0, 1, 2, 3, 4, 5, 6]);
          } else if (existingHabit.reminderDays === 'weekdays') {
            setCustomDays([1, 2, 3, 4, 5]);
          } else if (existingHabit.reminderDays === 'weekends') {
            setCustomDays([0, 6]);
          }
        }
      }
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
      const daysStr = reminderEnabled ? getReminderDaysToSave() : undefined;
      await addBabyHabit(babyId, params.id, undefined, timeStr, daysStr);
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
      const daysStr = reminderEnabled ? getReminderDaysToSave() : null;
      await updateBabyHabitReminder(existingHabit.id, timeStr, daysStr);
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

  const handleTimeChange = (selectedTime: Date) => {
    setReminderTime(selectedTime);
    setHasReminderChanges(true);
  };

  const handleReminderToggle = (value: boolean) => {
    setReminderEnabled(value);
    setHasReminderChanges(true);
  };

  const handleFrequencyChange = (frequency: string) => {
    setReminderDays(frequency);
    // Set default days based on preset
    if (frequency === 'daily') {
      setCustomDays([0, 1, 2, 3, 4, 5, 6]);
    } else if (frequency === 'weekdays') {
      setCustomDays([1, 2, 3, 4, 5]);
    } else if (frequency === 'weekends') {
      setCustomDays([0, 6]);
    }
    setHasReminderChanges(true);
  };

  const handleDayToggle = (dayId: number) => {
    setCustomDays((prev) => {
      if (prev.includes(dayId)) {
        // Don't allow deselecting all days
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== dayId);
      }
      return [...prev, dayId].sort();
    });
    setReminderDays('custom');
    setHasReminderChanges(true);
  };

  // Get the reminder days string to save
  const getReminderDaysToSave = () => {
    if (reminderDays === 'custom') {
      return JSON.stringify(customDays);
    }
    return reminderDays;
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
        contentContainerClassName="px-5 pb-32 pt-6"
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
        <View className="mb-4 rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-accent/20">
              <Calendar size={24} color={categoryColor} />
            </View>
            <View className="flex-1">
              <Text className="text-xs uppercase tracking-wide text-muted-foreground">
                {t('habit.recommendedAge', { defaultValue: 'Recommended Age' })}
              </Text>
              <Text className="text-lg font-semibold text-foreground">{ageRangeText}</Text>
            </View>
          </View>
        </View>

        {/* Description Card */}
        <View className="mb-4 rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-start gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-accent/20">
              <Info size={24} color={categoryColor} />
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

        {/* Benefits section - Collapsible for less scrolling */}
        <Pressable
          onPress={() => setShowBenefits(!showBenefits)}
          className="mb-4 rounded-2xl border border-border bg-card p-4 active:opacity-90">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {t('habit.benefits', { defaultValue: 'Benefits for your baby' })}
            </Text>
            {showBenefits ? (
              <ChevronUp size={20} color="#9CA3AF" />
            ) : (
              <ChevronDown size={20} color="#9CA3AF" />
            )}
          </View>
          {showBenefits && (
            <View className="mt-3 gap-3">
              <View className="flex-row items-center gap-3">
                <View className="h-3 w-3 rounded-full" style={{ backgroundColor: categoryColor }} />
                <Text className="flex-1 text-base text-foreground">
                  {t('habit.benefitDevelopment', { defaultValue: 'Supports healthy development' })}
                </Text>
              </View>
              <View className="flex-row items-center gap-3">
                <View className="h-3 w-3 rounded-full" style={{ backgroundColor: categoryColor }} />
                <Text className="flex-1 text-base text-foreground">
                  {t('habit.benefitRoutine', { defaultValue: 'Builds consistent routines' })}
                </Text>
              </View>
              <View className="flex-row items-center gap-3">
                <View className="h-3 w-3 rounded-full" style={{ backgroundColor: categoryColor }} />
                <Text className="flex-1 text-base text-foreground">
                  {t('habit.benefitBonding', { defaultValue: 'Strengthens parent-child bonding' })}
                </Text>
              </View>
            </View>
          )}
        </Pressable>
      </ScrollView>

      {/* Reminder Modal - Bottom Sheet for one-handed use */}
      <Modal
        visible={showReminderModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReminderModal(false)}>
        <Pressable className="flex-1 bg-black/50" onPress={() => setShowReminderModal(false)}>
          <View className="flex-1" />
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="rounded-t-3xl bg-background px-5 pb-10 pt-6">
            {/* Modal Header */}
            <View className="mb-6 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-foreground">
                {t('habit.setReminder', { defaultValue: 'Set Reminder' })}
              </Text>
              <Pressable
                onPress={() => setShowReminderModal(false)}
                className="rounded-full bg-muted p-2">
                <Text className="text-sm font-medium text-muted-foreground">
                  {t('common.close', { defaultValue: 'Close' })}
                </Text>
              </Pressable>
            </View>

            {/* Enable/Disable Toggle */}
            <Pressable
              onPress={() => handleReminderToggle(!reminderEnabled)}
              className="mb-4 flex-row items-center justify-between rounded-2xl border border-border bg-card p-4 active:opacity-80">
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                  {reminderEnabled ? (
                    <Bell size={24} color={categoryColor} />
                  ) : (
                    <BellOff size={24} color="#9CA3AF" />
                  )}
                </View>
                <View>
                  <Text className="text-lg font-semibold text-foreground">
                    {t('habit.reminder', { defaultValue: 'Reminder' })}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
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
            </Pressable>

            {reminderEnabled && (
              <>
                {/* Time picker */}
                <View className="mb-4 rounded-2xl border border-border bg-card p-4">
                  <TimePickerField
                    value={reminderTime}
                    onChange={handleTimeChange}
                    label={t('habit.reminderTime', { defaultValue: 'Reminder Time' })}
                    isEditing={true}
                    timeOnly={true}
                  />
                </View>

                {/* Frequency selector */}
                <View className="mb-4 rounded-2xl border border-border bg-card p-4">
                  <View className="mb-3 flex-row items-center gap-2">
                    <Repeat size={16} color="#9CA3AF" />
                    <Text className="text-sm font-medium text-muted-foreground">
                      {t('habit.reminderFrequency', { defaultValue: 'Repeat' })}
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {frequencyOptions.map((option) => (
                      <Pressable
                        key={option.id}
                        onPress={() => handleFrequencyChange(option.id)}
                        className={`rounded-full px-4 py-2 ${
                          reminderDays === option.id ? 'bg-accent' : 'border border-border bg-muted'
                        }`}>
                        <Text
                          className={`text-sm font-medium ${
                            reminderDays === option.id ? 'text-white' : 'text-foreground'
                          }`}>
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Day picker - only show for custom selection */}
                  {reminderDays === 'custom' && (
                    <View className="mt-4">
                      <Text className="mb-2 text-xs text-muted-foreground">
                        {t('habit.selectDays', { defaultValue: 'Select days' })}
                      </Text>
                      <View className="flex-row justify-between">
                        {dayLabels.map((day) => (
                          <Pressable
                            key={day.id}
                            onPress={() => handleDayToggle(day.id)}
                            className={`h-10 w-10 items-center justify-center rounded-full ${
                              customDays.includes(day.id)
                                ? 'bg-accent'
                                : 'border border-border bg-muted'
                            }`}>
                            <Text
                              className={`text-sm font-semibold ${
                                customDays.includes(day.id) ? 'text-white' : 'text-foreground'
                              }`}>
                              {day.short}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* Save Button */}
            {isAdded && hasReminderChanges && (
              <Button
                className="h-14 flex-row items-center justify-center gap-2 rounded-2xl"
                onPress={() => {
                  handleSaveReminder();
                  setShowReminderModal(false);
                }}
                disabled={isPending}>
                <Save size={20} color="#FFF" />
                <Text className="text-base font-semibold text-white">
                  {t('habit.saveReminder', { defaultValue: 'Save Reminder' })}
                </Text>
              </Button>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Sticky Bottom Action Bar - easy to reach with thumb */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-border bg-background px-5 pb-8 pt-4">
        {isAdded ? (
          <View className="flex-row gap-3">
            {/* Set Reminder Button */}
            <Pressable
              onPress={() => setShowReminderModal(true)}
              className="h-14 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-card active:opacity-80">
              {reminderEnabled ? (
                <Bell size={20} color={categoryColor} />
              ) : (
                <BellOff size={20} color="#9CA3AF" />
              )}
              <Text className="text-sm font-semibold text-foreground">
                {t('habit.reminder', { defaultValue: 'Reminder' })}
              </Text>
            </Pressable>
            {/* Remove Button */}
            <Button
              variant="destructive"
              className="h-14 flex-1 flex-row items-center justify-center gap-2 rounded-2xl"
              onPress={handleRemoveHabit}
              disabled={isPending}>
              <Trash2 size={20} color="#FFF" />
              <Text className="text-sm font-semibold text-white">
                {t('common.remove', { defaultValue: 'Remove' })}
              </Text>
            </Button>
          </View>
        ) : (
          <Button
            className="h-14 flex-row items-center justify-center gap-2 rounded-2xl"
            onPress={handleAddHabit}
            disabled={isPending}>
            <Plus size={22} color="#FFF" />
            <Text className="text-base font-semibold text-white">
              {t('habit.addThisHabit', { defaultValue: 'Add This Habit' })}
            </Text>
          </Button>
        )}
      </View>
    </View>
  );
}
