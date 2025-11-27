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
CREATE INDEX `idx_sleep_sessions_start_time` ON `sleep_sessions` (`startTime`);