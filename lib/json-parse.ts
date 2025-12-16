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
