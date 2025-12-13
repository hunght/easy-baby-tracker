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
            {t(formulaRule.labelKey)}
          </Text>
          <Text
            className="text-center text-[10px] text-muted-foreground"
            numberOfLines={1}
            ellipsizeMode="tail">
            {t(formulaRule.ageRangeKey)}
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
        <Ionicons name="settings-outline" size={20} color={brandColors.colors.lavender} />
      </TouchableOpacity>
    </View>
  );
}
