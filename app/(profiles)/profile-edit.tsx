import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { z } from "zod";

import { DatePickerField } from "@/components/DatePickerField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StickySaveBar } from "@/components/StickySaveBar";
import { Text } from "@/components/ui/text";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useNotification } from "@/components/NotificationContext";
import { api } from "@/convex/_generated/api";
import type { Gender } from "@/database/baby-profile";
import { useLocalization } from "@/localization/LocalizationProvider";
import { ModalHeader } from "@/components/ModalHeader";
import { deleteAvatar, pickAndUploadAvatar, getAvatarUrl } from "@/lib/avatar-storage";

const genderSegments: { key: Gender; labelKey: string }[] = [
  { key: "unknown", labelKey: "onboarding.babyProfile.genderOptions.unknown" },
  { key: "boy", labelKey: "onboarding.babyProfile.genderOptions.boy" },
  { key: "girl", labelKey: "onboarding.babyProfile.genderOptions.girl" },
];

// Zod schema for Gender validation
const genderSchema = z.enum(["unknown", "boy", "girl"]);

// Type guard using Zod validation
function isGender(value: unknown): value is Gender {
  return genderSchema.safeParse(value).success;
}

export default function ProfileEditScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { babyId } = useLocalSearchParams<{ babyId?: string }>();

  // Fetch existing profile if editing
  const existingProfile = useQuery(
    api.babyProfiles.getById,
    babyId ? { babyId: babyId as any } : "skip"
  );

  // Convex mutations
  const createProfile = useMutation(api.babyProfiles.create);
  const updateProfile = useMutation(api.babyProfiles.update);
  const setActiveProfile = useMutation(api.babyProfiles.setActive);

  const isLoading = babyId && existingProfile === undefined;

  const [nickname, setNickname] = useState(t("common.nicknamePlaceholder"));
  const [gender, setGender] = useState<Gender>("unknown");
  const [birthDate, setBirthDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(new Date());
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (existingProfile) {
      setNickname(existingProfile.nickname);
      setGender(existingProfile.gender as Gender);
      setBirthDate(new Date(existingProfile.birthDate));
      setDueDate(new Date(existingProfile.dueDate));
      setAvatarUri(existingProfile.avatarUri ?? null);
    }
  }, [existingProfile]);

  const handleTakePhoto = async () => {
    setShowPhotoModal(false);
    setPhotoProcessing(true);
    try {
      const uploadedUrl = await pickAndUploadAvatar("camera");
      if (uploadedUrl) {
        // Delete old avatar if exists
        if (avatarUri) {
          await deleteAvatar(avatarUri);
        }
        setAvatarUri(uploadedUrl);
      }
    } catch (error) {
      console.error("Error in handleTakePhoto:", error);
      showNotification(t("common.photoSaveError"), "error");
    } finally {
      setPhotoProcessing(false);
    }
  };

  const handleChoosePhoto = async () => {
    setShowPhotoModal(false);
    setPhotoProcessing(true);
    try {
      const uploadedUrl = await pickAndUploadAvatar("library");
      if (uploadedUrl) {
        // Delete old avatar if exists
        if (avatarUri) {
          await deleteAvatar(avatarUri);
        }
        setAvatarUri(uploadedUrl);
      }
    } catch (error) {
      console.error("Error in handleChoosePhoto:", error);
      showNotification(t("common.photoSaveError"), "error");
    } finally {
      setPhotoProcessing(false);
    }
  };

  const handleRemovePhoto = async () => {
    setShowPhotoModal(false);
    if (!avatarUri) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await deleteAvatar(avatarUri);
    } catch (error) {
      console.warn("Failed to delete photo", error);
    }
    setAvatarUri(null);
  };

  const handleGenderChange = (value: string | undefined) => {
    if (value && isGender(value)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setGender(value);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      setIsSaving(true);
      const payload = {
        nickname,
        gender,
        birthDate: birthDate.toISOString(),
        dueDate: dueDate.toISOString(),
        avatarUri: avatarUri ?? undefined,
        concerns: existingProfile?.concerns ?? [],
      };

      if (babyId) {
        // Editing existing profile
        await updateProfile({ babyId: babyId as any, ...payload });
        router.back();
      } else {
        // Creating new profile - set as active and navigate to homepage
        const newBabyId = await createProfile(payload);
        await setActiveProfile({ babyId: newBabyId });
        router.replace("/(tabs)/tracking");
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      showNotification(t("common.saveError"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="font-semibold text-primary">
          {t("common.loadingProfile")}
        </Text>
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
          title={babyId ? t("profileEdit.editTitle") : t("profileEdit.createTitle")}
          closeLabel={t("common.close")}
        />

        <ScrollView
          contentContainerClassName="px-5 pb-28 pt-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo Section */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowPhotoModal(true);
            }}
            disabled={photoProcessing}
            className="mb-6 items-center"
          >
            <View className="relative">
              <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-muted/30">
                {avatarUri ? (
                  <Image
                    key={avatarUri}
                    source={{ uri: getAvatarUrl(avatarUri) ?? avatarUri }}
                    style={{ width: 96, height: 96 }}
                    contentFit="cover"
                    cachePolicy="none"
                  />
                ) : (
                  <Image
                    source={require("@/assets/images/icon.png")}
                    className="h-20 w-20"
                  />
                )}
              </View>
              {/* Camera badge */}
              <View className="absolute -bottom-1 -right-1 h-8 w-8 items-center justify-center rounded-full bg-accent">
                <MaterialCommunityIcons name="camera" size={16} color="#FFF" />
              </View>
            </View>
            <Text className="mt-3 text-base font-semibold text-accent">
              {avatarUri ? t("profileEdit.changePhoto") : t("common.addPhoto")}
            </Text>
          </Pressable>

          {/* Nickname */}
          <View className="mb-5">
            <Label className="mb-2 text-base font-semibold text-muted-foreground">
              {t("common.nickname")}
            </Label>
            <Input
              value={nickname}
              onChangeText={setNickname}
              placeholder={t("common.nicknamePlaceholder")}
              className="h-12 text-base"
            />
          </View>

          {/* Gender - Full width 3-segment toggle */}
          <View className="mb-5">
            <Label className="mb-2 text-base font-semibold text-muted-foreground">
              {t("common.gender")}
            </Label>
            <ToggleGroup
              type="single"
              value={gender}
              onValueChange={handleGenderChange}
              variant="outline"
              className="w-full"
            >
              {genderSegments.map((segment, index) => (
                <ToggleGroupItem
                  key={segment.key}
                  value={segment.key}
                  isFirst={index === 0}
                  isLast={index === genderSegments.length - 1}
                  className="flex-1"
                  aria-label={t(segment.labelKey)}
                >
                  <Text className="text-base font-semibold">
                    {t(segment.labelKey)}
                  </Text>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </View>

          {/* Birthdate - Full row tappable */}
          <View className="mb-5">
            <DatePickerField
              label={t("common.birthdate")}
              value={birthDate}
              onChange={setBirthDate}
            />
          </View>

          {/* Due Date - Full row tappable */}
          <View className="mb-5">
            <DatePickerField
              label={t("common.dueDate")}
              value={dueDate}
              onChange={setDueDate}
            />
          </View>

          {/* Info Text */}
          <Text className="text-sm leading-relaxed text-muted-foreground">
            {t("profileEdit.info")}
          </Text>
        </ScrollView>

        {/* Photo Selection Modal - Bottom Sheet Style */}
        <Modal
          visible={showPhotoModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPhotoModal(false)}
        >
          <Pressable
            className="flex-1 justify-end bg-black/50"
            onPress={() => setShowPhotoModal(false)}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View className="rounded-t-3xl bg-card px-5 pb-10 pt-6">
                <Text className="mb-4 text-center text-lg font-bold text-foreground">
                  {t("profileEdit.photoOptions")}
                </Text>

                <Pressable
                  onPress={handleTakePhoto}
                  className="mb-3 h-14 flex-row items-center justify-center gap-3 rounded-xl bg-accent"
                >
                  <MaterialCommunityIcons name="camera" size={22} color="#FFF" />
                  <Text className="text-base font-semibold text-white">
                    {t("diary.takePhoto")}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleChoosePhoto}
                  className="mb-3 h-14 flex-row items-center justify-center gap-3 rounded-xl bg-muted"
                >
                  <MaterialCommunityIcons
                    name="image-multiple"
                    size={22}
                    color="#666"
                  />
                  <Text className="text-base font-semibold text-foreground">
                    {t("diary.choosePhoto")}
                  </Text>
                </Pressable>

                {avatarUri && (
                  <Pressable
                    onPress={handleRemovePhoto}
                    className="mb-3 h-14 flex-row items-center justify-center gap-3 rounded-xl bg-red-500/10"
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={22}
                      color="#EF4444"
                    />
                    <Text className="text-base font-semibold text-red-500">
                      {t("diary.removePhoto")}
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={() => setShowPhotoModal(false)}
                  className="h-14 items-center justify-center rounded-xl"
                >
                  <Text className="text-base font-semibold text-muted-foreground">
                    {t("common.cancel")}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <StickySaveBar
          onPress={handleSave}
          isSaving={isSaving}
          disabled={!nickname.trim()}
          label={babyId ? t("common.saveChanges") : t("common.continue")}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
