import { common } from './common';
import { easySchedule } from './easy-schedule';
import { features } from './features';
import { onboarding } from './onboarding';
import { profiles } from './profiles';
import { settings } from './settings';
import { tabs } from './tabs';
import { tracking } from './tracking';
import { habit } from './habit';

export const translationObject = {
  en: {
    common: common.en,
    tabs: tabs.en,
    tracking: tracking.en,
    habit: habit.en,
    easySchedule: easySchedule.en,
    settings: settings.en,
    onboarding: onboarding.en,
    profileSelection: profiles.en.profileSelection,
    profileEdit: profiles.en.profileEdit,
    diaper: features.en.diaper,
    feeding: features.en.feeding,
    pumping: features.en.pumping,
    sleep: features.en.sleep,
    health: features.en.health,
    growth: features.en.growth,
    charts: features.en.charts,
    timeline: features.en.timeline,
    modal: features.en.modal,
    scheduling: features.en.scheduling,
    diary: features.en.diary,
  },
  vi: {
    common: common.vi,
    tabs: tabs.vi,
    tracking: tracking.vi,
    habit: habit.vi,
    easySchedule: easySchedule.vi,
    settings: settings.vi,
    onboarding: onboarding.vi,
    profileSelection: profiles.vi.profileSelection,
    profileEdit: profiles.vi.profileEdit,
    diaper: features.vi.diaper,
    feeding: features.vi.feeding,
    pumping: features.vi.pumping,
    sleep: features.vi.sleep,
    health: features.vi.health,
    growth: features.vi.growth,
    charts: features.vi.charts,
    timeline: features.vi.timeline,
    modal: features.vi.modal,
    scheduling: features.vi.scheduling,
    diary: features.vi.diary,
  },
};

export type Locale = keyof typeof translationObject;
export const supportedLocales: readonly { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Tiếng Việt' },
];
