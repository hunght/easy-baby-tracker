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

// Each cycle represents one EASY block: Eat -> Activity -> Sleep (Y overlaps with S)
export type EasyCyclePhase = {
  eat: number; // duration in minutes
  activity: number; // duration in minutes
  sleep: number; // duration in minutes
};

// Formula rule ID type - matches database IDs
export type EasyFormulaRuleId = string;

// Formula rule type - loaded from database
export type EasyFormulaRule = {
  id: EasyFormulaRuleId;
  minWeeks: number;
  maxWeeks: number | null;
  labelKey: string;
  labelText?: string | null; // For custom rules that use direct text
  ageRangeKey: string;
  ageRangeText?: string | null; // For custom rules that use direct text
  // HTML description for custom formulas
  description?: string | null;
  // Schedule phases - array of cycles with durations in minutes
  phases: readonly EasyCyclePhase[];
  // Day-specific rule: if set, this rule only applies to this date (YYYY-MM-DD format)
  validDate?: string | null;
};

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

type GenerateEasyScheduleOptions = {
  labels: EasyScheduleLabels;
  // Phases are required - must be loaded from database
  phases: EasyCyclePhase[];
};

/**
 * Generate an E.A.S.Y. schedule from phases
 * Each phase creates: Eat -> Activity -> Sleep -> Your Time (Y overlaps with S)
 */
export function generateEasySchedule(
  firstWakeTime: string,
  options: GenerateEasyScheduleOptions
): EasyScheduleItem[] {
  if (!options?.labels) {
    throw new Error(
      'generateEasySchedule: labels are required. Pass labels from your i18n provider.'
    );
  }

  if (!options.phases || options.phases.length === 0) {
    throw new Error('generateEasySchedule: phases are required. Load formula rule from database.');
  }

  const items: EasyScheduleItem[] = [];
  let currentTime = firstWakeTime;
  let order = 0;

  options.phases.forEach((phase, index) => {
    const napNumber = index + 1;

    // E - Eat
    items.push({
      activityType: 'E',
      startTime: currentTime,
      durationMinutes: phase.eat,
      order: order++,
      label: options.labels.eat,
    });
    currentTime = addMinutes(currentTime, phase.eat);

    // A - Activity
    items.push({
      activityType: 'A',
      startTime: currentTime,
      durationMinutes: phase.activity,
      order: order++,
      label: options.labels.activity,
    });
    currentTime = addMinutes(currentTime, phase.activity);

    // S - Sleep
    items.push({
      activityType: 'S',
      startTime: currentTime,
      durationMinutes: phase.sleep,
      order: order++,
      label: options.labels.sleep(napNumber),
    });

    // Y - Your Time (overlaps with Sleep)
    items.push({
      activityType: 'Y',
      startTime: currentTime,
      durationMinutes: phase.sleep,
      order: order++,
      label: options.labels.yourTime,
    });

    currentTime = addMinutes(currentTime, phase.sleep);
  });

  return items;
}
