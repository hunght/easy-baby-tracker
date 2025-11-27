import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BottleFeedingForm } from '@/components/feeding/BottleFeedingForm';
import { BreastFeedingForm } from '@/components/feeding/BreastFeedingForm';
import { SolidsFeedingForm } from '@/components/feeding/SolidsFeedingForm';
import { useNotification } from '@/components/ui/NotificationContext';
import { TimeField } from '@/components/ui/TimeField';

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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.closeButton}>{t('common.close')}</Text>
        </Pressable>
        <Text style={styles.title}>{isEditing ? t('feeding.editTitle') : t('feeding.title')}</Text>
        <Pressable onPress={handleSave} disabled={isSaving}>
          <Text style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}>{t('common.save')}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Feeding Type Selection */}
        <View style={styles.segmentedControl}>
          {feedingTypes.map((type, index) => (
            <Pressable
              key={type.key}
              onPress={() => setFeedingType(type.key)}
              style={[
                styles.segment,
                feedingType === type.key && styles.segmentActive,
                index > 0 && styles.segmentBorder,
              ]}>
              <MaterialCommunityIcons
                name={type.icon}
                size={20}
                color={feedingType === type.key ? '#FFF' : '#666'}
              />
              <Text style={[styles.segmentText, feedingType === type.key && styles.segmentTextActive]}>
                {t(type.labelKey)}
              </Text>
            </Pressable>
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
          <View style={styles.scheduleContainer}>
            <Pressable
              onPress={handleScheduleReminder}
              style={[
                styles.scheduleButton,
                scheduledNotificationId && styles.scheduleButtonActive,
              ]}>
              <MaterialCommunityIcons
                name={scheduledNotificationId ? 'bell-off' : 'bell'}
                size={20}
                color="#FFF"
              />
              <Text style={styles.scheduleButtonText}>
                {scheduledNotificationId
                  ? t('feeding.schedule.cancelSchedule')
                  : t('feeding.schedule.enable')}
              </Text>
            </Pressable>
            {scheduledNotificationId && (
              <Text style={styles.scheduleStatusText}>
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
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('common.notesPlaceholder')}
          placeholderTextColor="#C4C4C4"
          multiline
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    color: '#FF5C8D',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  saveButton: {
    color: '#FF5C8D',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    marginBottom: 24,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  segmentActive: {
    backgroundColor: '#FF5C8D',
  },
  segmentBorder: {
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
  },
  segmentText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
  },
  segmentTextActive: {
    color: '#FFF',
  },
  notesInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9F9F9',
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#2D2D2D',
    marginTop: 12,
  },
  scheduleContainer: {
    marginBottom: 24,
    gap: 8,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  scheduleButtonActive: {
    backgroundColor: '#999',
  },
  scheduleButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scheduleStatusText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

