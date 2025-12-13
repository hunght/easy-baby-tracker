CREATE TABLE `easy_schedule_adjustments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`baby_id` integer NOT NULL,
	`adjustment_date` text NOT NULL,
	`item_order` integer NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`baby_id`) REFERENCES `baby_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_schedule_adjustments_baby_id` ON `easy_schedule_adjustments` (`baby_id`);--> statement-breakpoint
CREATE INDEX `idx_schedule_adjustments_date` ON `easy_schedule_adjustments` (`adjustment_date`);--> statement-breakpoint
CREATE INDEX `idx_schedule_adjustments_baby_date` ON `easy_schedule_adjustments` (`baby_id`,`adjustment_date`);