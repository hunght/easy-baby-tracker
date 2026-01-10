import { useMutation, useQuery } from "convex/react";
import { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useState, useEffect } from "react";

import { Text } from "@/components/ui/text";
import { ModalHeader } from "@/components/ModalHeader";
import { StickySaveBar } from "@/components/StickySaveBar";
import { DateTimePickerModal } from "@/components/DateTimePickerModal";
import { api } from "@/convex/_generated/api";
import { useLocalization } from "@/localization/LocalizationProvider";
import { useNotification } from "@/components/NotificationContext";
import { requestNotificationPermissions } from "@/lib/notification-scheduler";

const ADVANCE_OPTIONS = [5, 10, 15, 30];

export default function EasyScheduleSettingsScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const { showNotification } = useNotification();
  const [firstWakeTime, setFirstWakeTime] = useState("07:00");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderAdvanceMinutes, setReminderAdvanceMinutes] = useState(5);
  const [isSaving, setIsSaving] = useState(false);

  // Get active baby profile
  const babyProfile = useQuery(api.babyProfiles.getActive);

  // Mutations
  const updateFirstWakeTime = useMutation(api.babyProfiles.updateFirstWakeTime);
  const setAppStateMutation = useMutation(api.appState.set);

  // Get app state for reminder settings
  const easyReminderState = useQuery(api.appState.get, { key: "easyScheduleReminderEnabled" });
  const advanceMinutesState = useQuery(api.appState.get, { key: "easyScheduleReminderAdvanceMinutes" });

  // Load settings
  useEffect(() => {
    if (babyProfile?.firstWakeTime) {
      setFirstWakeTime(babyProfile.firstWakeTime);
    }

    if (easyReminderState === "true") {
      setReminderEnabled(true);
    }

    if (advanceMinutesState) {
      const minutes = parseInt(advanceMinutesState, 10);
      if (!isNaN(minutes) && minutes > 0) {
        setReminderAdvanceMinutes(minutes);
      }
    }
  }, [babyProfile, easyReminderState, advanceMinutesState]);

  const openTimePicker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const [hours, minutes] = firstWakeTime.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    setTempTime(date);
    setShowTimePicker(true);
  };

  const handleTimeChange = (
    _event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (selectedDate) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const hours = selectedDate.getHours().toString().padStart(2, "0");
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
      const newTime = `${hours}:${minutes}`;
      setFirstWakeTime(newTime);
      setTempTime(selectedDate);
    }
  };

  const handleReminderToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReminderEnabled(!reminderEnabled);
  };

  const handleAdvanceChange = (minutes: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReminderAdvanceMinutes(minutes);
  };

  const handleSave = async () => {
    if (isSaving) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);

    try {
      // Save wake time
      if (babyProfile?._id && firstWakeTime !== babyProfile.firstWakeTime) {
        await updateFirstWakeTime({
          babyId: babyProfile._id,
          firstWakeTime,
        });
      }

      // Check permissions before enabling reminders
      if (reminderEnabled) {
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
          Alert.alert(
            t("easySchedule.reminder.permissionDeniedTitle"),
            t("easySchedule.reminder.permissionDeniedBody")
          );
          setIsSaving(false);
          return;
        }
      }

      // Save reminder settings
      await setAppStateMutation({
        key: "easyScheduleReminderAdvanceMinutes",
        value: String(reminderAdvanceMinutes),
      });
      await setAppStateMutation({
        key: "easyScheduleReminderEnabled",
        value: String(reminderEnabled),
      });

      showNotification(t("common.saveSuccess"), "success");
      setTimeout(() => router.back(), 500);
    } catch (error) {
      console.error("Failed to save settings:", error);
      showNotification(t("common.saveError"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ModalHeader
        title={t("easySchedule.settings.title")}
        closeLabel={t("common.close")}
      />

      <ScrollView
        contentContainerClassName="px-5 pb-28 pt-4"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Wake Time Section */}
        <View className="mb-6">
          <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("easySchedule.settings.wakeTime")}
          </Text>
          <Pressable
            onPress={openTimePicker}
            className="flex-row items-center justify-between rounded-2xl border border-border bg-card p-4"
          >
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
                <MaterialCommunityIcons
                  name="weather-sunset-up"
                  size={24}
                  color="#F97316"
                />
              </View>
              <View>
                <Text className="text-sm text-muted-foreground">
                  {t("easySchedule.firstWakeTimeTitle")}
                </Text>
                <Text className="text-xl font-bold text-foreground">
                  {firstWakeTime}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
          </Pressable>
        </View>

        {/* Reminder Settings Section */}
        <View className="mb-6">
          <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("easySchedule.settings.reminders")}
          </Text>
          <View className="rounded-2xl border border-border bg-card">
            {/* Enable Toggle */}
            <Pressable
              onPress={handleReminderToggle}
              className="flex-row items-center justify-between p-4"
            >
              <View className="flex-1 flex-row items-center gap-3">
                <View
                  className={`h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    reminderEnabled ? "bg-accent/20" : "bg-muted/50"
                  }`}
                >
                  <MaterialCommunityIcons
                    name="bell-ring-outline"
                    size={24}
                    color={reminderEnabled ? "#7C3AED" : "#999"}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">
                    {t("easySchedule.settings.enableReminders")}
                  </Text>
                  <Text className="text-sm text-muted-foreground" numberOfLines={2}>
                    {t("easySchedule.settings.enableRemindersDescription")}
                  </Text>
                </View>
              </View>
              <View
                className={`ml-3 h-8 w-14 shrink-0 rounded-full p-1 ${
                  reminderEnabled ? "bg-accent" : "bg-muted"
                }`}
              >
                <View
                  className={`h-6 w-6 rounded-full bg-white shadow-sm ${
                    reminderEnabled ? "ml-auto" : "mr-auto"
                  }`}
                />
              </View>
            </Pressable>

            {/* Advance Time Options */}
            {reminderEnabled && (
              <View className="border-t border-border p-4">
                <Text className="mb-3 text-sm font-semibold text-foreground">
                  {t("easySchedule.settings.reminderAdvance")}
                </Text>
                <View className="flex-row gap-2">
                  {ADVANCE_OPTIONS.map((minutes) => (
                    <Pressable
                      key={minutes}
                      onPress={() => handleAdvanceChange(minutes)}
                      className={`h-12 flex-1 items-center justify-center rounded-xl ${
                        reminderAdvanceMinutes === minutes
                          ? "bg-accent"
                          : "border border-border bg-muted/30"
                      }`}
                    >
                      <Text
                        className={`text-base font-semibold ${
                          reminderAdvanceMinutes === minutes
                            ? "text-white"
                            : "text-foreground"
                        }`}
                      >
                        {minutes}m
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <StickySaveBar onPress={handleSave} isSaving={isSaving} />

      {/* Time Picker Modal */}
      <DateTimePickerModal
        visible={showTimePicker}
        value={tempTime}
        mode="time"
        onClose={() => setShowTimePicker(false)}
        onChange={handleTimeChange}
      />
    </View>
  );
}
