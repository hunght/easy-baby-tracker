import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { BottleFeedingForm } from '@/features/feeding/components/BottleFeedingForm';
import { BreastFeedingForm } from '@/features/feeding/components/BreastFeedingForm';
import { SolidsFeedingForm } from '@/features/feeding/components/SolidsFeedingForm';
import { ModalHeader } from '@/components/ModalHeader';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useNotification } from '@/components/ui/NotificationContext';
import { Text } from '@/components/ui/text';
import { TimeField } from '@/components/ui/TimeField';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { FEEDINGS_QUERY_KEY } from '@/constants/query-keys';
import type { FeedingPayload, FeedingType, IngredientType } from '@/database/feeding';
import { getFeedingById, saveFeeding, updateFeeding } from '@/database/feeding';
import {
  cancelScheduledNotification,
  scheduleFeedingNotification,
} from '@/lib/notification-scheduler';
import { useLocalization } from '@/localization/LocalizationProvider';

type FeedingTypeOption = {
  key: FeedingType;
  labelKey: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const feedingTypes: FeedingTypeOption[] = [
  { key: 'breast', labelKey: 'feeding.types.breast', icon: 'heart-outline' },
  { key: 'bottle', labelKey: 'feeding.types.bottle', icon: 'bottle-tonic-outline' },
  { key: 'solids', labelKey: 'feeding.types.solids', icon: 'bowl-mix-outline' },
];

export default function FeedingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useLocalization();
  const { showNotification } = useNotification();
  const colorScheme = useColorScheme();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id ? Number(params.id) : undefined;
  const isEditing = !!id;

  const [feedingType, setFeedingType] = useState<FeedingType>('breast');
  const [startTime, setStartTime] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [scheduledNotificationId, setScheduledNotificationId] = useState<string | null>(null);

  // Feeding type specific data (managed by child components)
  const [breastData, setBreastData] = useState<{
    leftDuration: number;
    rightDuration: number;
    duration: number;
  } | null>(null);
  const [bottleData, setBottleData] = useState<{
    ingredientType: IngredientType;
    amountMl: number;
    duration: number;
  } | null>(null);
  const [solidsData, setSolidsData] = useState<{
    ingredient: string;
    amountGrams: number;
    duration: number;
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing data if editing
  const { data: existingData, isLoading: _isLoadingData } = useQuery({
    queryKey: [FEEDINGS_QUERY_KEY, id],
    queryFn: () => (id ? getFeedingById(id) : null),
    enabled: isEditing,
  });

  // Populate state when data is loaded
  useEffect(() => {
    if (existingData) {
      setFeedingType(existingData.type);
      setStartTime(new Date(existingData.startTime * 1000));
      setNotes(existingData.notes ?? '');

      if (existingData.type === 'breast') {
        setBreastData({
          leftDuration: existingData.leftDuration ?? 0,
          rightDuration: existingData.rightDuration ?? 0,
          duration: existingData.duration ?? 0,
        });
      } else if (existingData.type === 'bottle') {
        setBottleData({
          ingredientType: existingData.ingredientType ?? 'breast_milk',
          amountMl: existingData.amountMl ?? 60,
          duration: existingData.duration ?? 0,
        });
      } else if (existingData.type === 'solids') {
        setSolidsData({
          ingredient: existingData.ingredient ?? '',
          amountGrams: existingData.amountGrams ?? 60,
          duration: existingData.duration ?? 0,
        });
      }
    }
  }, [existingData]);

  const handleStartTimeChange = (selectedDate: Date) => {
    setStartTime(selectedDate);
    // If time changed and we had a scheduled notification, update it if new time is in future
    if (scheduledNotificationId && selectedDate > new Date()) {
      const updateNotification = async () => {
        const newNotificationId = await scheduleFeedingNotification(
          selectedDate,
          feedingType,
          scheduledNotificationId
        );
        if (newNotificationId) {
          setScheduledNotificationId(newNotificationId);
        }
      };
      updateNotification();
    } else if (scheduledNotificationId && selectedDate <= new Date()) {
      // If time is now in past, cancel the notification
      cancelScheduledNotification(scheduledNotificationId);
      setScheduledNotificationId(null);
    }
  };

  // Determine if start time is in the future, past, or now
  const getTimeState = () => {
    const now = new Date();
    const diff = startTime.getTime() - now.getTime();
    const fiveMinutes = 5 * 60 * 1000;

    if (diff > fiveMinutes) {
      return 'future'; // More than 5 minutes in the future
    } else if (diff < -fiveMinutes) {
      return 'past'; // More than 5 minutes in the past
    } else {
      return 'now'; // Within 5 minutes (considered "now")
    }
  };

  const timeState = getTimeState();
  const isFuture = timeState === 'future';
  const isPast = timeState === 'past';

  const handleScheduleReminder = async () => {
    if (scheduledNotificationId) {
      // Cancel existing notification
      await cancelScheduledNotification(scheduledNotificationId);
      setScheduledNotificationId(null);
      showNotification(t('feeding.schedule.scheduleCancelled'), 'info');
    } else {
      // Schedule new notification using startTime
      const notificationId = await scheduleFeedingNotification(startTime, feedingType);
      if (notificationId) {
        setScheduledNotificationId(notificationId);
        showNotification(t('feeding.schedule.scheduleSet'), 'success');
        // Close the modal after successful scheduling
        setTimeout(() => router.back(), 500);
      } else {
        showNotification(t('feeding.schedule.scheduleError'), 'error');
      }
    }
  };

  // Update notification when feeding type changes (if scheduled)
  useEffect(() => {
    if (scheduledNotificationId && isFuture) {
      const updateNotification = async () => {
        const newNotificationId = await scheduleFeedingNotification(
          startTime,
          feedingType,
          scheduledNotificationId
        );
        if (newNotificationId) {
          setScheduledNotificationId(newNotificationId);
        }
      };
      updateNotification();
    }
  }, [feedingType]);

  // Callbacks for child components to update parent state
  const handleBreastDataChange = useCallback(
    (data: { leftDuration: number; rightDuration: number; duration: number }) => {
      setBreastData(data);
    },
    []
  );

  const handleBottleDataChange = useCallback(
    (data: { ingredientType: IngredientType; amountMl: number; duration: number }) => {
      setBottleData(data);
    },
    []
  );

  const handleSolidsDataChange = useCallback(
    (data: { ingredient: string; amountGrams: number; duration: number }) => {
      setSolidsData(data);
    },
    []
  );

  const mutation = useMutation({
    mutationFn: async (payload: FeedingPayload) => {
      if (isEditing && id) {
        await updateFeeding(id, payload);
      } else {
        await saveFeeding(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEEDINGS_QUERY_KEY });
      showNotification(t('common.saveSuccess'), 'success');
      setTimeout(() => router.back(), 500);
    },
    onError: (error) => {
      console.error('Failed to save feeding:', error);
      showNotification(t('common.saveError'), 'error');
    },
  });

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const payload: FeedingPayload = {
        type: feedingType,
        startTime: Math.floor(startTime.getTime() / 1000),
        notes: notes || undefined,
      };

      if (feedingType === 'breast' && breastData) {
        payload.leftDuration = breastData.leftDuration;
        payload.rightDuration = breastData.rightDuration;
        payload.duration = breastData.duration;
      } else if (feedingType === 'bottle' && bottleData) {
        payload.ingredientType = bottleData.ingredientType;
        payload.amountMl = bottleData.amountMl;
        payload.duration = bottleData.duration || undefined;
      } else if (feedingType === 'solids' && solidsData) {
        payload.ingredient = solidsData.ingredient || undefined;
        payload.amountGrams = solidsData.amountGrams;
        payload.duration = solidsData.duration || undefined;
      }

      await mutation.mutateAsync(payload);

      // Cancel scheduled notification after saving
      if (scheduledNotificationId) {
        await cancelScheduledNotification(scheduledNotificationId);
        setScheduledNotificationId(null);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-card">
      <ModalHeader
        title={isEditing ? t('feeding.editTitle') : t('feeding.title')}
        onSave={handleSave}
        isSaving={isSaving}
        closeLabel={t('common.close')}
        saveLabel={t('common.save')}
      />

      <ScrollView contentContainerClassName="p-5 pb-10" showsVerticalScrollIndicator={false}>
        {/* Feeding Type Selection */}
        <View className="mb-6 flex-row overflow-hidden rounded-xl border border-border bg-card">
          {feedingTypes.map((type, index) => (
            <Badge
              key={type.key}
              variant={feedingType === type.key ? 'default' : 'secondary'}
              onPress={() => setFeedingType(type.key)}
              className={`flex-1 rounded-none ${index > 0 ? 'border-l border-border' : ''} ${feedingType === type.key ? 'bg-primary' : 'bg-card'}`}
              accessibilityLabel={t(type.labelKey)}
              accessibilityState={{ selected: feedingType === type.key }}>
              <View className="flex-row items-center justify-center gap-1.5 py-3">
                <MaterialCommunityIcons
                  name={type.icon}
                  size={20}
                  color={
                    feedingType === type.key
                      ? '#FFFFFF'
                      : colorScheme === 'dark'
                        ? '#9CA3AF'
                        : '#666666'
                  }
                />
                <Text
                  className={
                    feedingType === type.key
                      ? 'text-sm font-semibold text-white'
                      : 'text-sm font-semibold text-muted-foreground'
                  }>
                  {t(type.labelKey)}
                </Text>
              </View>
            </Badge>
          ))}
        </View>

        {/* Common Fields */}
        <TimeField
          label={t('common.starts')}
          value={startTime}
          onChange={handleStartTimeChange}
          showNowThreshold={5}
          showHelperText={!isEditing}
        />

        {/* Schedule Reminder Button - only show if time is in future and not editing */}
        {!isEditing && isFuture && (
          <View className="mb-6 gap-2">
            <Pressable
              onPress={handleScheduleReminder}
              className={`flex-row items-center justify-center gap-2 rounded-xl px-5 py-3.5 shadow-sm ${scheduledNotificationId ? 'bg-muted-foreground' : 'bg-blue-500'}`}>
              <MaterialCommunityIcons
                name={scheduledNotificationId ? 'bell-off' : 'bell'}
                size={20}
                color="#FFFFFF"
              />
              <Text className="text-base font-semibold text-white">
                {scheduledNotificationId
                  ? t('feeding.schedule.cancelSchedule')
                  : t('feeding.schedule.enable')}
              </Text>
            </Pressable>
            {scheduledNotificationId && (
              <Text className="text-center text-sm italic text-muted-foreground">
                {t('feeding.schedule.scheduledFor')}: {startTime.toLocaleString()}
              </Text>
            )}
          </View>
        )}

        {/* Breast Feeding */}
        {feedingType === 'breast' && (
          <BreastFeedingForm
            isEditing={isEditing}
            isPast={isPast}
            initialLeftDuration={breastData?.leftDuration}
            initialRightDuration={breastData?.rightDuration}
            onDataChange={handleBreastDataChange}
          />
        )}

        {/* Bottle Feeding */}
        {feedingType === 'bottle' && (
          <BottleFeedingForm
            isEditing={isEditing}
            isPast={isPast}
            initialIngredientType={bottleData?.ingredientType}
            initialAmountMl={bottleData?.amountMl}
            initialDuration={bottleData?.duration}
            onDataChange={handleBottleDataChange}
          />
        )}

        {/* Solids Feeding */}
        {feedingType === 'solids' && (
          <SolidsFeedingForm
            isEditing={isEditing}
            isPast={isPast}
            initialIngredient={solidsData?.ingredient}
            initialAmountGrams={solidsData?.amountGrams}
            initialDuration={solidsData?.duration}
            onDataChange={handleSolidsDataChange}
          />
        )}

        {/* Notes */}
        <Input
          value={notes}
          onChangeText={setNotes}
          placeholder={t('common.notesPlaceholder')}
          multiline
          numberOfLines={4}
          className="mt-3 min-h-20"
        />
      </ScrollView>
    </View>
  );
}
