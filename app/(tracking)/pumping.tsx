import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';

import { Input } from '@/components/ui/input';
import { ModalHeader } from '@/components/ModalHeader';
import { DateTimePickerModal } from '@/components/DateTimePickerModal';
import { useNotification } from '@/components/NotificationContext';
import { Text } from '@/components/ui/text';
import { PUMPING_INVENTORY_QUERY_KEY, PUMPINGS_QUERY_KEY } from '@/constants/query-keys';
import type { PumpingPayload } from '@/database/pumping';
import {
  getPumpingById,
  getPumpingInventory,
  savePumping,
  updatePumping,
} from '@/database/pumping';
import { useLocalization } from '@/localization/LocalizationProvider';

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function PumpingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useLocalization();
  const { showNotification } = useNotification();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id ? Number(params.id) : undefined;
  const isEditing = !!id;

  const [startTime, setStartTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notes, setNotes] = useState('');

  // Amounts
  const [leftAmountMl, setLeftAmountMl] = useState(15);
  const [rightAmountMl, setRightAmountMl] = useState(15);

  // Timers
  const [leftDuration, setLeftDuration] = useState(0);
  const [rightDuration, setRightDuration] = useState(0);
  const [leftTimerActive, setLeftTimerActive] = useState(false);
  const [rightTimerActive, setRightTimerActive] = useState(false);
  const leftTimerRef = useRef<number | null>(null);
  const rightTimerRef = useRef<number | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing data if editing
  const { data: existingData, isLoading: _isLoadingData } = useQuery({
    queryKey: [PUMPINGS_QUERY_KEY, id],
    queryFn: () => (id ? getPumpingById(id) : null),
    enabled: isEditing,
  });

  // Populate state when data is loaded
  useEffect(() => {
    if (existingData) {
      setStartTime(new Date(existingData.startTime * 1000));
      setNotes(existingData.notes ?? '');
      setLeftAmountMl(existingData.leftAmountMl ?? 0);
      setRightAmountMl(existingData.rightAmountMl ?? 0);
      setLeftDuration(existingData.leftDuration ?? 0);
      setRightDuration(existingData.rightDuration ?? 0);
    }
  }, [existingData]);

  // Fetch inventory
  const { data: inventory = 0 } = useQuery<number>({
    queryKey: PUMPING_INVENTORY_QUERY_KEY,
    queryFn: () => getPumpingInventory(),
  });

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (leftTimerRef.current) clearInterval(leftTimerRef.current);
      if (rightTimerRef.current) clearInterval(rightTimerRef.current);
    };
  }, []);

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedDate) {
      setStartTime(selectedDate);
    }
    if (Platform.OS === 'ios' && event.type === 'dismissed') {
      setShowTimePicker(false);
    }
  };

  const toggleLeftTimer = () => {
    if (leftTimerActive) {
      if (leftTimerRef.current) {
        clearInterval(leftTimerRef.current);
        leftTimerRef.current = null;
      }
      setLeftTimerActive(false);
    } else {
      setLeftTimerActive(true);
      leftTimerRef.current = setInterval(() => {
        setLeftDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  const toggleRightTimer = () => {
    if (rightTimerActive) {
      if (rightTimerRef.current) {
        clearInterval(rightTimerRef.current);
        rightTimerRef.current = null;
      }
      setRightTimerActive(false);
    } else {
      setRightTimerActive(true);
      rightTimerRef.current = setInterval(() => {
        setRightDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  const mutation = useMutation({
    mutationFn: async (payload: PumpingPayload) => {
      if (isEditing && id) {
        await updatePumping(id, payload);
      } else {
        await savePumping(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PUMPINGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PUMPING_INVENTORY_QUERY_KEY });
      showNotification(t('common.saveSuccess'), 'success');
      setTimeout(() => router.back(), 500);
    },
    onError: (error) => {
      console.error('Failed to save pumping:', error);
      showNotification(t('common.saveError'), 'error');
    },
  });

  const totalAmount = leftAmountMl + rightAmountMl;
  const totalDuration = leftDuration + rightDuration;

  const handleSave = async () => {
    if (isSaving || totalAmount === 0) return;

    setIsSaving(true);
    try {
      const payload = {
        startTime: Math.floor(startTime.getTime() / 1000),
        amountMl: totalAmount,
        leftAmountMl: leftAmountMl > 0 ? leftAmountMl : undefined,
        rightAmountMl: rightAmountMl > 0 ? rightAmountMl : undefined,
        leftDuration: leftDuration > 0 ? leftDuration : undefined,
        rightDuration: rightDuration > 0 ? rightDuration : undefined,
        duration: totalDuration > 0 ? totalDuration : undefined,
        notes: notes || undefined,
      };

      await mutation.mutateAsync(payload);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ModalHeader
        title={isEditing ? t('pumping.editTitle') : t('pumping.title')}
        onSave={handleSave}
        isSaving={isSaving || totalAmount === 0}
        closeLabel={t('common.close')}
        saveLabel={t('common.save')}
      />

      <ScrollView contentContainerClassName="p-5 pb-10" showsVerticalScrollIndicator={false}>
        {/* Inventory */}
        <View className="mb-6 flex-row items-center gap-2 rounded-xl bg-gray-100 p-4">
          <MaterialCommunityIcons name="package-variant" size={20} color="#666" />
          <Text className="flex-1 text-base font-medium text-muted-foreground">
            {t('common.inventory')}
          </Text>
          <Text className="text-base font-semibold text-accent">
            {inventory.toFixed(1)} {t('common.unitMl')}
          </Text>
        </View>

        {/* Starts */}
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-base font-medium text-muted-foreground">{t('common.starts')}</Text>
          <Pressable onPress={() => setShowTimePicker(true)}>
            <Text className="text-base font-semibold text-accent">{t('common.setTime')}</Text>
          </Pressable>
        </View>

        <DateTimePickerModal
          visible={showTimePicker}
          value={startTime}
          onClose={() => setShowTimePicker(false)}
          onChange={handleTimeChange}
        />

        {/* Amount */}
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-base font-medium text-muted-foreground">{t('common.amount')}</Text>
          <Text className="text-base font-semibold text-accent">
            {totalAmount.toFixed(1)} {t('common.unitMl')}
          </Text>
        </View>

        {/* Left Amount */}
        <View className="mb-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-base font-medium text-muted-foreground">{t('pumping.left')}</Text>
            <Text className="text-base font-semibold text-accent">
              {leftAmountMl.toFixed(2)} {t('common.unitMl')}
            </Text>
          </View>
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={0}
            maximumValue={350}
            step={5}
            value={leftAmountMl}
            onValueChange={setLeftAmountMl}
            minimumTrackTintColor="#FF5C8D"
            maximumTrackTintColor="#E0E0E0"
            thumbTintColor="#FFF"
          />
          <View className="flex-row justify-between px-1">
            {[0, 50, 100, 150, 200, 250, 300, 350].map((value) => (
              <Text key={value} className="text-xs text-gray-400">
                {value}
              </Text>
            ))}
          </View>
        </View>

        {/* Right Amount */}
        <View className="mb-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-base font-medium text-muted-foreground">
              {t('pumping.right')}
            </Text>
            <Text className="text-base font-semibold text-accent">
              {rightAmountMl.toFixed(2)} {t('common.unitMl')}
            </Text>
          </View>
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={0}
            maximumValue={350}
            step={5}
            value={rightAmountMl}
            onValueChange={setRightAmountMl}
            minimumTrackTintColor="#FF5C8D"
            maximumTrackTintColor="#E0E0E0"
            thumbTintColor="#FFF"
          />
          <View className="flex-row justify-between px-1">
            {[0, 50, 100, 150, 200, 250, 300, 350].map((value) => (
              <Text key={value} className="text-xs text-gray-400">
                {value}
              </Text>
            ))}
          </View>
        </View>

        {/* Duration */}
        {isEditing ? (
          // Edit Mode: Manual Inputs
          <View className="mb-6 gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-medium text-muted-foreground">
                {t('common.leftShort')}
              </Text>
              <View className="flex-row items-center gap-2">
                <Input
                  className="w-[60px] text-center"
                  value={Math.floor(leftDuration / 60).toString()}
                  onChangeText={(text) => {
                    const mins = parseInt(text) || 0;
                    setLeftDuration(mins * 60);
                  }}
                  keyboardType="number-pad"
                  placeholder="0"
                />
                <Text className="text-base text-muted-foreground">{t('common.unitMin')}</Text>
              </View>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-medium text-muted-foreground">
                {t('common.rightShort')}
              </Text>
              <View className="flex-row items-center gap-2">
                <Input
                  className="w-[60px] text-center"
                  value={Math.floor(rightDuration / 60).toString()}
                  onChangeText={(text) => {
                    const mins = parseInt(text) || 0;
                    setRightDuration(mins * 60);
                  }}
                  keyboardType="number-pad"
                  placeholder="0"
                />
                <Text className="text-base text-muted-foreground">{t('common.unitMin')}</Text>
              </View>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-medium text-muted-foreground">
                {t('common.totalDuration')}
              </Text>
              <Text className="text-base text-foreground">{formatTime(totalDuration)}</Text>
            </View>
          </View>
        ) : (
          // Create Mode: Timers
          <>
            <View className="mb-3 flex-row items-center justify-between">
              <View>
                <Text className="text-base font-medium text-muted-foreground">
                  {t('common.duration')}
                </Text>
                <Text className="mt-0.5 text-sm text-gray-400">{t('common.optional')}</Text>
              </View>
              <Text className="text-base text-foreground">
                {t('common.seconds', { params: { value: totalDuration } })}
              </Text>
            </View>

            {/* Timers */}
            <View className="my-6 flex-row justify-around">
              <View className="items-center gap-3">
                <Pressable
                  className="w-17.5 h-17.5 items-center justify-center rounded-full bg-accent"
                  onPress={toggleLeftTimer}>
                  <MaterialCommunityIcons
                    name={leftTimerActive ? 'pause' : 'play'}
                    size={24}
                    color="#FFF"
                  />
                </Pressable>
                <Text className="text-base font-medium text-foreground">
                  {t('common.leftShort')}: {formatTime(leftDuration)}
                </Text>
              </View>

              <View className="items-center gap-3">
                <Pressable
                  className="w-17.5 h-17.5 items-center justify-center rounded-full bg-accent"
                  onPress={toggleRightTimer}>
                  <MaterialCommunityIcons
                    name={rightTimerActive ? 'pause' : 'play'}
                    size={24}
                    color="#FFF"
                  />
                </Pressable>
                <Text className="text-base font-medium text-foreground">
                  {t('common.rightShort')}: {formatTime(rightDuration)}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Notes */}
        <Input
          className="mt-3 min-h-20"
          value={notes}
          onChangeText={setNotes}
          placeholder={t('common.notesPlaceholder')}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>
    </View>
  );
}
