export const DIAPER_CHANGES_QUERY_KEY = ['diaperChanges'] as const;

export const FEEDINGS_QUERY_KEY = ['feedings'] as const;

export const BABY_PROFILE_QUERY_KEY = ['babyProfile'] as const;
export const BABY_PROFILES_QUERY_KEY = ['babyProfiles'] as const;
export const babyProfileByIdKey = (id: number) => ['babyProfile', id] as const;

export const GROWTH_RECORDS_QUERY_KEY = ['growthRecords'] as const;

export const HEALTH_RECORDS_QUERY_KEY = ['healthRecords'] as const;

export const PUMPINGS_QUERY_KEY = ['pumpings'] as const;
export const PUMPING_INVENTORY_QUERY_KEY = ['pumpingInventory'] as const;

export const SLEEP_SESSIONS_QUERY_KEY = ['sleepSessions'] as const;

export const DIARY_ENTRIES_QUERY_KEY = ['diaryEntries'] as const;

export const TIMELINE_ACTIVITIES_QUERY_KEY = ['timelineActivities'] as const;
export const SCHEDULED_NOTIFICATIONS_QUERY_KEY = ['scheduledNotifications'] as const;

export const FORMULA_RULES_QUERY_KEY = ['formulaRules'] as const;
export const formulaRuleByIdKey = (ruleId: string, babyId?: number) =>
  ['formulaRules', ruleId, babyId] as const;
export const formulaRuleByAgeKey = (ageWeeks: number, babyId?: number) =>
  ['formulaRules', 'age', ageWeeks, babyId] as const;
export const PREDEFINED_FORMULA_RULES_QUERY_KEY = ['formulaRules', 'predefined'] as const;
export const userCustomFormulaRulesKey = (babyId: number) =>
  ['formulaRules', 'userCustom', babyId] as const;
export const daySpecificFormulaRulesKey = (babyId: number) =>
  ['formulaRules', 'daySpecific', babyId] as const;
