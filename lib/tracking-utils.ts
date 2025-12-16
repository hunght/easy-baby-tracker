import { GrowthRecord } from '@/database/growth';

export function computeMonthsOld(birthDateIso: string): number {
  const birth = new Date(birthDateIso);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  return Math.max(months, 0);
}

export function computeTodayRange() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return {
    startOfToday: Math.floor(start.getTime() / 1000),
    endOfToday: Math.floor(end.getTime() / 1000),
  };
}

export function computeYesterdayRange(startOfToday: number) {
  const endOfYesterday = startOfToday - 1;
  const startOfYesterday = startOfToday - 24 * 60 * 60;
  return { startOfYesterday, endOfYesterday };
}

export function sum(values: (number | null | undefined)[]): number {
  return values.reduce<number>((acc, value) => acc + (value ?? 0), 0);
}

export function roundMinutes(seconds: number) {
  return Math.round(seconds / 60);
}

export function maxTimestamp(values: (number | null | undefined)[]) {
  return values.reduce<number | null>((max, value) => {
    if (value != null && (max == null || value > max)) {
      return value;
    }
    return max;
  }, null);
}

export function formatDuration(seconds: number) {
  const mins = Math.round(seconds / 60);
  if (mins === 0 && seconds > 0) {
    return '1m';
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (hours > 0) {
    return `${hours}h ${remainingMins}m`;
  }
  return `${mins}m`;
}

export function formatSleepTotal(totalSeconds: number) {
  if (totalSeconds < 3600) {
    const mins = Math.max(1, Math.round(totalSeconds / 60));
    return `${mins}m today`;
  }
  const hours = Math.round((totalSeconds / 3600) * 10) / 10;
  return `${hours}h today`;
}

export function formatTimeAgo(diffSeconds: number) {
  if (diffSeconds < 60) {
    return 'just now';
  }
  const mins = Math.floor(diffSeconds / 60);
  if (mins < 60) {
    return `${mins}m`;
  }
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours < 24) {
    return `${hours}h ${remMins}m`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function formatDelta(value: number, unit: string) {
  const rounded = Math.round(value);
  if (rounded === 0) {
    return '0';
  }
  return `${rounded > 0 ? '+' : ''}${rounded}${unit ? ` ${unit}` : ''}`;
}

export function formatFeedDelta(deltaBottle: number, deltaNursingMinutes: number) {
  const parts: string[] = [];
  if (deltaBottle !== 0) {
    parts.push(`Δb ${formatDelta(deltaBottle, 'ml')}`);
  }
  if (deltaNursingMinutes !== 0) {
    parts.push(`Δn ${formatDelta(deltaNursingMinutes, 'm')}`);
  }
  return parts.length > 0 ? parts.join(' / ') : null;
}

export function formatSleepDelta(deltaSeconds: number) {
  const mins = Math.round(deltaSeconds / 60);
  if (Math.abs(mins) < 60) {
    return formatDelta(mins, 'm');
  }
  const hours = Math.round((deltaSeconds / 3600) * 10) / 10;
  return formatDelta(hours, 'h');
}

export function latestGrowth(records: GrowthRecord[]): GrowthRecord | null {
  return records.reduce<GrowthRecord | null>((latest, record) => {
    if (record.time != null && (latest?.time == null || record.time > latest.time)) {
      return record;
    }
    return latest;
  }, null);
}
