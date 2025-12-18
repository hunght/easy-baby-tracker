import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';

import { Input } from '@/components/ui/input';
import { ModalHeader } from '@/components/ModalHeader';
import { StickySaveBar } from '@/components/StickySaveBar';
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
import { useBrandColor } from '@/hooks/use-brand-color';
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
  const brandColors = useBrandColor();
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (leftTimerActive) {
      if (leftTimerRef.current) {
        clearInterval(leftTimerRef.current);
        leftTimerRef.current = null;
      }
      setLeftTimerActive(false);
    } else {
      // Stop right timer if active
      if (rightTimerActive) {
        if (rightTimerRef.current) {
          clearInterval(rightTimerRef.current);
          rightTimerRef.current = null;
        }
        setRightTimerActive(false);
      }
      setLeftTimerActive(true);
      leftTimerRef.current = setInterval(() => {
        setLeftDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  const toggleRightTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (rightTimerActive) {
      if (rightTimerRef.current) {
        clearInterval(rightTimerRef.current);
        rightTimerRef.current = null;
      }
      setRightTimerActive(false);
    } else {
      // Stop left timer if active
      if (leftTimerActive) {
        if (leftTimerRef.current) {
          clearInterval(leftTimerRef.current);
          leftTimerRef.current = null;
        }
        setLeftTimerActive(false);
      }
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

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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

  // Quick amount presets
  const amountPresets = [30, 60, 90, 120, 150, 180];

  return (
    <View className="flex-1 bg-background">
      <ModalHeader
        title={isEditing ? t('pumping.editTitle') : t('pumping.title')}
        closeLabel={t('common.close')}
      />

      <ScrollView
        contentContainerClassName="p-5 pb-28"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Inventory */}
        <View className="mb-6 flex-row items-center gap-2 rounded-xl bg-muted/30 p-4">
          <MaterialCommunityIcons name="package-variant" size={20} color="#666" />
          <Text className="flex-1 text-base font-medium text-muted-foreground">
            {t('common.inventory')}
          </Text>
          <Text className="text-lg font-bold text-accent">
            {inventory.toFixed(0)} {t('common.unitMl')}
          </Text>
        </View>

        {/* Starts */}
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-base font-medium text-muted-foreground">{t('common.starts')}</Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowTimePicker(true);
            }}
            className="rounded-lg bg-muted/30 px-4 py-2">
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
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-base font-medium text-muted-foreground">{t('common.amount')}</Text>
          <Text className="text-lg font-bold text-accent">
            {totalAmount.toFixed(0)} {t('common.unitMl')}
          </Text>
        </View>

        {/* Left Amount */}
        <View className="mb-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-base font-medium text-foreground">{t('pumping.left')}</Text>
            <Text className="text-base font-semibold text-accent">
              {leftAmountMl.toFixed(0)} {t('common.unitMl')}
            </Text>
          </View>

          {/* Quick presets for left */}
          <View className="mb-3 flex-row flex-wrap justify-between gap-2">
            {amountPresets.map((preset) => (
              <Pressable
                key={`left-${preset}`}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLeftAmountMl(preset);
                }}
                className={`h-10 w-[30%] items-center justify-center rounded-xl border ${leftAmountMl === preset ? 'border-accent bg-accent' : 'border-border bg-muted/30'
                  }`}>
                <Text
                  className={`text-sm font-semibold ${leftAmountMl === preset ? 'text-white' : 'text-foreground'
                    }`}>
                  {preset}
                </Text>
              </Pressable>
            ))}
          </View>

          <Slider
            style={{ width: '100%', height: 48 }}
            minimumValue={0}
            maximumValue={350}
            step={5}
            value={leftAmountMl}
            onValueChange={setLeftAmountMl}
            minimumTrackTintColor={brandColors.colors.accent}
            maximumTrackTintColor="#E0E0E0"
            thumbTintColor={brandColors.colors.white}
          />
          <View className="flex-row justify-between px-1">
            {[0, 100, 200, 300].map((value) => (
              <Text key={value} className="text-xs text-muted-foreground">
                {value}
              </Text>
            ))}
          </View>
        </View>

        {/* Right Amount */}
        <View className="mb-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-base font-medium text-foreground">{t('pumping.right')}</Text>
            <Text className="text-base font-semibold text-accent">
              {rightAmountMl.toFixed(0)} {t('common.unitMl')}
            </Text>
          </View>

          {/* Quick presets for right */}
          <View className="mb-3 flex-row flex-wrap justify-between gap-2">
            {amountPresets.map((preset) => (
              <Pressable
                key={`right-${preset}`}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRightAmountMl(preset);
                }}
                className={`h-10 w-[30%] items-center justify-center rounded-xl border ${rightAmountMl === preset ? 'border-accent bg-accent' : 'border-border bg-muted/30'
                  }`}>
                <Text
                  className={`text-sm font-semibold ${rightAmountMl === preset ? 'text-white' : 'text-foreground'
                    }`}>
                  {preset}
                </Text>
              </Pressable>
            ))}
          </View>

          <Slider
            style={{ width: '100%', height: 48 }}
            minimumValue={0}
            maximumValue={350}
            step={5}
            value={rightAmountMl}
            onValueChange={setRightAmountMl}
            minimumTrackTintColor={brandColors.colors.accent}
            maximumTrackTintColor="#E0E0E0"
            thumbTintColor={brandColors.colors.white}
          />
          <View className="flex-row justify-between px-1">
            {[0, 100, 200, 300].map((value) => (
              <Text key={value} className="text-xs text-muted-foreground">
                {value}
              </Text>
            ))}
          </View>
        </View>

        {/* Duration */}
        {isEditing ? (
          // Edit Mode: Manual Inputs
          <View className="mb-6 gap-4">
            <View className="flex-row items-center justify-between rounded-xl bg-muted/30 px-4 py-3">
              <Text className="text-base font-medium text-foreground">
                {t('common.leftShort')}
              </Text>
              <View className="flex-row items-center gap-2">
                <Input
                  className="h-11 w-20 text-center text-lg"
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
            <View className="flex-row items-center justify-between rounded-xl bg-muted/30 px-4 py-3">
              <Text className="text-base font-medium text-foreground">
                {t('common.rightShort')}
              </Text>
              <View className="flex-row items-center gap-2">
                <Input
                  className="h-11 w-20 text-center text-lg"
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
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-base font-medium text-muted-foreground">
                {t('common.totalDuration')}
              </Text>
              <Text className="text-lg font-semibold text-accent">{formatTime(totalDuration)}</Text>
            </View>
          </View>
        ) : (
          // Create Mode: Large Timer Buttons
          <>
            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-base font-medium text-muted-foreground">
                  {t('common.duration')}
                </Text>
                <Text className="mt-0.5 text-sm text-muted-foreground">{t('common.optional')}</Text>
              </View>
              <Text className="text-lg font-semibold text-accent">{formatTime(totalDuration)}</Text>
            </View>

            {/* Large Timer Buttons */}
            <View className="mb-6 flex-row justify-around py-4">
              <View className="items-center gap-4">
                <Pressable
                  className={`h-[88px] w-[88px] items-center justify-center rounded-full ${leftTimerActive ? 'bg-red-500' : 'bg-accent'}`}
                  onPress={toggleLeftTimer}
                  style={{
                    shadowColor: leftTimerActive ? '#EF4444' : brandColors.colors.accent,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  }}>
                  <MaterialCommunityIcons
                    name={leftTimerActive ? 'pause' : 'play'}
                    size={36}
                    color="#FFF"
                  />
                </Pressable>
                <View className="items-center">
                  <Text className="text-sm font-medium text-muted-foreground">
                    {t('common.leftShort')}
                  </Text>
                  <Text className="text-xl font-bold text-foreground">
                    {formatTime(leftDuration)}
                  </Text>
                </View>
              </View>

              <View className="items-center gap-4">
                <Pressable
                  className={`h-[88px] w-[88px] items-center justify-center rounded-full ${rightTimerActive ? 'bg-red-500' : 'bg-accent'}`}
                  onPress={toggleRightTimer}
                  style={{
                    shadowColor: rightTimerActive ? '#EF4444' : brandColors.colors.accent,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  }}>
                  <MaterialCommunityIcons
                    name={rightTimerActive ? 'pause' : 'play'}
                    size={36}
                    color="#FFF"
                  />
                </Pressable>
                <View className="items-center">
                  <Text className="text-sm font-medium text-muted-foreground">
                    {t('common.rightShort')}
                  </Text>
                  <Text className="text-xl font-bold text-foreground">
                    {formatTime(rightDuration)}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Notes */}
        <Input
          className="min-h-20"
          value={notes}
          onChangeText={setNotes}
          placeholder={t('common.notesPlaceholder')}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>

      <StickySaveBar
        onPress={handleSave}
        isSaving={isSaving}
        disabled={totalAmount === 0}
      />
    </View>
  );
}
