export type EasyScheduleActivityType = 'E' | 'A' | 'S' | 'Y';

export type EasyScheduleItem = {
  activityType: EasyScheduleActivityType;
  startTime: string;
  durationMinutes: number;
  order: number;
  label: string;
  notes?: string;
};

export type EasyScheduleLabels = {
  eat: string;
  activity: string;
  sleep: (napNumber: number) => string;
  yourTime: string;
};

export type EasyFormulaRuleId = 'newborn' | 'fourToSixMonths' | 'sixToNineMonths' | 'nineToTwelveMonths' | 'toddler';

export type EasyFormulaRule = {
  id: EasyFormulaRuleId;
  minWeeks: number;
  maxWeeks: number | null;
  labelKey: string;
  ageRangeKey: string;
  cycleKey: string;
  eatKey: string;
  activityKey: string;
  sleepKey: string;
  yourTimeKey: string;
  logicKeys: readonly string[];
  cycleLengthMinutes?: number;
  activityRangeMinutes: readonly [number, number];
  feedDurationMinutes: number;
  napDurationsMinutes: readonly number[];
  thirdNapDropWakeThreshold?: number;
  morningNapCapMinutes?: number;
  afternoonActivityRangeMinutes?: readonly [number, number];
  nightSleepMinutes?: number;
  bedtimeRoutineMinutes?: number;
};

export const EASY_FORMULA_RULES: readonly EasyFormulaRule[] = [
  {
    id: 'newborn',
    minWeeks: 0,
    maxWeeks: 16,
    labelKey: 'easySchedule.formulas.newborn.label',
    ageRangeKey: 'easySchedule.formulas.newborn.ageRange',
    cycleKey: 'easySchedule.formulas.newborn.cycle',
    eatKey: 'easySchedule.formulas.newborn.eat',
    activityKey: 'easySchedule.formulas.newborn.activity',
    sleepKey: 'easySchedule.formulas.newborn.sleep',
    yourTimeKey: 'easySchedule.formulas.newborn.yourTime',
    logicKeys: [
      'easySchedule.formulas.newborn.logic.cycle',
      'easySchedule.formulas.newborn.logic.activity',
    ],
    cycleLengthMinutes: 180,
    activityRangeMinutes: [45, 75],
    feedDurationMinutes: 35,
    napDurationsMinutes: [120, 120, 90, 60],
  },
  {
    id: 'fourToSixMonths',
    minWeeks: 16,
    maxWeeks: 24,
    labelKey: 'easySchedule.formulas.fourToSixMonths.label',
    ageRangeKey: 'easySchedule.formulas.fourToSixMonths.ageRange',
    cycleKey: 'easySchedule.formulas.fourToSixMonths.cycle',
    eatKey: 'easySchedule.formulas.fourToSixMonths.eat',
    activityKey: 'easySchedule.formulas.fourToSixMonths.activity',
    sleepKey: 'easySchedule.formulas.fourToSixMonths.sleep',
    yourTimeKey: 'easySchedule.formulas.fourToSixMonths.yourTime',
    logicKeys: [
      'easySchedule.formulas.fourToSixMonths.logic.cycle',
      'easySchedule.formulas.fourToSixMonths.logic.balance',
    ],
    cycleLengthMinutes: 240,
    activityRangeMinutes: [90, 120],
    feedDurationMinutes: 30,
    napDurationsMinutes: [120, 120, 90],
  },
  {
    id: 'sixToNineMonths',
    minWeeks: 24,
    maxWeeks: 40,
    labelKey: 'easySchedule.formulas.sixToNineMonths.label',
    ageRangeKey: 'easySchedule.formulas.sixToNineMonths.ageRange',
    cycleKey: 'easySchedule.formulas.sixToNineMonths.cycle',
    eatKey: 'easySchedule.formulas.sixToNineMonths.eat',
    activityKey: 'easySchedule.formulas.sixToNineMonths.activity',
    sleepKey: 'easySchedule.formulas.sixToNineMonths.sleep',
    yourTimeKey: 'easySchedule.formulas.sixToNineMonths.yourTime',
    logicKeys: [
      'easySchedule.formulas.sixToNineMonths.logic.window',
      'easySchedule.formulas.sixToNineMonths.logic.dropNap',
    ],
    cycleLengthMinutes: 240,
    activityRangeMinutes: [120, 180],
    feedDurationMinutes: 30,
    napDurationsMinutes: [90, 90, 60],
    thirdNapDropWakeThreshold: 180,
  },
  {
    id: 'nineToTwelveMonths',
    minWeeks: 40,
    maxWeeks: 52,
    labelKey: 'easySchedule.formulas.nineToTwelveMonths.label',
    ageRangeKey: 'easySchedule.formulas.nineToTwelveMonths.ageRange',
    cycleKey: 'easySchedule.formulas.nineToTwelveMonths.cycle',
    eatKey: 'easySchedule.formulas.nineToTwelveMonths.eat',
    activityKey: 'easySchedule.formulas.nineToTwelveMonths.activity',
    sleepKey: 'easySchedule.formulas.nineToTwelveMonths.sleep',
    yourTimeKey: 'easySchedule.formulas.nineToTwelveMonths.yourTime',
    logicKeys: [
      'easySchedule.formulas.nineToTwelveMonths.logic.feedBalance',
      'easySchedule.formulas.nineToTwelveMonths.logic.capNap',
    ],
    activityRangeMinutes: [150, 240],
    feedDurationMinutes: 25,
    napDurationsMinutes: [90, 120],
    morningNapCapMinutes: 120,
  },
  {
    id: 'toddler',
    minWeeks: 52,
    maxWeeks: null,
    labelKey: 'easySchedule.formulas.toddler.label',
    ageRangeKey: 'easySchedule.formulas.toddler.ageRange',
    cycleKey: 'easySchedule.formulas.toddler.cycle',
    eatKey: 'easySchedule.formulas.toddler.eat',
    activityKey: 'easySchedule.formulas.toddler.activity',
    sleepKey: 'easySchedule.formulas.toddler.sleep',
    yourTimeKey: 'easySchedule.formulas.toddler.yourTime',
    logicKeys: [
      'easySchedule.formulas.toddler.logic.napStart',
      'easySchedule.formulas.toddler.logic.duration',
    ],
    activityRangeMinutes: [240, 300],
    feedDurationMinutes: 20,
    napDurationsMinutes: [120],
    afternoonActivityRangeMinutes: [240, 300],
    nightSleepMinutes: 660,
    bedtimeRoutineMinutes: 30,
  },
] as const;

const DEFAULT_RULE = EASY_FORMULA_RULES[0];

const WAKE_WINDOW_MAP: readonly { maxWeeks: number; minutes: number }[] = [
  { maxWeeks: 4, minutes: 45 },
  { maxWeeks: 8, minutes: 55 },
  { maxWeeks: 12, minutes: 65 },
  { maxWeeks: 16, minutes: 75 },
  { maxWeeks: 20, minutes: 90 },
  { maxWeeks: 24, minutes: 105 },
  { maxWeeks: 28, minutes: 120 },
  { maxWeeks: 32, minutes: 135 },
  { maxWeeks: 36, minutes: 150 },
  { maxWeeks: 40, minutes: 165 },
  { maxWeeks: 44, minutes: 180 },
  { maxWeeks: 48, minutes: 200 },
  { maxWeeks: 52, minutes: 220 },
  { maxWeeks: Number.POSITIVE_INFINITY, minutes: 240 },
] as const;

/**
 * Add minutes to a time string (HH:MM)
 */
function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, mins, 0, 0);
  date.setMinutes(date.getMinutes() + minutes);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * Calculate age in months from birthdate
 */
export function calculateAgeInMonths(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  const months = (today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth();
  return months;
}

export function calculateAgeInWeeks(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  const diffMs = today.getTime() - birth.getTime();
  return Math.max(Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)), 0);
}

function estimateWakeWindow(ageWeeks: number | undefined): number {
  if (ageWeeks === undefined || Number.isNaN(ageWeeks)) {
    return WAKE_WINDOW_MAP[0].minutes;
  }

  const match = WAKE_WINDOW_MAP.find((window) => ageWeeks < window.maxWeeks);
  return match ? match.minutes : WAKE_WINDOW_MAP[WAKE_WINDOW_MAP.length - 1].minutes;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getEasyFormulaRuleById(ruleId: EasyFormulaRuleId): EasyFormulaRule {
  return EASY_FORMULA_RULES.find((rule) => rule.id === ruleId) ?? DEFAULT_RULE;
}

export function getEasyFormulaRuleByAge(ageWeeks?: number | null): EasyFormulaRule {
  if (ageWeeks === null || ageWeeks === undefined) {
    return DEFAULT_RULE;
  }

  return EASY_FORMULA_RULES.find(
    (rule) => ageWeeks >= rule.minWeeks && (rule.maxWeeks === null || ageWeeks < rule.maxWeeks)
  ) ?? DEFAULT_RULE;
}

type GenerateEasyScheduleOptions =
  | {
      labels: EasyScheduleLabels;
      ageWeeks?: number;
      ruleId?: undefined;
    }
  | {
      labels: EasyScheduleLabels;
      ageWeeks?: number;
      ruleId: EasyFormulaRuleId;
    };

/**
 * Generate an E.A.S.Y. schedule aligned with the detected formula rule
 */
export function generateEasySchedule(
  firstWakeTime: string,
  options: GenerateEasyScheduleOptions
): EasyScheduleItem[] {
  if (!options?.labels) {
    throw new Error('generateEasySchedule: labels are required. Pass labels from your i18n provider.');
  }

  const rule = options.ruleId ? getEasyFormulaRuleById(options.ruleId) : getEasyFormulaRuleByAge(options.ageWeeks);
  const inferredAgeWeeks =
    options.ageWeeks !== undefined
      ? options.ageWeeks
      : rule.maxWeeks
        ? Math.min(rule.maxWeeks - 1, rule.minWeeks)
        : rule.minWeeks;

  const wakeWindow = clamp(
    estimateWakeWindow(inferredAgeWeeks),
    rule.activityRangeMinutes[0],
    rule.activityRangeMinutes[1]
  );

  if (rule.id === 'toddler') {
    return buildToddlerSchedule({
      rule,
      firstWakeTime,
      labels: options.labels,
      wakeWindow,
      ageWeeks: inferredAgeWeeks,
    });
  }

  return buildScheduleFromRule({
    rule,
    firstWakeTime,
    labels: options.labels,
    wakeWindow,
  });
}

/**
 * Generate E.A.S.Y.3 schedule for babies 0-6 months
 * Based on the rules:
 * - Feed every 2.5-3 hours after waking
 * - Activity time: 20-30 minutes total (including eating)
 * - Sleep: 4 naps per day (3 long naps of 1.5-2h, 1 short nap of 30-40 min)
 * - Wake window before sleep: 45-60 minutes
 */
export function generateEasy3Schedule(
  firstWakeTime: string,
  options?: { labels?: EasyScheduleLabels }
): EasyScheduleItem[] {
  if (!options?.labels) {
    throw new Error('generateEasy3Schedule: labels are required. Pass labels from your i18n provider.');
  }

  return generateEasySchedule(firstWakeTime, {
    labels: options.labels,
    ruleId: 'newborn',
  });
}

function buildScheduleFromRule({
  rule,
  firstWakeTime,
  labels,
  wakeWindow,
}: {
  rule: EasyFormulaRule;
  firstWakeTime: string;
  labels: EasyScheduleLabels;
  wakeWindow: number;
}): EasyScheduleItem[] {
  const items: EasyScheduleItem[] = [];
  let currentTime = firstWakeTime;
  let order = 0;
  let napDurations = [...rule.napDurationsMinutes];

  if (rule.thirdNapDropWakeThreshold && wakeWindow >= rule.thirdNapDropWakeThreshold && napDurations.length > 2) {
    napDurations = napDurations.slice(0, napDurations.length - 1);
  }

  napDurations.forEach((napDuration, index) => {
    const napNumber = index + 1;

    // E - Eating / milk feed
    items.push({
      activityType: 'E',
      startTime: currentTime,
      durationMinutes: rule.feedDurationMinutes,
      order: order++,
      label: labels.eat,
    });
    currentTime = addMinutes(currentTime, rule.feedDurationMinutes);

    // A - Activity / wake window
    const activityDuration = wakeWindow;
    items.push({
      activityType: 'A',
      startTime: currentTime,
      durationMinutes: activityDuration,
      order: order++,
      label: labels.activity,
    });
    currentTime = addMinutes(currentTime, activityDuration);

    // S - Sleep
    const adjustedNapDuration =
      index === 0 && rule.morningNapCapMinutes
        ? Math.min(napDuration, rule.morningNapCapMinutes)
        : napDuration;
    items.push({
      activityType: 'S',
      startTime: currentTime,
      durationMinutes: adjustedNapDuration,
      order: order++,
      label: labels.sleep(napNumber),
    });
    currentTime = addMinutes(currentTime, adjustedNapDuration);

    // Y - Your time
    items.push({
      activityType: 'Y',
      startTime: addMinutes(currentTime, -adjustedNapDuration),
      durationMinutes: adjustedNapDuration,
      order: order++,
      label: labels.yourTime,
    });
  });

  return items;
}

function buildToddlerSchedule({
  rule,
  firstWakeTime,
  labels,
  wakeWindow,
  ageWeeks,
}: {
  rule: EasyFormulaRule;
  firstWakeTime: string;
  labels: EasyScheduleLabels;
  wakeWindow: number;
  ageWeeks: number;
}): EasyScheduleItem[] {
  const items: EasyScheduleItem[] = [];
  let currentTime = firstWakeTime;
  let order = 0;
  const feedDuration = rule.feedDurationMinutes;
  const napDuration = rule.napDurationsMinutes[0] ?? 120;
  const afternoonWindow = rule.afternoonActivityRangeMinutes
    ? clamp(estimateWakeWindow(ageWeeks), rule.afternoonActivityRangeMinutes[0], rule.afternoonActivityRangeMinutes[1])
    : wakeWindow;
  const nightSleep = rule.nightSleepMinutes ?? 660;

  const pushItem = (item: Omit<EasyScheduleItem, 'order'>) => {
    items.push({ ...item, order: order++ });
  };

  pushItem({
    activityType: 'E',
    startTime: currentTime,
    durationMinutes: feedDuration,
    label: labels.eat,
  });
  currentTime = addMinutes(currentTime, feedDuration);

  pushItem({
    activityType: 'A',
    startTime: currentTime,
    durationMinutes: wakeWindow,
    label: labels.activity,
  });
  currentTime = addMinutes(currentTime, wakeWindow);

  pushItem({
    activityType: 'S',
    startTime: currentTime,
    durationMinutes: napDuration,
    label: labels.sleep(1),
  });
  pushItem({
    activityType: 'Y',
    startTime: currentTime,
    durationMinutes: napDuration,
    label: labels.yourTime,
  });
  currentTime = addMinutes(currentTime, napDuration);

  pushItem({
    activityType: 'E',
    startTime: currentTime,
    durationMinutes: feedDuration,
    label: labels.eat,
  });
  currentTime = addMinutes(currentTime, feedDuration);

  pushItem({
    activityType: 'A',
    startTime: currentTime,
    durationMinutes: afternoonWindow,
    label: labels.activity,
  });
  currentTime = addMinutes(currentTime, afternoonWindow);

  pushItem({
    activityType: 'E',
    startTime: currentTime,
    durationMinutes: feedDuration,
    label: labels.eat,
  });
  currentTime = addMinutes(currentTime, feedDuration);

  if (rule.bedtimeRoutineMinutes) {
    pushItem({
      activityType: 'A',
      startTime: currentTime,
      durationMinutes: rule.bedtimeRoutineMinutes,
      label: labels.activity,
    });
    currentTime = addMinutes(currentTime, rule.bedtimeRoutineMinutes);
  }

  pushItem({
    activityType: 'S',
    startTime: currentTime,
    durationMinutes: nightSleep,
    label: labels.sleep(2),
  });

  return items;
}
