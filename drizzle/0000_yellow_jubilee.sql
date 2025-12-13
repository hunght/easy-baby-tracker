CREATE TABLE `app_state` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text
);
--> statement-breakpoint
CREATE TABLE `baby_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nickname` text NOT NULL,
	`gender` text NOT NULL,
	`birth_date` text NOT NULL,
	`due_date` text NOT NULL,
	`first_wake_time` text DEFAULT '07:00' NOT NULL,
	`selected_easy_formula_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `concern_choices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`baby_id` integer NOT NULL,
	`concern_id` text NOT NULL,
	FOREIGN KEY (`baby_id`) REFERENCES `baby_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_concern_choices_baby_id` ON `concern_choices` (`baby_id`);--> statement-breakpoint
CREATE TABLE `diaper_changes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`baby_id` integer NOT NULL,
	`kind` text NOT NULL,
	`time` integer NOT NULL,
	`wetness` integer,
	`color` text,
	`notes` text,
	`recordedAt` integer NOT NULL,
	FOREIGN KEY (`baby_id`) REFERENCES `baby_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_diaper_changes_baby_id` ON `diaper_changes` (`baby_id`);--> statement-breakpoint
CREATE INDEX `idx_diaper_changes_recorded_at` ON `diaper_changes` (`recordedAt`);--> statement-breakpoint
CREATE INDEX `idx_diaper_changes_time` ON `diaper_changes` (`time`);--> statement-breakpoint
CREATE TABLE `diary_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`baby_id` integer NOT NULL,
	`title` text,
	`content` text,
	`photoUri` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`baby_id`) REFERENCES `baby_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_diary_entries_baby_id` ON `diary_entries` (`baby_id`);--> statement-breakpoint
CREATE INDEX `idx_diary_entries_created_at` ON `diary_entries` (`createdAt`);--> statement-breakpoint
CREATE TABLE `easy_formula_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`baby_id` integer,
	`is_custom` integer DEFAULT false NOT NULL,
	`valid_date` text,
	`source_rule_id` text,
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
	`phases` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`baby_id`) REFERENCES `baby_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_formula_rules_baby_id` ON `easy_formula_rules` (`baby_id`);--> statement-breakpoint
CREATE INDEX `idx_formula_rules_custom` ON `easy_formula_rules` (`is_custom`);--> statement-breakpoint
CREATE INDEX `idx_formula_rules_weeks` ON `easy_formula_rules` (`min_weeks`,`max_weeks`);--> statement-breakpoint
CREATE INDEX `idx_formula_rules_valid_date` ON `easy_formula_rules` (`valid_date`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_formula_rules_baby_date_unique` ON `easy_formula_rules` (`baby_id`,`valid_date`);--> statement-breakpoint
CREATE TABLE `feedings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`baby_id` integer NOT NULL,
	`type` text NOT NULL,
	`startTime` integer NOT NULL,
	`duration` integer,
	`leftDuration` integer,
	`rightDuration` integer,
	`ingredientType` text,
	`amountMl` real,
	`ingredient` text,
	`amountGrams` real,
	`notes` text,
	`recordedAt` integer NOT NULL,
	FOREIGN KEY (`baby_id`) REFERENCES `baby_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_feedings_baby_id` ON `feedings` (`baby_id`);--> statement-breakpoint
CREATE INDEX `idx_feedings_recorded_at` ON `feedings` (`recordedAt`);--> statement-breakpoint
CREATE INDEX `idx_feedings_start_time` ON `feedings` (`startTime`);--> statement-breakpoint
CREATE TABLE `growth_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`baby_id` integer NOT NULL,
	`time` integer NOT NULL,
	`weightKg` real,
	`heightCm` real,
	`headCircumferenceCm` real,
	`notes` text,
	`recordedAt` integer NOT NULL,
	FOREIGN KEY (`baby_id`) REFERENCES `baby_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_growth_records_baby_id` ON `growth_records` (`baby_id`);--> statement-breakpoint
CREATE INDEX `idx_growth_records_recorded_at` ON `growth_records` (`recordedAt`);--> statement-breakpoint
CREATE INDEX `idx_growth_records_time` ON `growth_records` (`time`);--> statement-breakpoint
CREATE TABLE `health_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`baby_id` integer NOT NULL,
	`type` text NOT NULL,
	`time` integer NOT NULL,
	`temperature` real,
	`medicineType` text,
	`medication` text,
	`symptoms` text,
	`notes` text,
	`recordedAt` integer NOT NULL,
	FOREIGN KEY (`baby_id`) REFERENCES `baby_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_health_records_baby_id` ON `health_records` (`baby_id`);--> statement-breakpoint
CREATE INDEX `idx_health_records_recorded_at` ON `health_records` (`recordedAt`);--> statement-breakpoint
CREATE INDEX `idx_health_records_time` ON `health_records` (`time`);--> statement-breakpoint
CREATE INDEX `idx_health_records_type` ON `health_records` (`type`);--> statement-breakpoint
CREATE TABLE `pumpings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`baby_id` integer NOT NULL,
	`startTime` integer NOT NULL,
	`amountMl` real NOT NULL,
	`leftAmountMl` real,
	`rightAmountMl` real,
	`leftDuration` integer,
	`rightDuration` integer,
	`duration` integer,
	`notes` text,
	`recordedAt` integer NOT NULL,
	FOREIGN KEY (`baby_id`) REFERENCES `baby_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_pumpings_baby_id` ON `pumpings` (`baby_id`);--> statement-breakpoint
CREATE INDEX `idx_pumpings_recorded_at` ON `pumpings` (`recordedAt`);--> statement-breakpoint
CREATE INDEX `idx_pumpings_start_time` ON `pumpings` (`startTime`);--> statement-breakpoint
CREATE TABLE `scheduled_notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`baby_id` integer NOT NULL,
	`notification_type` text NOT NULL,
	`notification_id` text NOT NULL,
	`scheduled_time` integer NOT NULL,
	`data` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`baby_id`) REFERENCES `baby_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_scheduled_notifications_baby_id` ON `scheduled_notifications` (`baby_id`);--> statement-breakpoint
CREATE INDEX `idx_scheduled_notifications_type` ON `scheduled_notifications` (`notification_type`);--> statement-breakpoint
CREATE INDEX `idx_scheduled_notifications_notification_id` ON `scheduled_notifications` (`notification_id`);--> statement-breakpoint
CREATE INDEX `idx_scheduled_notifications_scheduled_time` ON `scheduled_notifications` (`scheduled_time`);--> statement-breakpoint
CREATE TABLE `sleep_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`baby_id` integer NOT NULL,
	`kind` text NOT NULL,
	`startTime` integer NOT NULL,
	`endTime` integer,
	`duration` integer,
	`notes` text,
	`recordedAt` integer NOT NULL,
	FOREIGN KEY (`baby_id`) REFERENCES `baby_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_sleep_sessions_baby_id` ON `sleep_sessions` (`baby_id`);--> statement-breakpoint
CREATE INDEX `idx_sleep_sessions_recorded_at` ON `sleep_sessions` (`recordedAt`);--> statement-breakpoint
CREATE INDEX `idx_sleep_sessions_start_time` ON `sleep_sessions` (`startTime`);--> statement-breakpoint
-- Seed predefined formula rules
INSERT INTO `easy_formula_rules` (`id`, `is_custom`, `min_weeks`, `max_weeks`, `label_key`, `age_range_key`, `cycle_key`, `eat_key`, `activity_key`, `sleep_key`, `your_time_key`, `logic_keys`, `phases`, `created_at`, `updated_at`) VALUES
('newborn', 0, 0, 16, 'easySchedule.formulas.newborn.label', 'easySchedule.formulas.newborn.ageRange', 'easySchedule.formulas.newborn.cycle', 'easySchedule.formulas.newborn.eat', 'easySchedule.formulas.newborn.activity', 'easySchedule.formulas.newborn.sleep', 'easySchedule.formulas.newborn.yourTime', '["easySchedule.formulas.newborn.logic.cycle","easySchedule.formulas.newborn.logic.activity"]', '[{"eat":35,"activity":55,"sleep":120},{"eat":35,"activity":55,"sleep":120},{"eat":35,"activity":55,"sleep":90},{"eat":35,"activity":55,"sleep":60}]', strftime('%s','now'), strftime('%s','now'));--> statement-breakpoint
INSERT INTO `easy_formula_rules` (`id`, `is_custom`, `min_weeks`, `max_weeks`, `label_key`, `age_range_key`, `cycle_key`, `eat_key`, `activity_key`, `sleep_key`, `your_time_key`, `logic_keys`, `phases`, `created_at`, `updated_at`) VALUES
('fourToSixMonths', 0, 16, 24, 'easySchedule.formulas.fourToSixMonths.label', 'easySchedule.formulas.fourToSixMonths.ageRange', 'easySchedule.formulas.fourToSixMonths.cycle', 'easySchedule.formulas.fourToSixMonths.eat', 'easySchedule.formulas.fourToSixMonths.activity', 'easySchedule.formulas.fourToSixMonths.sleep', 'easySchedule.formulas.fourToSixMonths.yourTime', '["easySchedule.formulas.fourToSixMonths.logic.cycle","easySchedule.formulas.fourToSixMonths.logic.balance"]', '[{"eat":30,"activity":90,"sleep":120},{"eat":30,"activity":90,"sleep":120},{"eat":30,"activity":90,"sleep":90}]', strftime('%s','now'), strftime('%s','now'));--> statement-breakpoint
INSERT INTO `easy_formula_rules` (`id`, `is_custom`, `min_weeks`, `max_weeks`, `label_key`, `age_range_key`, `cycle_key`, `eat_key`, `activity_key`, `sleep_key`, `your_time_key`, `logic_keys`, `phases`, `created_at`, `updated_at`) VALUES
('sixToNineMonths', 0, 24, 40, 'easySchedule.formulas.sixToNineMonths.label', 'easySchedule.formulas.sixToNineMonths.ageRange', 'easySchedule.formulas.sixToNineMonths.cycle', 'easySchedule.formulas.sixToNineMonths.eat', 'easySchedule.formulas.sixToNineMonths.activity', 'easySchedule.formulas.sixToNineMonths.sleep', 'easySchedule.formulas.sixToNineMonths.yourTime', '["easySchedule.formulas.sixToNineMonths.logic.window","easySchedule.formulas.sixToNineMonths.logic.dropNap"]', '[{"eat":30,"activity":120,"sleep":90},{"eat":30,"activity":120,"sleep":90},{"eat":30,"activity":120,"sleep":60}]', strftime('%s','now'), strftime('%s','now'));--> statement-breakpoint
INSERT INTO `easy_formula_rules` (`id`, `is_custom`, `min_weeks`, `max_weeks`, `label_key`, `age_range_key`, `cycle_key`, `eat_key`, `activity_key`, `sleep_key`, `your_time_key`, `logic_keys`, `phases`, `created_at`, `updated_at`) VALUES
('nineToTwelveMonths', 0, 40, 52, 'easySchedule.formulas.nineToTwelveMonths.label', 'easySchedule.formulas.nineToTwelveMonths.ageRange', 'easySchedule.formulas.nineToTwelveMonths.cycle', 'easySchedule.formulas.nineToTwelveMonths.eat', 'easySchedule.formulas.nineToTwelveMonths.activity', 'easySchedule.formulas.nineToTwelveMonths.sleep', 'easySchedule.formulas.nineToTwelveMonths.yourTime', '["easySchedule.formulas.nineToTwelveMonths.logic.feedBalance","easySchedule.formulas.nineToTwelveMonths.logic.capNap"]', '[{"eat":25,"activity":150,"sleep":90},{"eat":25,"activity":150,"sleep":120}]', strftime('%s','now'), strftime('%s','now'));--> statement-breakpoint
INSERT INTO `easy_formula_rules` (`id`, `is_custom`, `min_weeks`, `max_weeks`, `label_key`, `age_range_key`, `cycle_key`, `eat_key`, `activity_key`, `sleep_key`, `your_time_key`, `logic_keys`, `phases`, `created_at`, `updated_at`) VALUES
('toddler', 0, 52, NULL, 'easySchedule.formulas.toddler.label', 'easySchedule.formulas.toddler.ageRange', 'easySchedule.formulas.toddler.cycle', 'easySchedule.formulas.toddler.eat', 'easySchedule.formulas.toddler.activity', 'easySchedule.formulas.toddler.sleep', 'easySchedule.formulas.toddler.yourTime', '["easySchedule.formulas.toddler.logic.napStart","easySchedule.formulas.toddler.logic.duration"]', '[{"eat":20,"activity":240,"sleep":120}]', strftime('%s','now'), strftime('%s','now'));
