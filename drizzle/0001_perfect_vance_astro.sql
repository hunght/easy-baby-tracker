CREATE TABLE `baby_habits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`baby_id` integer NOT NULL,
	`habit_definition_id` text NOT NULL,
	`is_active` integer DEFAULT true,
	`target_frequency` text,
	`reminder_time` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`baby_id`) REFERENCES `baby_profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`habit_definition_id`) REFERENCES `habit_definitions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_baby_habits_baby_id` ON `baby_habits` (`baby_id`);--> statement-breakpoint
CREATE INDEX `idx_baby_habits_definition` ON `baby_habits` (`habit_definition_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_baby_habits_unique` ON `baby_habits` (`baby_id`,`habit_definition_id`);--> statement-breakpoint
CREATE TABLE `habit_definitions` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`icon_name` text NOT NULL,
	`label_key` text NOT NULL,
	`description_key` text NOT NULL,
	`min_age_months` integer DEFAULT 0,
	`max_age_months` integer,
	`default_frequency` text NOT NULL,
	`sort_order` integer DEFAULT 0,
	`is_active` integer DEFAULT true
);
--> statement-breakpoint
CREATE TABLE `habit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`baby_id` integer NOT NULL,
	`baby_habit_id` integer NOT NULL,
	`completed_at` integer NOT NULL,
	`duration` integer,
	`notes` text,
	`recorded_at` integer NOT NULL,
	FOREIGN KEY (`baby_id`) REFERENCES `baby_profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`baby_habit_id`) REFERENCES `baby_habits`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_habit_logs_baby_id` ON `habit_logs` (`baby_id`);--> statement-breakpoint
CREATE INDEX `idx_habit_logs_baby_habit_id` ON `habit_logs` (`baby_habit_id`);--> statement-breakpoint
CREATE INDEX `idx_habit_logs_completed_at` ON `habit_logs` (`completed_at`);