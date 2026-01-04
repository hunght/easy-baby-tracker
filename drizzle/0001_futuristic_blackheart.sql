CREATE TABLE `card_progress` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`word_id` integer NOT NULL,
	`stability` real DEFAULT 0 NOT NULL,
	`difficulty` real DEFAULT 0.3 NOT NULL,
	`elapsed_days` real DEFAULT 0 NOT NULL,
	`scheduled_days` real DEFAULT 0 NOT NULL,
	`reps` integer DEFAULT 0 NOT NULL,
	`lapses` integer DEFAULT 0 NOT NULL,
	`state` integer DEFAULT 0 NOT NULL,
	`due_date` integer NOT NULL,
	`last_reviewed_at` integer,
	`total_attempts` integer DEFAULT 0 NOT NULL,
	`correct_attempts` integer DEFAULT 0 NOT NULL,
	`average_levenshtein` real DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`word_id`) REFERENCES `words`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `card_progress_due_date_idx` ON `card_progress` (`due_date`);--> statement-breakpoint
CREATE INDEX `card_progress_state_idx` ON `card_progress` (`state`);--> statement-breakpoint
CREATE INDEX `card_progress_user_id_idx` ON `card_progress` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `card_progress_user_word_unique` ON `card_progress` (`user_id`,`word_id`);--> statement-breakpoint
CREATE TABLE `daily_progress` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`date` integer NOT NULL,
	`words_reviewed` integer DEFAULT 0 NOT NULL,
	`words_learned` integer DEFAULT 0 NOT NULL,
	`minutes_practiced` integer DEFAULT 0 NOT NULL,
	`goal_met` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user_profile`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `daily_progress_date_idx` ON `daily_progress` (`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `daily_progress_user_date_unique` ON `daily_progress` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE `quiz_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`card_progress_id` integer NOT NULL,
	`word_id` integer NOT NULL,
	`user_input` text NOT NULL,
	`is_correct` integer NOT NULL,
	`levenshtein_distance` integer NOT NULL,
	`normalized_error` real NOT NULL,
	`fsrs_rating` integer NOT NULL,
	`response_time_ms` integer,
	`attempted_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `quiz_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`card_progress_id`) REFERENCES `card_progress`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`word_id`) REFERENCES `words`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `quiz_attempts_session_idx` ON `quiz_attempts` (`session_id`);--> statement-breakpoint
CREATE INDEX `quiz_attempts_card_progress_idx` ON `quiz_attempts` (`card_progress_id`);--> statement-breakpoint
CREATE TABLE `quiz_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`words_attempted` integer DEFAULT 0 NOT NULL,
	`words_correct` integer DEFAULT 0 NOT NULL,
	`session_type` text DEFAULT 'practice' NOT NULL,
	`category_id` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `word_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `quiz_sessions_user_id_idx` ON `quiz_sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_profile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text DEFAULT 'Player' NOT NULL,
	`created_at` integer NOT NULL,
	`settings` text
);
--> statement-breakpoint
CREATE TABLE `user_stats` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`current_streak` integer DEFAULT 0 NOT NULL,
	`longest_streak` integer DEFAULT 0 NOT NULL,
	`last_practice_date` integer,
	`total_words_learned` integer DEFAULT 0 NOT NULL,
	`total_quizzes` integer DEFAULT 0 NOT NULL,
	`total_correct` integer DEFAULT 0 NOT NULL,
	`total_attempts` integer DEFAULT 0 NOT NULL,
	`xp_points` integer DEFAULT 0 NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user_profile`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `word_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `word_categories_name_unique` ON `word_categories` (`name`);--> statement-breakpoint
CREATE TABLE `word_category_mapping` (
	`word_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	FOREIGN KEY (`word_id`) REFERENCES `words`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `word_categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `word_category_unique` ON `word_category_mapping` (`word_id`,`category_id`);--> statement-breakpoint
CREATE TABLE `words` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`word` text NOT NULL,
	`definition` text NOT NULL,
	`part_of_speech` text,
	`pronunciation` text,
	`audio_url` text,
	`etymology` text,
	`example_sentence` text,
	`difficulty` integer DEFAULT 1000 NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`syllable_count` integer,
	`imported_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `words_word_unique` ON `words` (`word`);--> statement-breakpoint
CREATE INDEX `words_word_idx` ON `words` (`word`);--> statement-breakpoint
CREATE INDEX `words_difficulty_idx` ON `words` (`difficulty`);