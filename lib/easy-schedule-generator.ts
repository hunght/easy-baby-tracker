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
  ageRangeKey: string;
  cycleKey: string;
  eatKey: string;
  activityKey: string;
  sleepKey: string;
  yourTimeKey: string;
  logicKeys: readonly string[];
  // Schedule phases - array of cycles with durations in minutes
  phases: readonly EasyCyclePhase[];
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

/**
 * Calculate age in months from birthdate
 */
export function calculateAgeInMonths(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  const months =
    (today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth();
  return months;
}

export function calculateAgeInWeeks(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  const diffMs = today.getTime() - birth.getTime();
  return Math.max(Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)), 0);
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

/**
 * Recalculate schedule items after adjusting a specific item's start and end times.
 * Updates the adjusted item and recalculates all subsequent items in the same day.
 *
 * @param items - Current schedule items
 * @param adjustedItemOrder - Order number of the item to adjust
 * @param newStartTime - New start time in HH:mm format
 * @param newEndTime - New end time in HH:mm format
 * @returns Updated schedule items array
 */
export function recalculateScheduleFromItem(
  items: EasyScheduleItem[],
  adjustedItemOrder: number,
  newStartTime: string,
  newEndTime: string
): EasyScheduleItem[] {
  // Helper function to calculate minutes from time string
  function timeStringToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Helper function to calculate minutes difference, handling day boundaries
  function calculateDurationMinutes(startTime: string, endTime: string): number {
    const startMins = timeStringToMinutes(startTime);
    const endMins = timeStringToMinutes(endTime);

    // If end time is earlier than start time, it spans to next day
    if (endMins < startMins) {
      return 24 * 60 - startMins + endMins;
    }
    return endMins - startMins;
  }

  // Helper function to add minutes to time string, handling day boundaries
  function addMinutesToTime(time: string, minutes: number): string {
    const totalMins = timeStringToMinutes(time) + minutes;
    const normalizedMins = ((totalMins % (24 * 60)) + 24 * 60) % (24 * 60);
    const hours = Math.floor(normalizedMins / 60);
    const mins = normalizedMins % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  // Find the item to adjust
  const adjustedItemIndex = items.findIndex((item) => item.order === adjustedItemOrder);
  if (adjustedItemIndex === -1) {
    return items; // Item not found, return original
  }

  // Calculate new duration
  const newDuration = calculateDurationMinutes(newStartTime, newEndTime);
  if (newDuration <= 0) {
    return items; // Invalid duration, return original
  }

  // Create a copy of items to modify
  const updatedItems = [...items];

  // Update the adjusted item
  updatedItems[adjustedItemIndex] = {
    ...updatedItems[adjustedItemIndex],
    startTime: newStartTime,
    durationMinutes: newDuration,
  };

  // Recalculate subsequent items
  let currentTime = newEndTime;
  for (let i = adjustedItemIndex + 1; i < updatedItems.length; i++) {
    const item = updatedItems[i];

    // Update start time
    updatedItems[i] = {
      ...item,
      startTime: currentTime,
    };

    // Calculate next start time
    currentTime = addMinutesToTime(currentTime, item.durationMinutes);
  }

  return updatedItems;
}
