import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { Input } from "@/components/ui/input";
import { ModalHeader } from "@/components/ModalHeader";
import { StickySaveBar } from "@/components/StickySaveBar";
import { useNotification } from "@/components/NotificationContext";
import { Text } from "@/components/ui/text";
import { TimePickerField } from "@/components/TimePickerField";
import { api } from "@/convex/_generated/api";
import { useLocalization } from "@/localization/LocalizationProvider";

export default function GrowthScreen() {
  const router = useRouter();
  const { t } = useLocalization();
  const { showNotification } = useNotification();
  const params = useLocalSearchParams<{ id: string }>();
  const recordId = params.id;
  const isEditing = !!recordId;

  const [time, setTime] = useState(new Date());
  const [weightKg, setWeightKg] = useState<string>("");
  const [heightCm, setHeightCm] = useState<string>("");
  const [headCircumferenceCm, setHeadCircumferenceCm] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Get active baby profile
  const profile = useQuery(api.babyProfiles.getActive);

  // Fetch existing data if editing
  const existingData = useQuery(
    api.growthRecords.getById,
    recordId ? { growthRecordId: recordId as any } : "skip"
  );

  // Convex mutations
  const createRecord = useMutation(api.growthRecords.create);
  const updateRecord = useMutation(api.growthRecords.update);

  // Populate state when data is loaded
  useEffect(() => {
    if (existingData) {
      setTime(new Date(existingData.time * 1000));
      setWeightKg(
        existingData.weightKg
          ? existingData.weightKg.toString().replace(".", ",")
          : ""
      );
      setHeightCm(
        existingData.heightCm
          ? existingData.heightCm.toString().replace(".", ",")
          : ""
      );
      setHeadCircumferenceCm(
        existingData.headCircumferenceCm
          ? existingData.headCircumferenceCm.toString().replace(".", ",")
          : ""
      );
      setNotes(existingData.notes ?? "");
    }
  }, [existingData]);

  const parseNumericValue = (value: string): number | undefined => {
    const parsed = parseFloat(value.replace(",", "."));
    return isNaN(parsed) ? undefined : parsed;
  };

  const formatNumericValue = (value: string): string => {
    // Allow empty string, numbers, and comma as decimal separator
    if (value === "") return "";
    // Replace comma with dot for parsing, but allow user to type comma
    return value;
  };

  const handleSave = async () => {
    if (isSaving || !profile?._id) return;

    // At least one measurement should be provided
    const weight = parseNumericValue(weightKg);
    const height = parseNumericValue(heightCm);
    const headCircumference = parseNumericValue(headCircumferenceCm);

    if (!weight && !height && !headCircumference) {
      return; // Don't save if no measurements provided
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsSaving(true);
    try {
      const payload = {
        babyId: profile._id,
        time: Math.floor(time.getTime() / 1000),
        weightKg: weight,
        heightCm: height,
        headCircumferenceCm: headCircumference,
        notes: notes || undefined,
      };

      if (isEditing && recordId) {
        await updateRecord({ growthRecordId: recordId as any, ...payload });
      } else {
        await createRecord(payload);
      }

      showNotification(t("common.saveSuccess"), "success");
      setTimeout(() => router.back(), 500);
    } catch (error) {
      console.error("Failed to save growth record:", error);
      showNotification(t("common.saveError"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = () => {
    const weight = parseNumericValue(weightKg);
    const height = parseNumericValue(heightCm);
    const headCircumference = parseNumericValue(headCircumferenceCm);
    return (
      weight !== undefined ||
      height !== undefined ||
      headCircumference !== undefined
    );
  };

  const displayValue = (value: string): string => {
    if (!value) return "—";
    const num = parseNumericValue(value);
    return num !== undefined ? num.toFixed(2).replace(".", ",") : "—";
  };

  // Quick increment/decrement handlers
  const adjustValue = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    currentValue: string,
    delta: number,
    decimals: number = 2
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const current = parseNumericValue(currentValue) ?? 0;
    const newValue = Math.max(0, current + delta);
    setter(newValue.toFixed(decimals).replace(".", ","));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
      className="bg-background"
    >
      <View className="flex-1 bg-background">
        <ModalHeader
          title={isEditing ? t("growth.editTitle") : t("growth.title")}
          closeLabel={t("common.close")}
        />

        <ScrollView
          contentContainerClassName="p-5 pb-28"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Time */}
          <TimePickerField value={time} onChange={setTime} isEditing={isEditing} />

          {/* Weight Card */}
          <View className="mb-4 rounded-2xl border border-border bg-card p-4">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons
                  name="scale-bathroom"
                  size={22}
                  color="#666"
                />
                <Text className="text-base font-medium text-foreground">
                  {t("common.weight")}
                </Text>
              </View>
              <View className="flex-row items-baseline gap-1">
                <Text className="text-xl font-bold text-accent">
                  {displayValue(weightKg)}
                </Text>
                <Text className="text-base text-muted-foreground">
                  {t("common.unitKg")}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => adjustValue(setWeightKg, weightKg, -0.1)}
                className="h-12 w-12 items-center justify-center rounded-xl bg-muted/50"
              >
                <MaterialCommunityIcons name="minus" size={24} color="#666" />
              </Pressable>
              <Input
                className="h-12 flex-1 text-center text-lg"
                value={weightKg}
                onChangeText={(text) => setWeightKg(formatNumericValue(text))}
                placeholder={t("growth.placeholder")}
                keyboardType="decimal-pad"
              />
              <Pressable
                onPress={() => adjustValue(setWeightKg, weightKg, 0.1)}
                className="h-12 w-12 items-center justify-center rounded-xl bg-muted/50"
              >
                <MaterialCommunityIcons name="plus" size={24} color="#666" />
              </Pressable>
            </View>
          </View>

          {/* Height Card */}
          <View className="mb-4 rounded-2xl border border-border bg-card p-4">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons
                  name="human-male-height"
                  size={22}
                  color="#666"
                />
                <Text className="text-base font-medium text-foreground">
                  {t("common.height")}
                </Text>
              </View>
              <View className="flex-row items-baseline gap-1">
                <Text className="text-xl font-bold text-accent">
                  {displayValue(heightCm)}
                </Text>
                <Text className="text-base text-muted-foreground">
                  {t("common.unitCm")}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => adjustValue(setHeightCm, heightCm, -0.5)}
                className="h-12 w-12 items-center justify-center rounded-xl bg-muted/50"
              >
                <MaterialCommunityIcons name="minus" size={24} color="#666" />
              </Pressable>
              <Input
                className="h-12 flex-1 text-center text-lg"
                value={heightCm}
                onChangeText={(text) => setHeightCm(formatNumericValue(text))}
                placeholder={t("growth.placeholder")}
                keyboardType="decimal-pad"
              />
              <Pressable
                onPress={() => adjustValue(setHeightCm, heightCm, 0.5)}
                className="h-12 w-12 items-center justify-center rounded-xl bg-muted/50"
              >
                <MaterialCommunityIcons name="plus" size={24} color="#666" />
              </Pressable>
            </View>
          </View>

          {/* Head Circumference Card */}
          <View className="mb-4 rounded-2xl border border-border bg-card p-4">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons name="head" size={22} color="#666" />
                <Text className="text-base font-medium text-foreground">
                  {t("common.headCircumference")}
                </Text>
              </View>
              <View className="flex-row items-baseline gap-1">
                <Text className="text-xl font-bold text-accent">
                  {displayValue(headCircumferenceCm)}
                </Text>
                <Text className="text-base text-muted-foreground">
                  {t("common.unitCm")}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() =>
                  adjustValue(setHeadCircumferenceCm, headCircumferenceCm, -0.5)
                }
                className="h-12 w-12 items-center justify-center rounded-xl bg-muted/50"
              >
                <MaterialCommunityIcons name="minus" size={24} color="#666" />
              </Pressable>
              <Input
                className="h-12 flex-1 text-center text-lg"
                value={headCircumferenceCm}
                onChangeText={(text) =>
                  setHeadCircumferenceCm(formatNumericValue(text))
                }
                placeholder={t("growth.placeholder")}
                keyboardType="decimal-pad"
              />
              <Pressable
                onPress={() =>
                  adjustValue(setHeadCircumferenceCm, headCircumferenceCm, 0.5)
                }
                className="h-12 w-12 items-center justify-center rounded-xl bg-muted/50"
              >
                <MaterialCommunityIcons name="plus" size={24} color="#666" />
              </Pressable>
            </View>
          </View>

          {/* Notes */}
          <Input
            className="min-h-20"
            value={notes}
            onChangeText={setNotes}
            placeholder={t("common.notesPlaceholder")}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>

        <StickySaveBar onPress={handleSave} isSaving={isSaving} disabled={!canSave()} />
      </View>
    </KeyboardAvoidingView>
  );
}
