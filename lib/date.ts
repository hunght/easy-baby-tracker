// Convert HH:MM reminder time to today's Date
export function reminderTimeToDate({
  reminderTime,
  reminderDays,
}: {
  reminderTime: string;
  reminderDays?: string | null;
}): Date | null {
  const [hours, minutes] = reminderTime.split(':').map(Number);
  const now = new Date();
  const today = now.getDay(); // 0 = Sunday, 6 = Saturday

  // Check if reminder should fire today based on reminderDays
  let shouldFireToday = true;
  if (reminderDays) {
    if (reminderDays === 'daily') {
      shouldFireToday = true;
    } else if (reminderDays === 'weekdays') {
      shouldFireToday = today >= 1 && today <= 5;
    } else if (reminderDays === 'weekends') {
      shouldFireToday = today === 0 || today === 6;
    } else {
      // Custom JSON array
      try {
        const days = JSON.parse(reminderDays);
        shouldFireToday = Array.isArray(days) && days.includes(today);
      } catch {
        shouldFireToday = true;
      }
    }
  }

  if (!shouldFireToday) return null;

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}
