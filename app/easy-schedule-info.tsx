import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    EASY_FORMULA_RULES,
    EasyFormulaRuleId,
    getEasyFormulaRuleById,
} from '@/lib/easy-schedule-generator';
import { useLocalization } from '@/localization/LocalizationProvider';

const TODDLER_WAKE_WINDOW_KEYS = [
    'easySchedule.toddlerExtras.wakeWindows.morning',
    'easySchedule.toddlerExtras.wakeWindows.afternoon',
    'easySchedule.toddlerExtras.wakeWindows.nap',
] as const;

const TODDLER_SAMPLE_DAY_KEYS: readonly { titleKey: string; detailKey: string }[] = [
    { titleKey: 'easySchedule.toddlerExtras.sampleDay.wakeEat.title', detailKey: 'easySchedule.toddlerExtras.sampleDay.wakeEat.detail' },
    { titleKey: 'easySchedule.toddlerExtras.sampleDay.morningActivity.title', detailKey: 'easySchedule.toddlerExtras.sampleDay.morningActivity.detail' },
    { titleKey: 'easySchedule.toddlerExtras.sampleDay.nap.title', detailKey: 'easySchedule.toddlerExtras.sampleDay.nap.detail' },
    { titleKey: 'easySchedule.toddlerExtras.sampleDay.lunch.title', detailKey: 'easySchedule.toddlerExtras.sampleDay.lunch.detail' },
    { titleKey: 'easySchedule.toddlerExtras.sampleDay.afternoonActivity.title', detailKey: 'easySchedule.toddlerExtras.sampleDay.afternoonActivity.detail' },
    { titleKey: 'easySchedule.toddlerExtras.sampleDay.dinner.title', detailKey: 'easySchedule.toddlerExtras.sampleDay.dinner.detail' },
    { titleKey: 'easySchedule.toddlerExtras.sampleDay.bedtimeRoutine.title', detailKey: 'easySchedule.toddlerExtras.sampleDay.bedtimeRoutine.detail' },
    { titleKey: 'easySchedule.toddlerExtras.sampleDay.nightSleep.title', detailKey: 'easySchedule.toddlerExtras.sampleDay.nightSleep.detail' },
] as const;

const TODDLER_SAMPLE_OUTPUT_ROWS = ['wake630', 'wake700', 'wake730'] as const;

const TODDLER_NOTES_KEYS = [
    'easySchedule.toddlerExtras.notes.singleNap',
    'easySchedule.toddlerExtras.notes.shiftNap',
    'easySchedule.toddlerExtras.notes.shortenNap',
    'easySchedule.toddlerExtras.notes.totalSleep',
] as const;


export default function EasyScheduleInfoScreen() {
    const { t } = useLocalization();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ ruleId?: EasyFormulaRuleId }>();
    const requestedRuleId = params.ruleId;
    const availableRuleIds = EASY_FORMULA_RULES.map((rule) => rule.id);
    const fallbackRuleId: EasyFormulaRuleId = 'newborn';
    const ruleId = availableRuleIds.includes(requestedRuleId as EasyFormulaRuleId)
        ? (requestedRuleId as EasyFormulaRuleId)
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
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Ionicons name="close" size={28} color="#2D2D2D" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('easySchedule.infoTitle')}</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Title Card */}
                <View style={styles.titleCard}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.colorfulTitle}>
                            <Text style={styles.letterE}>E.</Text>
                            <Text style={styles.letterA}>A.</Text>
                            <Text style={styles.letterS}>S.</Text>
                            <Text style={styles.letterY}>Y.</Text>
                            <Text style={styles.number3}>3</Text>
                        </Text>
                    </View>
                    <Text style={styles.formulaTitle}>{t(formulaRule.labelKey)}</Text>
                    <Text style={styles.ageRange}>{t(formulaRule.ageRangeKey)}</Text>
                </View>

                {/* Formula Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeading}>{t('easySchedule.formulaTable.heading')}</Text>
                    {formulaRows.map((row) => (
                        <View key={row.label} style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{row.label}</Text>
                            <Text style={styles.detailValue}>{row.value}</Text>
                        </View>
                    ))}
                </View>

                {/* Logic Notes */}
                {logicNotes.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionHeading}>{t('easySchedule.formulaTable.labels.logic')}</Text>
                        {logicNotes.map((note, index) => (
                            <Text key={`${note}-${index}`} style={styles.bulletText}>
                                • {note}
                            </Text>
                        ))}
                    </View>
                )}

                {/* Toddler-specific content */}
                {formulaRule.id === 'toddler' && (
                    <>
                        <View style={styles.section}>
                            <Text style={styles.sectionHeading}>{t('easySchedule.toddlerExtras.wakeWindowsHeading')}</Text>
                            {TODDLER_WAKE_WINDOW_KEYS.map((key: string) => (
                                <Text key={key} style={styles.bulletText}>
                                    • {t(key)}
                                </Text>
                            ))}
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionHeading}>{t('easySchedule.toddlerExtras.sampleDayHeading')}</Text>
                            {TODDLER_SAMPLE_DAY_KEYS.map((entry: { titleKey: string; detailKey: string }) => (
                                <View key={entry.titleKey} style={styles.sampleDayRow}>
                                    <Text style={styles.sampleDayTitle}>{t(entry.titleKey)}</Text>
                                    <Text style={styles.sampleDayDetail}>{t(entry.detailKey)}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionHeading}>{t('easySchedule.toddlerExtras.sampleOutputsHeading')}</Text>
                            <View style={styles.sampleTable}>
                                <View style={[styles.sampleTableRow, styles.sampleTableHeader]}>
                                    <Text style={styles.sampleTableHeaderText}>
                                        {t('easySchedule.toddlerExtras.sampleOutputs.tableHeaders.wakeTime')}
                                    </Text>
                                    <Text style={styles.sampleTableHeaderText}>
                                        {t('easySchedule.toddlerExtras.sampleOutputs.tableHeaders.napTime')}
                                    </Text>
                                    <Text style={styles.sampleTableHeaderText}>
                                        {t('easySchedule.toddlerExtras.sampleOutputs.tableHeaders.napLength')}
                                    </Text>
                                    <Text style={styles.sampleTableHeaderText}>
                                        {t('easySchedule.toddlerExtras.sampleOutputs.tableHeaders.bedtime')}
                                    </Text>
                                </View>
                                {TODDLER_SAMPLE_OUTPUT_ROWS.map((rowKey: string) => (
                                    <View key={rowKey} style={styles.sampleTableRow}>
                                        <Text style={styles.sampleTableCell}>
                                            {t(`easySchedule.toddlerExtras.sampleOutputs.rows.${rowKey}.wakeTime`)}
                                        </Text>
                                        <Text style={styles.sampleTableCell}>
                                            {t(`easySchedule.toddlerExtras.sampleOutputs.rows.${rowKey}.napTime`)}
                                        </Text>
                                        <Text style={styles.sampleTableCell}>
                                            {t(`easySchedule.toddlerExtras.sampleOutputs.rows.${rowKey}.napLength`)}
                                        </Text>
                                        <Text style={styles.sampleTableCell}>
                                            {t(`easySchedule.toddlerExtras.sampleOutputs.rows.${rowKey}.bedtime`)}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionHeading}>{t('easySchedule.toddlerExtras.notesHeading')}</Text>
                            {TODDLER_NOTES_KEYS.map((key: string) => (
                                <Text key={key} style={styles.bulletText}>
                                    • {t(key)}
                                </Text>
                            ))}
                        </View>
                    </>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F2FF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2D2D2D',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    titleCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        alignItems: 'center',
    },
    titleContainer: {
        marginBottom: 12,
    },
    colorfulTitle: {
        fontSize: 36,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    letterE: { color: '#FF6B9D' },
    letterA: { color: '#FFA94D' },
    letterS: { color: '#4ECDC4' },
    letterY: { color: '#95E1D3' },
    number3: { color: '#B8B8FF' },
    formulaTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#2D2D2D',
        textAlign: 'center',
        marginBottom: 4,
    },
    ageRange: {
        fontSize: 14,
        color: '#8B8B8B',
        textAlign: 'center',
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    },
    sectionHeading: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2D2D2D',
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#5B5B5B',
        flex: 1,
    },
    detailValue: {
        fontSize: 14,
        color: '#2D2D2D',
        flex: 2,
    },
    bulletText: {
        fontSize: 14,
        color: '#5B5B5B',
        marginBottom: 8,
        lineHeight: 20,
    },
    sampleDayRow: {
        marginBottom: 12,
    },
    sampleDayTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D2D2D',
        marginBottom: 4,
    },
    sampleDayDetail: {
        fontSize: 14,
        color: '#5B5B5B',
    },
    sampleTable: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        overflow: 'hidden',
    },
    sampleTableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    sampleTableHeader: {
        backgroundColor: '#F5F5F5',
    },
    sampleTableHeaderText: {
        flex: 1,
        fontSize: 12,
        fontWeight: '600',
        color: '#2D2D2D',
        padding: 8,
        textAlign: 'center',
    },
    sampleTableCell: {
        flex: 1,
        fontSize: 12,
        color: '#5B5B5B',
        padding: 8,
        textAlign: 'center',
    },
});
