export type EasyScheduleActivityType = 'E' | 'A' | 'E.A' | 'S' | 'Y';

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
  eatAndActivity?: string; // Optional label for combined E.A phase
  sleep: (napNumber: number) => string;
  yourTime: string;
};

// Each cycle represents one EASY block: Eat -> Activity -> Sleep (Y overlaps with S)
// If both eat > 0 and activity > 0, can create combined E.A phase (baby can eat and play based on needs)
export type EasyCyclePhase = {
  eat?: number; // duration in minutes (optional, 0 to skip, or combine with activity for E.A)
  activity?: number; // duration in minutes (optional if eatActivity is used)
  eatActivity?: number; // duration in minutes for E.A phase (creates combined eat and activity phase)
  sleep: number; // duration in minutes
  combined?: boolean; // if true and both eat > 0 and activity > 0, create E.A instead of separate E and A
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

    // Handle eatActivity - creates E.A type phase
    if (phase.eatActivity !== undefined && phase.eatActivity > 0) {
      // E.A - Combined eat and activity phase
      items.push({
        activityType: 'E.A',
        startTime: currentTime,
        durationMinutes: phase.eatActivity,
        order: order++,
        label:
          options.labels.eatAndActivity || `${options.labels.eat} & ${options.labels.activity}`,
      });
      currentTime = addMinutes(currentTime, phase.eatActivity);
    } else {
      // Check if we should create combined E.A phase
      const eat = phase.eat ?? 0;
      const activity = phase.activity ?? 0;
      const shouldCombine = phase.combined && eat > 0 && activity > 0;

      if (shouldCombine) {
        // E.A - Combined Eat and Activity (baby can do both based on needs)
        const combinedDuration = eat + activity;
        items.push({
          activityType: 'E.A',
          startTime: currentTime,
          durationMinutes: combinedDuration,
          order: order++,
          label:
            options.labels.eatAndActivity || `${options.labels.eat} & ${options.labels.activity}`,
        });
        currentTime = addMinutes(currentTime, combinedDuration);
      } else {
        // E - Eat (skip if eat = 0 or undefined)
        if (eat > 0) {
          items.push({
            activityType: 'E',
            startTime: currentTime,
            durationMinutes: eat,
            order: order++,
            label: options.labels.eat,
          });
          currentTime = addMinutes(currentTime, eat);
        }

        // A - Activity (only if eatActivity is not used)
        if (activity > 0) {
          items.push({
            activityType: 'A',
            startTime: currentTime,
            durationMinutes: activity,
            order: order++,
            label: options.labels.activity,
          });
          currentTime = addMinutes(currentTime, activity);
        }
      }
    }

    // S - Sleep (skip if sleep = 0)
    if (phase.sleep > 0) {
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
    }
  });

  return items;
}
