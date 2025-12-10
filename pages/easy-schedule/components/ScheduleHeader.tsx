import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useBrandColor } from '@/hooks/use-brand-color';
import { useLocalization } from '@/localization/LocalizationProvider';
import type { EasyFormulaRule } from '@/lib/easy-schedule-generator';

type ScheduleHeaderProps = {
  formulaRule: EasyFormulaRule;
  onOpenTimePicker: () => void;
};

export function ScheduleHeader({
  formulaRule,
  onOpenTimePicker,
}: ScheduleHeaderProps) {
  const { t } = useLocalization();
  const router = useRouter();
  const brandColors = useBrandColor();

  return (
    <View className="flex-row items-center justify-between border-b border-border bg-background px-5 py-4">
      <Pressable onPress={() => router.back()} testID="btn-close" accessibilityRole="button">
        <Text className="text-base font-semibold text-accent">{t('common.close')}</Text>
      </Pressable>

      <Pressable
        className="mx-3 flex-1 flex-row items-center justify-center gap-2 rounded-full border border-border bg-card px-3 py-2"
        accessibilityRole="button"
        accessibilityLabel={t('easySchedule.viewDetails')}
        onPress={() =>
          router.push({
            pathname: '/(easy-schedule)/easy-schedule-select',
          })
        }>
        <View className="flex-1">
          <Text
            className="text-center text-sm font-semibold text-foreground"
            numberOfLines={1}
            ellipsizeMode="tail">
            {t(formulaRule.labelKey)}
          </Text>
          <Text
            className="text-center text-[11px] text-muted-foreground"
            numberOfLines={1}
            ellipsizeMode="tail">
            {t(formulaRule.ageRangeKey)}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={brandColors.colors.lavender} />
      </Pressable>

      <TouchableOpacity onPress={onOpenTimePicker} className="p-1" accessibilityRole="button">
        <Ionicons name="time-outline" size={24} color={brandColors.colors.lavender} />
      </TouchableOpacity>
    </View>
  );
}
