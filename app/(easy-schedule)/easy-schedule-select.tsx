import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, ActivityIndicator, Pressable, ScrollView, View } from "react-native";

import { ModalHeader } from "@/components/ModalHeader";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useBrandColor } from "@/hooks/use-brand-color";
import { useLocalization } from "@/localization/LocalizationProvider";

type FormulaRule = {
  _id: string;
  ruleId: string;
  labelKey?: string | null;
  labelText?: string | null;
  ageRangeKey?: string | null;
  ageRangeText?: string | null;
  minWeeks: number;
  maxWeeks?: number | null;
  isCustom: boolean;
  babyId?: string | null;
};

export default function EasyScheduleSelectScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const brandColors = useBrandColor();
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);

  // Get active baby profile
  const babyProfile = useQuery(api.babyProfiles.getActive);

  // Get all formula rules
  const allRules = useQuery(
    api.easyFormulaRules.list,
    babyProfile?._id ? { babyId: babyProfile._id } : "skip"
  );

  // Mutations
  const updateSelectedFormula = useMutation(api.babyProfiles.updateSelectedEasyFormula);
  const deleteCustomRule = useMutation(api.easyFormulaRules.remove);

  const isLoading = babyProfile === undefined || allRules === undefined;

  // Separate rules into predefined and custom
  const { predefinedRules, customRules } = useMemo(() => {
    if (!allRules) return { predefinedRules: [], customRules: [] };

    const predefined: FormulaRule[] = [];
    const custom: FormulaRule[] = [];

    allRules.forEach((rule) => {
      const formattedRule: FormulaRule = {
        _id: rule._id,
        ruleId: rule.ruleId,
        labelKey: rule.labelKey,
        labelText: rule.labelText,
        ageRangeKey: rule.ageRangeKey,
        ageRangeText: rule.ageRangeText,
        minWeeks: rule.minWeeks,
        maxWeeks: rule.maxWeeks,
        isCustom: rule.isCustom,
        babyId: rule.babyId,
      };

      if (rule.isCustom) {
        custom.push(formattedRule);
      } else {
        predefined.push(formattedRule);
      }
    });

    return { predefinedRules: predefined, customRules: custom };
  }, [allRules]);

  const selectedFormulaId = babyProfile?.selectedEasyFormulaId;

  // Helper to get rule display name
  const getRuleName = (rule: FormulaRule) => {
    if (rule.labelText) return rule.labelText;
    if (rule.labelKey) {
      const translated = t(rule.labelKey);
      if (translated !== rule.labelKey) return translated;
    }
    return rule.ruleId;
  };

  // Helper to get age range text
  const getAgeRange = (rule: FormulaRule) => {
    if (rule.ageRangeText) return rule.ageRangeText;
    if (rule.ageRangeKey) {
      const translated = t(rule.ageRangeKey);
      if (translated !== rule.ageRangeKey) return translated;
    }
    if (rule.maxWeeks) {
      return `${rule.minWeeks}-${rule.maxWeeks} weeks`;
    }
    return `${rule.minWeeks}+ weeks`;
  };

  const handleSelectFormula = async (ruleId: string) => {
    if (!babyProfile?._id) return;

    try {
      await updateSelectedFormula({
        babyId: babyProfile._id,
        selectedEasyFormulaId: ruleId,
      });
      router.back();
    } catch (error) {
      console.error("Failed to select formula:", error);
    }
  };

  const handleDeleteRule = (rule: FormulaRule) => {
    Alert.alert(
      t("easySchedule.deleteFormula.title"),
      t("easySchedule.deleteFormula.message", {
        params: { name: getRuleName(rule) },
      }),
      [
        {
          text: t("easySchedule.deleteFormula.cancel"),
          style: "cancel",
        },
        {
          text: t("easySchedule.deleteFormula.confirm"),
          style: "destructive",
          onPress: async () => {
            if (!babyProfile?._id) return;
            setDeletingRuleId(rule.ruleId);
            try {
              await deleteCustomRule({
                ruleId: rule.ruleId,
                babyId: babyProfile._id,
              });
            } catch (error) {
              console.error("Failed to delete rule:", error);
            } finally {
              setDeletingRuleId(null);
            }
          },
        },
      ]
    );
  };

  const handleViewFormula = (ruleId: string) => {
    router.push({
      pathname: "/(easy-schedule)/easy-schedule-form",
      params: { ruleId },
    });
  };

  const handleCreateCustom = () => {
    router.push("/(easy-schedule)/easy-schedule-create");
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={brandColors.colors.primary} />
      </View>
    );
  }

  const renderFormulaItem = (rule: FormulaRule, showDelete = false) => {
    const isSelected = selectedFormulaId === rule.ruleId;
    const isDeleting = deletingRuleId === rule.ruleId;

    return (
      <Pressable
        key={rule.ruleId}
        onPress={() => handleSelectFormula(rule.ruleId)}
        disabled={isDeleting}
        className={`rounded-xl border p-4 ${
          isSelected
            ? "border-accent bg-accent/10"
            : "border-border bg-card"
        } ${isDeleting ? "opacity-50" : ""}`}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text
                className={`text-base font-semibold ${
                  isSelected ? "text-accent" : "text-foreground"
                }`}
              >
                {getRuleName(rule)}
              </Text>
              {isSelected && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={18}
                  color={brandColors.colors.accent}
                />
              )}
            </View>
            <Text className="mt-1 text-sm text-muted-foreground">
              {getAgeRange(rule)}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => handleViewFormula(rule.ruleId)}
              hitSlop={8}
              className="rounded-full bg-muted p-2"
            >
              <Ionicons name="eye-outline" size={18} color="#666" />
            </Pressable>

            {showDelete && (
              <Pressable
                onPress={() => handleDeleteRule(rule)}
                hitSlop={8}
                disabled={isDeleting}
                className="rounded-full bg-red-500/10 p-2"
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={brandColors.colors.destructive} />
                ) : (
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={brandColors.colors.destructive}
                  />
                )}
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <ModalHeader
        title={t("easySchedule.selectFormula.title")}
        closeLabel={t("common.close")}
      />

      <ScrollView
        contentContainerClassName="p-5 pb-10 gap-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Predefined Formulas */}
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>{t("easySchedule.selectFormula.predefined")}</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            {predefinedRules.length > 0 ? (
              predefinedRules.map((rule) => renderFormulaItem(rule))
            ) : (
              <Text className="text-center text-muted-foreground">
                {t("common.noItemsFound")}
              </Text>
            )}
          </CardContent>
        </Card>

        {/* Custom Formulas */}
        <Card className="rounded-lg">
          <CardHeader>
            <View className="flex-row items-center justify-between">
              <CardTitle>{t("easySchedule.selectFormula.custom")}</CardTitle>
              <Pressable
                onPress={handleCreateCustom}
                className="flex-row items-center gap-1 rounded-md bg-primary px-3 py-2"
              >
                <Ionicons name="add" size={16} color={brandColors.colors.white} />
                <Text className="text-xs font-semibold text-white">
                  {t("easySchedule.selectFormula.createNew")}
                </Text>
              </Pressable>
            </View>
          </CardHeader>
          <CardContent className="gap-3">
            {customRules.length > 0 ? (
              customRules.map((rule) => renderFormulaItem(rule, true))
            ) : (
              <View className="items-center rounded-xl border border-dashed border-border bg-muted/30 p-6">
                <MaterialCommunityIcons
                  name="playlist-plus"
                  size={32}
                  color="#9CA3AF"
                />
                <Text className="mt-2 text-center text-sm text-muted-foreground">
                  {t("easySchedule.selectFormula.noCustom")}
                </Text>
              </View>
            )}
          </CardContent>
        </Card>
      </ScrollView>
    </View>
  );
}
