import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { ModalHeader } from "@/components/ModalHeader";
import { StickySaveBar } from "@/components/StickySaveBar";
import { useNotification } from "@/components/NotificationContext";
import { Text } from "@/components/ui/text";
import { TimePickerField } from "@/components/TimePickerField";
import { api } from "@/convex/_generated/api";
import type { DiaperKind, PoopColor } from "@/database/diaper";
import { useLocalization } from "@/localization/LocalizationProvider";

type DiaperTypeOption = {
  key: DiaperKind;
  labelKey: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

// Zod schema for PoopColor validation
const poopColorSchema = z.enum([
  "yellow",
  "brown",
  "olive_green",
  "dark_green",
  "red",
  "black",
  "white",
]);

const diaperTypes: DiaperTypeOption[] = [
  { key: "wet", labelKey: "diaper.types.wet", icon: "water-outline" },
  { key: "dirty", labelKey: "diaper.types.soiled", icon: "triangle-outline" },
  { key: "mixed", labelKey: "diaper.types.mixed", icon: "water-alert-outline" },
  { key: "dry", labelKey: "diaper.types.dry", icon: "water-off-outline" },
];

const poopColors: { key: PoopColor; labelKey: string; color: string }[] = [
  { key: "yellow", labelKey: "diaper.poopColors.yellow", color: "#FFD700" },
  { key: "brown", labelKey: "diaper.poopColors.brown", color: "#8B4513" },
  {
    key: "olive_green",
    labelKey: "diaper.poopColors.olive_green",
    color: "#808000",
  },
  {
    key: "dark_green",
    labelKey: "diaper.poopColors.dark_green",
    color: "#006400",
  },
  { key: "red", labelKey: "diaper.poopColors.red", color: "#FF0000" },
  { key: "black", labelKey: "diaper.poopColors.black", color: "#000000" },
  { key: "white", labelKey: "diaper.poopColors.white", color: "#F5F5DC" },
];

export default function DiaperScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const { showNotification } = useNotification();
  const params = useLocalSearchParams<{ id: string }>();
  const changeId = params.id;
  const isEditing = !!changeId;

  const [diaperKind, setDiaperKind] = useState<DiaperKind>("wet");
  const [time, setTime] = useState(new Date());
  const [wetness, setWetness] = useState<number | undefined>(undefined);
  const [color, setColor] = useState<PoopColor | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Get active baby profile
  const profile = useQuery(api.babyProfiles.getActive);

  // Fetch existing data if editing
  const existingData = useQuery(
    api.diaperChanges.getById,
    changeId ? { diaperChangeId: changeId as any } : "skip"
  );

  // Convex mutations
  const createChange = useMutation(api.diaperChanges.create);
  const updateChange = useMutation(api.diaperChanges.update);

  const isLoadingData = isEditing && existingData === undefined;

  // Populate state when data is loaded
  useEffect(() => {
    if (existingData) {
      if (
        existingData.kind === "wet" ||
        existingData.kind === "dirty" ||
        existingData.kind === "mixed" ||
        existingData.kind === "dry"
      ) {
        setDiaperKind(existingData.kind);
      }
      setTime(new Date(existingData.time * 1000));
      setWetness(existingData.wetness ?? undefined);
      const loadedColor = poopColorSchema.safeParse(existingData.color).data;
      setColor(loadedColor);
      setNotes(existingData.notes ?? "");
    }
  }, [existingData]);

  const handleDiaperKindChange = (kind: DiaperKind) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDiaperKind(kind);
  };

  const handleWetnessChange = (level: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWetness(wetness === level ? undefined : level);
  };

  const handleColorChange = (colorKey: PoopColor) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setColor(color === colorKey ? undefined : colorKey);
  };

  const handleSave = async () => {
    if (isSaving || !profile?._id) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsSaving(true);
    try {
      const payload = {
        babyId: profile._id,
        kind: diaperKind,
        time: Math.floor(time.getTime() / 1000),
        wetness: wetness,
        color: color,
        notes: notes || undefined,
      };

      if (isEditing && changeId) {
        await updateChange({ diaperChangeId: changeId as any, ...payload });
      } else {
        await createChange(payload);
      }

      showNotification(t("common.saveSuccess"), "success");
      setTimeout(() => router.back(), 500);
    } catch (error) {
      console.error("Failed to save diaper change:", error);
      showNotification(t("common.saveError"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing && isLoadingData) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#FF5C8D" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
      className="bg-background"
    >
      <View className="flex-1 bg-background">
        <ModalHeader
          title={isEditing ? t("diaper.editTitle") : t("diaper.title")}
          closeLabel={t("common.close")}
        />

        <ScrollView
          contentContainerClassName="p-5 pb-28"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Diaper Type Selection - Large touch targets */}
          <View className="mb-6 gap-3">
            <Text className="text-base font-medium text-muted-foreground">
              {t("diaper.selectType")}
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {diaperTypes.map((type) => (
                <Pressable
                  key={type.key}
                  onPress={() => handleDiaperKindChange(type.key)}
                  className={`h-14 w-[47%] flex-row items-center justify-center gap-2 rounded-xl border-2 ${
                    diaperKind === type.key
                      ? "border-accent bg-accent"
                      : "border-border bg-muted/30"
                  }`}
                >
                  <MaterialCommunityIcons
                    name={type.icon}
                    size={22}
                    color={diaperKind === type.key ? "#FFF" : "#666"}
                  />
                  <Text
                    className={`text-base font-semibold ${
                      diaperKind === type.key ? "text-white" : "text-foreground"
                    }`}
                  >
                    {t(type.labelKey)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Time */}
          <TimePickerField value={time} onChange={setTime} isEditing={isEditing} />

          {/* Wetness (Optional) */}
          {diaperKind !== "dry" && (
            <View className="mb-6">
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-base font-medium text-muted-foreground">
                  {t("common.wetness")}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {t("common.optional")}
                </Text>
              </View>
              <View className="flex-row gap-4">
                {[1, 2, 3].map((level) => (
                  <Pressable
                    key={level}
                    onPress={() => handleWetnessChange(level)}
                    className={`h-14 flex-1 flex-row items-center justify-center gap-2 rounded-xl border-2 ${
                      wetness && wetness >= level
                        ? "border-accent bg-accent/20"
                        : "border-border bg-muted/30"
                    }`}
                  >
                    {Array.from({ length: level }).map((_, i) => (
                      <MaterialCommunityIcons
                        key={i}
                        name="water"
                        size={22}
                        color={wetness && wetness >= level ? "#FF5C8D" : "#CCCCCC"}
                      />
                    ))}
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Color of Poop (Optional) */}
          {(diaperKind === "dirty" || diaperKind === "mixed") && (
            <View className="mb-6">
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-base font-medium text-muted-foreground">
                  {t("common.colorOfPoop")}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {t("common.optional")}
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-4">
                {poopColors.map((colorOption) => (
                  <Pressable
                    key={colorOption.key}
                    onPress={() => handleColorChange(colorOption.key)}
                    className={`h-14 w-14 items-center justify-center rounded-full ${
                      color === colorOption.key
                        ? "border-[3px] border-accent"
                        : "border-2 border-border"
                    }`}
                    style={{ backgroundColor: colorOption.color }}
                  >
                    {color === colorOption.key && (
                      <MaterialCommunityIcons
                        name="check"
                        size={20}
                        color="#FFF"
                      />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          )}

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

        <StickySaveBar onPress={handleSave} isSaving={isSaving} />
      </View>
    </KeyboardAvoidingView>
  );
}
