import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useBrandColor } from '@/hooks/use-brand-color';
import {
  EASY_FORMULA_RULES,
  EasyFormulaRuleId,
  getEasyFormulaRuleById,
} from '@/lib/easy-schedule-generator';
import { useLocalization } from '@/localization/LocalizationProvider';

const TODDLER_WAKE_WINDOW_KEYS: string[] = [
  'easySchedule.toddlerExtras.wakeWindows.morning',
  'easySchedule.toddlerExtras.wakeWindows.afternoon',
  'easySchedule.toddlerExtras.wakeWindows.nap',
];

const TODDLER_SAMPLE_DAY_KEYS: readonly { titleKey: string; detailKey: string }[] = [
  {
    titleKey: 'easySchedule.toddlerExtras.sampleDay.wakeEat.title',
    detailKey: 'easySchedule.toddlerExtras.sampleDay.wakeEat.detail',
  },
  {
    titleKey: 'easySchedule.toddlerExtras.sampleDay.morningActivity.title',
    detailKey: 'easySchedule.toddlerExtras.sampleDay.morningActivity.detail',
  },
  {
    titleKey: 'easySchedule.toddlerExtras.sampleDay.nap.title',
    detailKey: 'easySchedule.toddlerExtras.sampleDay.nap.detail',
  },
  {
    titleKey: 'easySchedule.toddlerExtras.sampleDay.lunch.title',
    detailKey: 'easySchedule.toddlerExtras.sampleDay.lunch.detail',
  },
  {
    titleKey: 'easySchedule.toddlerExtras.sampleDay.afternoonActivity.title',
    detailKey: 'easySchedule.toddlerExtras.sampleDay.afternoonActivity.detail',
  },
  {
    titleKey: 'easySchedule.toddlerExtras.sampleDay.dinner.title',
    detailKey: 'easySchedule.toddlerExtras.sampleDay.dinner.detail',
  },
  {
    titleKey: 'easySchedule.toddlerExtras.sampleDay.bedtimeRoutine.title',
    detailKey: 'easySchedule.toddlerExtras.sampleDay.bedtimeRoutine.detail',
  },
  {
    titleKey: 'easySchedule.toddlerExtras.sampleDay.nightSleep.title',
    detailKey: 'easySchedule.toddlerExtras.sampleDay.nightSleep.detail',
  },
];

const TODDLER_SAMPLE_OUTPUT_ROWS: string[] = ['wake630', 'wake700', 'wake730'];

const TODDLER_NOTES_KEYS = [
  'easySchedule.toddlerExtras.notes.singleNap',
  'easySchedule.toddlerExtras.notes.shiftNap',
  'easySchedule.toddlerExtras.notes.shortenNap',
  'easySchedule.toddlerExtras.notes.totalSleep',
];

export default function EasyScheduleInfoScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const brandColors = useBrandColor();
  const params = useLocalSearchParams<{ ruleId?: EasyFormulaRuleId }>();
  const requestedRuleId = params.ruleId;
  const availableRuleIds = EASY_FORMULA_RULES.map((rule) => rule.id);
  const fallbackRuleId: EasyFormulaRuleId = 'newborn';
  const ruleId: EasyFormulaRuleId =
    requestedRuleId && availableRuleIds.includes(requestedRuleId)
      ? requestedRuleId
      : fallbackRuleId;

  const formulaRule = getEasyFormulaRuleById(ruleId);

  const formulaRows = [
    { label: t('easySchedule.formulaTable.labels.cycle'), value: t(formulaRule.cycleKey) },
    { label: t('easySchedule.formulaTable.labels.eat'), value: t(formulaRule.eatKey) },
    { label: t('easySchedule.formulaTable.labels.activity'), value: t(formulaRule.activityKey) },
    { label: t('easySchedule.formulaTable.labels.sleep'), value: t(formulaRule.sleepKey) },
    { label: t('easySchedule.formulaTable.labels.yourTime'), value: t(formulaRule.yourTimeKey) },
  ];

  const logicNotes = formulaRule.logicKeys
    .map((key) => ({ key, text: t(key) }))
    .filter(({ key, text }) => text && text !== key)
    .map(({ text }) => text);

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border bg-card px-5 py-4">
        <Pressable
          onPress={() => router.back()}
          className="p-1"
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}>
          <Ionicons name="close" size={28} color={brandColors.colors.black} />
        </Pressable>
        <Text className="text-lg font-semibold text-foreground">{t('easySchedule.infoTitle')}</Text>
        <View className="w-7" />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-5">
        {/* Title Card */}
        <View className="mb-4 items-center rounded-lg bg-card p-5">
          <View className="mb-3">
            <Text className="text-4xl font-bold" style={{ letterSpacing: 2 }}>
              <Text style={{ color: brandColors.colors.accent }}>E.</Text>
              <Text style={{ color: brandColors.colors.secondary }}>A.</Text>
              <Text style={{ color: brandColors.colors.mint }}>S.</Text>
              <Text style={{ color: brandColors.colors.mint }}>Y.</Text>
              <Text style={{ color: brandColors.colors.lavender }}>3</Text>
            </Text>
          </View>
          <Text className="mb-1 text-center text-xl font-semibold text-foreground">
            {t(formulaRule.labelKey)}
          </Text>
          <Text className="text-center text-sm text-muted-foreground">
            {t(formulaRule.ageRangeKey)}
          </Text>
        </View>

        {/* Formula Details */}
        <View className="mb-4 rounded-lg bg-card p-5">
          <Text className="mb-3 text-lg font-semibold text-foreground">
            {t('easySchedule.formulaTable.heading')}
          </Text>
          {formulaRows.map((row) => (
            <View key={row.label} className="flex-row justify-between border-b border-border py-2">
              <Text className="flex-1 text-sm font-semibold text-muted-foreground">
                {row.label}
              </Text>
              <Text className="flex-[2] text-sm text-foreground">{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Logic Notes */}
        {logicNotes.length > 0 && (
          <View className="mb-4 rounded-lg bg-card p-5">
            <Text className="mb-3 text-lg font-semibold text-foreground">
              {t('easySchedule.formulaTable.labels.logic')}
            </Text>
            {logicNotes.map((note, index) => (
              <Text
                key={`${note}-${index}`}
                className="mb-2 text-sm leading-5 text-muted-foreground">
                • {note}
              </Text>
            ))}
          </View>
        )}

        {/* Toddler-specific content */}
        {formulaRule.id === 'toddler' && (
          <>
            <View className="mb-4 rounded-lg bg-card p-5">
              <Text className="mb-3 text-lg font-semibold text-foreground">
                {t('easySchedule.toddlerExtras.wakeWindowsHeading')}
              </Text>
              {TODDLER_WAKE_WINDOW_KEYS.map((key) => (
                <Text key={key} className="mb-2 text-sm leading-5 text-muted-foreground">
                  • {t(key)}
                </Text>
              ))}
            </View>

            <View className="mb-4 rounded-lg bg-card p-5">
              <Text className="mb-3 text-lg font-semibold text-foreground">
                {t('easySchedule.toddlerExtras.sampleDayHeading')}
              </Text>
              {TODDLER_SAMPLE_DAY_KEYS.map((entry) => (
                <View key={entry.titleKey} className="mb-3">
                  <Text className="mb-1 text-sm font-semibold text-foreground">
                    {t(entry.titleKey)}
                  </Text>
                  <Text className="text-sm text-muted-foreground">{t(entry.detailKey)}</Text>
                </View>
              ))}
            </View>

            <View className="mb-4 rounded-lg bg-card p-5">
              <Text className="mb-3 text-lg font-semibold text-foreground">
                {t('easySchedule.toddlerExtras.sampleOutputsHeading')}
              </Text>
              <View className="overflow-hidden rounded-lg border border-border">
                <View className="flex-row border-b border-border bg-muted">
                  <Text className="flex-1 p-2 text-center text-xs font-semibold text-foreground">
                    {t('easySchedule.toddlerExtras.sampleOutputs.tableHeaders.wakeTime')}
                  </Text>
                  <Text className="flex-1 p-2 text-center text-xs font-semibold text-foreground">
                    {t('easySchedule.toddlerExtras.sampleOutputs.tableHeaders.napTime')}
                  </Text>
                  <Text className="flex-1 p-2 text-center text-xs font-semibold text-foreground">
                    {t('easySchedule.toddlerExtras.sampleOutputs.tableHeaders.napLength')}
                  </Text>
                  <Text className="flex-1 p-2 text-center text-xs font-semibold text-foreground">
                    {t('easySchedule.toddlerExtras.sampleOutputs.tableHeaders.bedtime')}
                  </Text>
                </View>
                {TODDLER_SAMPLE_OUTPUT_ROWS.map((rowKey) => (
                  <View key={rowKey} className="flex-row border-b border-border">
                    <Text className="flex-1 p-2 text-center text-xs text-muted-foreground">
                      {t(`easySchedule.toddlerExtras.sampleOutputs.rows.${rowKey}.wakeTime`)}
                    </Text>
                    <Text className="flex-1 p-2 text-center text-xs text-muted-foreground">
                      {t(`easySchedule.toddlerExtras.sampleOutputs.rows.${rowKey}.napTime`)}
                    </Text>
                    <Text className="flex-1 p-2 text-center text-xs text-muted-foreground">
                      {t(`easySchedule.toddlerExtras.sampleOutputs.rows.${rowKey}.napLength`)}
                    </Text>
                    <Text className="flex-1 p-2 text-center text-xs text-muted-foreground">
                      {t(`easySchedule.toddlerExtras.sampleOutputs.rows.${rowKey}.bedtime`)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="mb-4 rounded-lg bg-card p-5">
              <Text className="mb-3 text-lg font-semibold text-foreground">
                {t('easySchedule.toddlerExtras.notesHeading')}
              </Text>
              {TODDLER_NOTES_KEYS.map((key) => (
                <Text key={key} className="mb-2 text-sm leading-5 text-muted-foreground">
                  • {t(key)}
                </Text>
              ))}
            </View>
          </>
        )}

        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
