import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useBrandColor } from '@/hooks/use-brand-color';
import { useLocalization } from '@/localization/LocalizationProvider';
import type { EasyFormulaRule } from '@/lib/easy-schedule-generator';

type ScheduleHeaderProps = {
  formulaRule: EasyFormulaRule;
};

export function ScheduleHeader({ formulaRule }: ScheduleHeaderProps) {
  const { t } = useLocalization();
  const router = useRouter();
  const brandColors = useBrandColor();

  // Check if this is a day-specific rule (has validDate)
  const isDaySpecific = !!formulaRule.validDate;

  // Get the source rule's name for day-specific rules
  const getSourceRuleName = () => {
    if (formulaRule.sourceRuleLabelText) return formulaRule.sourceRuleLabelText;
    if (formulaRule.sourceRuleLabelKey) return t(formulaRule.sourceRuleLabelKey);
    return null;
  };

  // Get display name - for day-specific rules, show original name + "(Custom)"
  const getDisplayName = () => {
    if (isDaySpecific) {
      const sourceName = getSourceRuleName();
      if (sourceName) {
        return `${sourceName} (${t('easySchedule.formulaGroups.custom', { defaultValue: 'Custom' })})`;
      }
      return t('easySchedule.todaysSchedule', { defaultValue: "Today's Custom Schedule" });
    }
    if (formulaRule.labelText) return formulaRule.labelText;
    if (formulaRule.labelKey) return t(formulaRule.labelKey);
    return '';
  };

  // Get age range - for day-specific rules, show the date
  const getAgeRange = () => {
    if (isDaySpecific && formulaRule.validDate) {
      // Format the date nicely (e.g., "Jan 10, 2026")
      const date = new Date(formulaRule.validDate);
      const formattedDate = date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      return t('easySchedule.customForDate', {
        defaultValue: 'Custom for {{date}}',
      }).replace('{{date}}', formattedDate);
    }
    if (formulaRule.ageRangeText) return formulaRule.ageRangeText;
    if (formulaRule.ageRangeKey) return t(formulaRule.ageRangeKey);
    return '';
  };

  return (
    <View className="flex-row items-center justify-between border-b border-border bg-background px-5 py-2">
      <View className="w-10" />
      <Pressable
        className="flex-1 flex-row items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5"
        accessibilityRole="button"
        accessibilityLabel={t('easySchedule.viewDetails')}
        onPress={() =>
          router.push({
            pathname: '/(easy-schedule)/easy-schedule-select',
          })
        }>
        <View className="flex-1">
          <Text
            className="text-center text-xs font-semibold text-foreground"
            numberOfLines={1}
            ellipsizeMode="tail">
            {getDisplayName()}
          </Text>
          <Text
            className="text-center text-[10px] text-muted-foreground"
            numberOfLines={1}
            ellipsizeMode="tail">
            {getAgeRange()}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color={brandColors.colors.lavender} />
      </Pressable>
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: '/(easy-schedule)/easy-schedule-settings',
          })
        }
        className="w-10 items-center justify-center p-1"
        accessibilityRole="button"
        accessibilityLabel={t('easySchedule.settings.title')}>
        <Ionicons name="settings-outline" size={20} />
      </TouchableOpacity>
    </View>
  );
}
