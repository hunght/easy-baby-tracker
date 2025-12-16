import { z } from 'zod';

function safeParseJson<T = Record<string, unknown>>(
  jsonString: string | null | undefined,
  schema: z.ZodSchema<T>
): T | null {
  if (!jsonString) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonString);

    const result = schema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
    // Validation failed - return null
    return null;
  } catch {
    // JSON parsing failed - return null
    return null;
  }
}

/**
 * Zod schema for notification data structure
 * Used for scheduled notification data field validation
 */
const notificationDataSchema = z
  .object({
    label: z.string().optional(),
    feedingType: z.enum(['breast', 'bottle', 'solids']).optional(),
  })
  .catchall(z.unknown()); // Allow additional fields

type NotificationData = z.infer<typeof notificationDataSchema>;

/**
 * Safely parse notification data JSON string with type validation
 * @param jsonString - The JSON string from notification data field
 * @returns Validated notification data or null (with label and feedingType properties if present)
 */
export function safeParseNotificationData(
  jsonString: string | null | undefined
): NotificationData | null {
  return safeParseJson(jsonString, notificationDataSchema);
}

/**
 * Zod schema for EASY schedule notification data structure
 */
const easyScheduleNotificationDataSchema = z
  .object({
    activityType: z.string(),
  })
  .catchall(z.unknown()); // Allow additional fields

type EasyScheduleNotificationData = z.infer<typeof easyScheduleNotificationDataSchema>;

/**
 * Safely parse EASY schedule notification data JSON string
 * @param jsonString - The JSON string from notification data field
 * @returns Validated data with activityType or null
 */
export function safeParseEasyScheduleNotificationData(
  jsonString: string | null | undefined
): EasyScheduleNotificationData | null {
  return safeParseJson(jsonString, easyScheduleNotificationDataSchema);
}

/**
 * Zod schema for EasyCyclePhase array
 */
const easyCyclePhaseArraySchema = z.array(
  z.object({
    eat: z.number(),
    activity: z.number(),
    sleep: z.number(),
  })
);

/**
 * Safely parse EasyCyclePhase array from JSON string
 * @param jsonString - The JSON string containing phases array
 * @returns Validated phases array or empty array if parsing fails
 */
export function safeParseEasyCyclePhases(
  jsonString: string | null | undefined
): { eat: number; activity: number; sleep: number }[] {
  const result = safeParseJson(jsonString, easyCyclePhaseArraySchema);
  return result ?? [];
}

/**
 * Zod schema for reminder days array (day indices 0-6)
 */
const reminderDaysArraySchema = z.array(z.number().int().min(0).max(6));

/**
 * Safely parse reminder days array from JSON string
 * @param jsonString - The JSON string containing days array
 * @returns Validated days array or null if parsing fails
 */
export function safeParseReminderDays(jsonString: string | null | undefined): number[] | null {
  return safeParseJson(jsonString, reminderDaysArraySchema);
}
