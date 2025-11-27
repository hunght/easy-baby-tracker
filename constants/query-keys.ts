export const DIAPER_CHANGES_QUERY_KEY = ['diaperChanges'] as const;
export const diaperChangeByIdKey = (id: number) => ['diaperChange', id] as const;

export const FEEDINGS_QUERY_KEY = ['feedings'] as const;
export const feedingByIdKey = (id: number) => ['feeding', id] as const;

export const BABY_PROFILE_QUERY_KEY = ['babyProfile'] as const;
export const BABY_PROFILES_QUERY_KEY = ['babyProfiles'] as const;
export const babyProfileByIdKey = (id: number) => ['babyProfile', id] as const;

export const GROWTH_RECORDS_QUERY_KEY = ['growthRecords'] as const;
export const growthRecordByIdKey = (id: number) => ['growthRecord', id] as const;

export const HEALTH_RECORDS_QUERY_KEY = ['healthRecords'] as const;
export const healthRecordByIdKey = (id: number) => ['healthRecord', id] as const;

export const PUMPINGS_QUERY_KEY = ['pumpings'] as const;
export const PUMPING_INVENTORY_QUERY_KEY = ['pumpingInventory'] as const;
export const pumpingByIdKey = (id: number) => ['pumping', id] as const;

export const SLEEP_SESSIONS_QUERY_KEY = ['sleepSessions'] as const;
export const sleepSessionByIdKey = (id: number) => ['sleepSession', id] as const;

export const DIARY_ENTRIES_QUERY_KEY = ['diaryEntries'] as const;
export const diaryEntryByIdKey = (id: number) => ['diaryEntry', id] as const;

export const TIMELINE_ACTIVITIES_QUERY_KEY = ['timelineActivities'] as const;
export const SCHEDULED_NOTIFICATIONS_QUERY_KEY = ['scheduledNotifications'] as const;
