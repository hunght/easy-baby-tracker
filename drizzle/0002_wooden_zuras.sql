CREATE TABLE `easy_formula_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`baby_id` integer,
	`is_custom` integer DEFAULT false NOT NULL,
	`min_weeks` integer NOT NULL,
	`max_weeks` integer,
	`label_key` text,
	`label_text` text,
	`age_range_key` text,
	`age_range_text` text,
	`cycle_key` text,
	`cycle_text` text,
	`eat_key` text,
	`eat_text` text,
	`activity_key` text,
	`activity_text` text,
	`sleep_key` text,
	`sleep_text` text,
	`your_time_key` text,
	`your_time_text` text,
	`logic_keys` text,
	`logic_texts` text,
	`cycle_length_minutes` integer,
	`activity_range_min` integer NOT NULL,
	`activity_range_max` integer NOT NULL,
	`feed_duration_minutes` integer NOT NULL,
	`nap_durations_minutes` text NOT NULL,
	`third_nap_drop_wake_threshold` integer,
	`morning_nap_cap_minutes` integer,
	`afternoon_activity_range_min` integer,
	`afternoon_activity_range_max` integer,
	`night_sleep_minutes` integer,
	`bedtime_routine_minutes` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`baby_id`) REFERENCES `baby_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_formula_rules_baby_id` ON `easy_formula_rules` (`baby_id`);--> statement-breakpoint
CREATE INDEX `idx_formula_rules_custom` ON `easy_formula_rules` (`is_custom`);--> statement-breakpoint
CREATE INDEX `idx_formula_rules_weeks` ON `easy_formula_rules` (`min_weeks`,`max_weeks`);--> statement-breakpoint
-- Seed predefined formula rules
INSERT INTO `easy_formula_rules` (
  `id`, `is_custom`, `min_weeks`, `max_weeks`,
  `label_key`, `age_range_key`, `cycle_key`, `eat_key`, `activity_key`, `sleep_key`, `your_time_key`,
  `logic_keys`, `cycle_length_minutes`, `activity_range_min`, `activity_range_max`,
  `feed_duration_minutes`, `nap_durations_minutes`, `created_at`, `updated_at`
) VALUES
  ('newborn', 0, 0, 16,
   'easySchedule.formulas.newborn.label', 'easySchedule.formulas.newborn.ageRange', 'easySchedule.formulas.newborn.cycle',
   'easySchedule.formulas.newborn.eat', 'easySchedule.formulas.newborn.activity', 'easySchedule.formulas.newborn.sleep',
   'easySchedule.formulas.newborn.yourTime',
   '["easySchedule.formulas.newborn.logic.cycle","easySchedule.formulas.newborn.logic.activity"]',
   180, 45, 75, 35, '[120,120,90,60]',
   unixepoch(), unixepoch()),
  ('fourToSixMonths', 0, 16, 24,
   'easySchedule.formulas.fourToSixMonths.label', 'easySchedule.formulas.fourToSixMonths.ageRange', 'easySchedule.formulas.fourToSixMonths.cycle',
   'easySchedule.formulas.fourToSixMonths.eat', 'easySchedule.formulas.fourToSixMonths.activity', 'easySchedule.formulas.fourToSixMonths.sleep',
   'easySchedule.formulas.fourToSixMonths.yourTime',
   '["easySchedule.formulas.fourToSixMonths.logic.cycle","easySchedule.formulas.fourToSixMonths.logic.balance"]',
   240, 90, 120, 30, '[120,120,90]',
   unixepoch(), unixepoch()),
  ('sixToNineMonths', 0, 24, 40,
   'easySchedule.formulas.sixToNineMonths.label', 'easySchedule.formulas.sixToNineMonths.ageRange', 'easySchedule.formulas.sixToNineMonths.cycle',
   'easySchedule.formulas.sixToNineMonths.eat', 'easySchedule.formulas.sixToNineMonths.activity', 'easySchedule.formulas.sixToNineMonths.sleep',
   'easySchedule.formulas.sixToNineMonths.yourTime',
   '["easySchedule.formulas.sixToNineMonths.logic.window","easySchedule.formulas.sixToNineMonths.logic.dropNap"]',
   240, 120, 180, 30, '[90,90,60]',
   unixepoch(), unixepoch()),
  ('nineToTwelveMonths', 0, 40, 52,
   'easySchedule.formulas.nineToTwelveMonths.label', 'easySchedule.formulas.nineToTwelveMonths.ageRange', 'easySchedule.formulas.nineToTwelveMonths.cycle',
   'easySchedule.formulas.nineToTwelveMonths.eat', 'easySchedule.formulas.nineToTwelveMonths.activity', 'easySchedule.formulas.nineToTwelveMonths.sleep',
   'easySchedule.formulas.nineToTwelveMonths.yourTime',
   '["easySchedule.formulas.nineToTwelveMonths.logic.feedBalance","easySchedule.formulas.nineToTwelveMonths.logic.capNap"]',
   NULL, 150, 240, 25, '[90,120]',
   unixepoch(), unixepoch()),
  ('toddler', 0, 52, NULL,
   'easySchedule.formulas.toddler.label', 'easySchedule.formulas.toddler.ageRange', 'easySchedule.formulas.toddler.cycle',
   'easySchedule.formulas.toddler.eat', 'easySchedule.formulas.toddler.activity', 'easySchedule.formulas.toddler.sleep',
   'easySchedule.formulas.toddler.yourTime',
   '["easySchedule.formulas.toddler.logic.napStart","easySchedule.formulas.toddler.logic.duration"]',
   NULL, 240, 300, 20, '[120]',
   unixepoch(), unixepoch())
ON CONFLICT(`id`) DO NOTHING;
--> statement-breakpoint
-- Update sixToNineMonths with third_nap_drop_wake_threshold
UPDATE `easy_formula_rules` SET `third_nap_drop_wake_threshold` = 180 WHERE `id` = 'sixToNineMonths';
--> statement-breakpoint
-- Update nineToTwelveMonths with morning_nap_cap_minutes
UPDATE `easy_formula_rules` SET `morning_nap_cap_minutes` = 120 WHERE `id` = 'nineToTwelveMonths';
--> statement-breakpoint
-- Update toddler with afternoon activity range and sleep parameters
UPDATE `easy_formula_rules` SET
  `afternoon_activity_range_min` = 240,
  `afternoon_activity_range_max` = 300,
  `night_sleep_minutes` = 660,
  `bedtime_routine_minutes` = 30
WHERE `id` = 'toddler';
