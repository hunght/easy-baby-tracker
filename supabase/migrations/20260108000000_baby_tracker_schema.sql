-- Baby Easy Tracker - Supabase PostgreSQL Schema
-- Migrated from Drizzle SQLite schema

-- ============================================
-- CORE TABLES
-- ============================================

-- Baby Profiles
CREATE TABLE baby_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('unknown', 'boy', 'girl')),
  birth_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  avatar_uri TEXT,
  first_wake_time TEXT NOT NULL DEFAULT '07:00',
  selected_easy_formula_id TEXT,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
);

CREATE INDEX idx_baby_profiles_user_id ON baby_profiles(user_id);

-- Concern Choices
CREATE TABLE concern_choices (
  id BIGSERIAL PRIMARY KEY,
  baby_id BIGINT NOT NULL REFERENCES baby_profiles(id) ON DELETE CASCADE,
  concern_id TEXT NOT NULL
);

CREATE INDEX idx_concern_choices_baby_id ON concern_choices(baby_id);

-- ============================================
-- TRACKING TABLES
-- ============================================

-- Feedings
CREATE TABLE feedings (
  id BIGSERIAL PRIMARY KEY,
  baby_id BIGINT NOT NULL REFERENCES baby_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('breast', 'bottle', 'solids')),
  start_time BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT),
  duration BIGINT,
  left_duration BIGINT,
  right_duration BIGINT,
  ingredient_type TEXT CHECK (ingredient_type IS NULL OR ingredient_type IN ('breast_milk', 'formula', 'others')),
  amount_ml REAL,
  ingredient TEXT,
  amount_grams REAL,
  notes TEXT,
  recorded_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
);

CREATE INDEX idx_feedings_baby_id ON feedings(baby_id);
CREATE INDEX idx_feedings_recorded_at ON feedings(recorded_at);
CREATE INDEX idx_feedings_start_time ON feedings(start_time);

-- Sleep Sessions
CREATE TABLE sleep_sessions (
  id BIGSERIAL PRIMARY KEY,
  baby_id BIGINT NOT NULL REFERENCES baby_profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('nap', 'night')),
  start_time BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT),
  end_time BIGINT,
  duration BIGINT,
  notes TEXT,
  recorded_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
);

CREATE INDEX idx_sleep_sessions_baby_id ON sleep_sessions(baby_id);
CREATE INDEX idx_sleep_sessions_recorded_at ON sleep_sessions(recorded_at);
CREATE INDEX idx_sleep_sessions_start_time ON sleep_sessions(start_time);

-- Diary Entries
CREATE TABLE diary_entries (
  id BIGSERIAL PRIMARY KEY,
  baby_id BIGINT NOT NULL REFERENCES baby_profiles(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  photo_uri TEXT,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
);

CREATE INDEX idx_diary_entries_baby_id ON diary_entries(baby_id);
CREATE INDEX idx_diary_entries_created_at ON diary_entries(created_at);

-- Diaper Changes
CREATE TABLE diaper_changes (
  id BIGSERIAL PRIMARY KEY,
  baby_id BIGINT NOT NULL REFERENCES baby_profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('wet', 'soiled', 'mixed', 'dry')),
  time BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT),
  wetness INTEGER,
  color TEXT,
  notes TEXT,
  recorded_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
);

CREATE INDEX idx_diaper_changes_baby_id ON diaper_changes(baby_id);
CREATE INDEX idx_diaper_changes_recorded_at ON diaper_changes(recorded_at);
CREATE INDEX idx_diaper_changes_time ON diaper_changes(time);

-- Pumpings
CREATE TABLE pumpings (
  id BIGSERIAL PRIMARY KEY,
  baby_id BIGINT NOT NULL REFERENCES baby_profiles(id) ON DELETE CASCADE,
  start_time BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT),
  amount_ml REAL NOT NULL,
  left_amount_ml REAL,
  right_amount_ml REAL,
  left_duration BIGINT,
  right_duration BIGINT,
  duration BIGINT,
  notes TEXT,
  recorded_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
);

CREATE INDEX idx_pumpings_baby_id ON pumpings(baby_id);
CREATE INDEX idx_pumpings_recorded_at ON pumpings(recorded_at);
CREATE INDEX idx_pumpings_start_time ON pumpings(start_time);

-- Health Records
CREATE TABLE health_records (
  id BIGSERIAL PRIMARY KEY,
  baby_id BIGINT NOT NULL REFERENCES baby_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('temperature', 'medicine', 'symptoms')),
  time BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT),
  temperature REAL,
  medicine_type TEXT CHECK (medicine_type IS NULL OR medicine_type IN ('medication', 'vaccine')),
  medication TEXT,
  symptoms TEXT,
  notes TEXT,
  recorded_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
);

CREATE INDEX idx_health_records_baby_id ON health_records(baby_id);
CREATE INDEX idx_health_records_recorded_at ON health_records(recorded_at);
CREATE INDEX idx_health_records_time ON health_records(time);
CREATE INDEX idx_health_records_type ON health_records(type);

-- Growth Records
CREATE TABLE growth_records (
  id BIGSERIAL PRIMARY KEY,
  baby_id BIGINT NOT NULL REFERENCES baby_profiles(id) ON DELETE CASCADE,
  time BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT),
  weight_kg REAL,
  height_cm REAL,
  head_circumference_cm REAL,
  notes TEXT,
  recorded_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
);

CREATE INDEX idx_growth_records_baby_id ON growth_records(baby_id);
CREATE INDEX idx_growth_records_recorded_at ON growth_records(recorded_at);
CREATE INDEX idx_growth_records_time ON growth_records(time);

-- ============================================
-- APP STATE & NOTIFICATIONS
-- ============================================

-- App State (key-value store per user)
CREATE TABLE app_state (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT,
  UNIQUE(user_id, key)
);

CREATE INDEX idx_app_state_user_id ON app_state(user_id);

-- Scheduled Notifications
CREATE TABLE scheduled_notifications (
  id BIGSERIAL PRIMARY KEY,
  baby_id BIGINT NOT NULL REFERENCES baby_profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('feeding', 'pumping', 'sleep', 'diaper')),
  notification_id TEXT NOT NULL,
  scheduled_time BIGINT NOT NULL,
  data TEXT,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
);

CREATE INDEX idx_scheduled_notifications_baby_id ON scheduled_notifications(baby_id);
CREATE INDEX idx_scheduled_notifications_type ON scheduled_notifications(notification_type);
CREATE INDEX idx_scheduled_notifications_notification_id ON scheduled_notifications(notification_id);
CREATE INDEX idx_scheduled_notifications_scheduled_time ON scheduled_notifications(scheduled_time);

-- ============================================
-- EASY FORMULA RULES
-- ============================================

CREATE TABLE easy_formula_rules (
  id TEXT PRIMARY KEY,
  baby_id BIGINT REFERENCES baby_profiles(id) ON DELETE CASCADE,
  is_custom BOOLEAN NOT NULL DEFAULT FALSE,
  valid_date TEXT,
  source_rule_id TEXT,
  min_weeks INTEGER NOT NULL,
  max_weeks INTEGER,
  label_key TEXT,
  label_text TEXT,
  age_range_key TEXT,
  age_range_text TEXT,
  description TEXT,
  phases TEXT NOT NULL,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT),
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT),
  UNIQUE(baby_id, valid_date)
);

CREATE INDEX idx_formula_rules_baby_id ON easy_formula_rules(baby_id);
CREATE INDEX idx_formula_rules_custom ON easy_formula_rules(is_custom);
CREATE INDEX idx_formula_rules_weeks ON easy_formula_rules(min_weeks, max_weeks);
CREATE INDEX idx_formula_rules_valid_date ON easy_formula_rules(valid_date);

-- ============================================
-- HABIT TRACKING
-- ============================================

-- Habit Definitions (predefined habits)
CREATE TABLE habit_definitions (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('health', 'learning', 'physical', 'sleep', 'social', 'nutrition')),
  icon_name TEXT NOT NULL,
  label_key TEXT NOT NULL,
  description_key TEXT NOT NULL,
  min_age_months INTEGER DEFAULT 0,
  max_age_months INTEGER,
  default_frequency TEXT NOT NULL CHECK (default_frequency IN ('daily', 'twice_daily', 'multiple_daily', 'weekly')),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- Baby Habits (user's selected habits per baby)
CREATE TABLE baby_habits (
  id BIGSERIAL PRIMARY KEY,
  baby_id BIGINT NOT NULL REFERENCES baby_profiles(id) ON DELETE CASCADE,
  habit_definition_id TEXT NOT NULL REFERENCES habit_definitions(id),
  is_active BOOLEAN DEFAULT TRUE,
  target_frequency TEXT CHECK (target_frequency IS NULL OR target_frequency IN ('daily', 'twice_daily', 'multiple_daily', 'weekly')),
  reminder_time TEXT,
  reminder_days TEXT,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT),
  UNIQUE(baby_id, habit_definition_id)
);

CREATE INDEX idx_baby_habits_baby_id ON baby_habits(baby_id);
CREATE INDEX idx_baby_habits_definition ON baby_habits(habit_definition_id);

-- Habit Logs
CREATE TABLE habit_logs (
  id BIGSERIAL PRIMARY KEY,
  baby_id BIGINT NOT NULL REFERENCES baby_profiles(id) ON DELETE CASCADE,
  baby_habit_id BIGINT NOT NULL REFERENCES baby_habits(id) ON DELETE CASCADE,
  completed_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT),
  duration BIGINT,
  notes TEXT,
  recorded_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
);

CREATE INDEX idx_habit_logs_baby_id ON habit_logs(baby_id);
CREATE INDEX idx_habit_logs_baby_habit_id ON habit_logs(baby_habit_id);
CREATE INDEX idx_habit_logs_completed_at ON habit_logs(completed_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE baby_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE concern_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE diaper_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pumpings ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE easy_formula_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

-- Baby Profiles: Users can only access their own profiles
CREATE POLICY "Users can manage their own baby profiles" ON baby_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Concern Choices: Access through baby profile ownership
CREATE POLICY "Users can manage concerns for their babies" ON concern_choices
  FOR ALL USING (
    EXISTS (SELECT 1 FROM baby_profiles WHERE baby_profiles.id = concern_choices.baby_id AND baby_profiles.user_id = auth.uid())
  );

-- Tracking tables: Access through baby profile ownership
CREATE POLICY "Users can manage feedings for their babies" ON feedings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM baby_profiles WHERE baby_profiles.id = feedings.baby_id AND baby_profiles.user_id = auth.uid())
  );

CREATE POLICY "Users can manage sleep sessions for their babies" ON sleep_sessions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM baby_profiles WHERE baby_profiles.id = sleep_sessions.baby_id AND baby_profiles.user_id = auth.uid())
  );

CREATE POLICY "Users can manage diary entries for their babies" ON diary_entries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM baby_profiles WHERE baby_profiles.id = diary_entries.baby_id AND baby_profiles.user_id = auth.uid())
  );

CREATE POLICY "Users can manage diaper changes for their babies" ON diaper_changes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM baby_profiles WHERE baby_profiles.id = diaper_changes.baby_id AND baby_profiles.user_id = auth.uid())
  );

CREATE POLICY "Users can manage pumpings for their babies" ON pumpings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM baby_profiles WHERE baby_profiles.id = pumpings.baby_id AND baby_profiles.user_id = auth.uid())
  );

CREATE POLICY "Users can manage health records for their babies" ON health_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM baby_profiles WHERE baby_profiles.id = health_records.baby_id AND baby_profiles.user_id = auth.uid())
  );

CREATE POLICY "Users can manage growth records for their babies" ON growth_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM baby_profiles WHERE baby_profiles.id = growth_records.baby_id AND baby_profiles.user_id = auth.uid())
  );

-- App State: Users can only access their own state
CREATE POLICY "Users can manage their own app state" ON app_state
  FOR ALL USING (auth.uid() = user_id);

-- Scheduled Notifications: Access through baby profile ownership
CREATE POLICY "Users can manage notifications for their babies" ON scheduled_notifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM baby_profiles WHERE baby_profiles.id = scheduled_notifications.baby_id AND baby_profiles.user_id = auth.uid())
  );

-- Easy Formula Rules: Users can read predefined (baby_id IS NULL) or manage their own
CREATE POLICY "Users can read predefined formulas" ON easy_formula_rules
  FOR SELECT USING (baby_id IS NULL);

CREATE POLICY "Users can manage their custom formulas" ON easy_formula_rules
  FOR ALL USING (
    baby_id IS NOT NULL AND EXISTS (SELECT 1 FROM baby_profiles WHERE baby_profiles.id = easy_formula_rules.baby_id AND baby_profiles.user_id = auth.uid())
  );

-- Habit Definitions: Everyone can read predefined habits
CREATE POLICY "Everyone can read habit definitions" ON habit_definitions
  FOR SELECT USING (TRUE);

-- Baby Habits: Access through baby profile ownership
CREATE POLICY "Users can manage habits for their babies" ON baby_habits
  FOR ALL USING (
    EXISTS (SELECT 1 FROM baby_profiles WHERE baby_profiles.id = baby_habits.baby_id AND baby_profiles.user_id = auth.uid())
  );

-- Habit Logs: Access through baby profile ownership
CREATE POLICY "Users can manage habit logs for their babies" ON habit_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM baby_profiles WHERE baby_profiles.id = habit_logs.baby_id AND baby_profiles.user_id = auth.uid())
  );

-- ============================================
-- SEED DATA
-- ============================================

-- Predefined Habits
INSERT INTO habit_definitions (id, category, icon_name, label_key, description_key, min_age_months, max_age_months, default_frequency, sort_order) VALUES
('tummy_time', 'health', 'Baby', 'habit.tummyTime.label', 'habit.tummyTime.description', 0, 6, 'daily', 1),
('brushing_teeth', 'health', 'Sparkles', 'habit.brushingTeeth.label', 'habit.brushingTeeth.description', 6, NULL, 'twice_daily', 2),
('bath_time', 'health', 'Bath', 'habit.bathTime.label', 'habit.bathTime.description', 0, NULL, 'daily', 3),
('hand_washing', 'health', 'HandMetal', 'habit.handWashing.label', 'habit.handWashing.description', 12, NULL, 'multiple_daily', 4),
('diaper_free_time', 'health', 'Sun', 'habit.diaperFreeTime.label', 'habit.diaperFreeTime.description', 0, 24, 'daily', 5),
('sunscreen', 'health', 'SunMedium', 'habit.sunscreen.label', 'habit.sunscreen.description', 6, NULL, 'daily', 6),
('reading_time', 'learning', 'BookOpen', 'habit.readingTime.label', 'habit.readingTime.description', 0, NULL, 'daily', 1),
('singing_music', 'learning', 'Music', 'habit.singingMusic.label', 'habit.singingMusic.description', 0, NULL, 'daily', 2),
('talking_conversation', 'learning', 'MessageCircle', 'habit.talkingConversation.label', 'habit.talkingConversation.description', 0, NULL, 'multiple_daily', 3),
('peek_a_boo', 'learning', 'Eye', 'habit.peekABoo.label', 'habit.peekABoo.description', 3, 18, 'daily', 4),
('counting_practice', 'learning', 'Hash', 'habit.countingPractice.label', 'habit.countingPractice.description', 18, NULL, 'daily', 5),
('color_shape_learning', 'learning', 'Shapes', 'habit.colorShapeLearning.label', 'habit.colorShapeLearning.description', 18, NULL, 'daily', 6),
('puzzle_time', 'learning', 'Puzzle', 'habit.puzzleTime.label', 'habit.puzzleTime.description', 12, NULL, 'daily', 7),
('sensory_play', 'learning', 'Fingerprint', 'habit.sensoryPlay.label', 'habit.sensoryPlay.description', 3, 36, 'daily', 8),
('outdoor_play', 'physical', 'TreePine', 'habit.outdoorPlay.label', 'habit.outdoorPlay.description', 0, NULL, 'daily', 1),
('dance_movement', 'physical', 'Music2', 'habit.danceMovement.label', 'habit.danceMovement.description', 6, NULL, 'daily', 2),
('ball_play', 'physical', 'Circle', 'habit.ballPlay.label', 'habit.ballPlay.description', 6, NULL, 'daily', 3),
('walking_practice', 'physical', 'Footprints', 'habit.walkingPractice.label', 'habit.walkingPractice.description', 9, 18, 'daily', 4),
('stretching', 'physical', 'Stretch', 'habit.stretching.label', 'habit.stretching.description', 0, NULL, 'daily', 5),
('bedtime_routine', 'sleep', 'Moon', 'habit.bedtimeRoutine.label', 'habit.bedtimeRoutine.description', 0, NULL, 'daily', 1),
('wake_up_routine', 'sleep', 'Sunrise', 'habit.wakeUpRoutine.label', 'habit.wakeUpRoutine.description', 0, NULL, 'daily', 2),
('nap_time', 'sleep', 'CloudMoon', 'habit.napTime.label', 'habit.napTime.description', 0, 36, 'daily', 3),
('wind_down_time', 'sleep', 'Clock', 'habit.windDownTime.label', 'habit.windDownTime.description', 0, NULL, 'daily', 4),
('eye_contact', 'social', 'Eye', 'habit.eyeContact.label', 'habit.eyeContact.description', 0, 12, 'multiple_daily', 1),
('cuddling_bonding', 'social', 'Heart', 'habit.cuddlingBonding.label', 'habit.cuddlingBonding.description', 0, NULL, 'daily', 2),
('greeting_practice', 'social', 'Hand', 'habit.greetingPractice.label', 'habit.greetingPractice.description', 12, NULL, 'daily', 3),
('sharing_practice', 'social', 'Users', 'habit.sharingPractice.label', 'habit.sharingPractice.description', 18, NULL, 'daily', 4),
('thank_you_manners', 'social', 'ThumbsUp', 'habit.thankYouManners.label', 'habit.thankYouManners.description', 18, NULL, 'daily', 5),
('playdates', 'social', 'UsersRound', 'habit.playdates.label', 'habit.playdates.description', 12, NULL, 'weekly', 6),
('water_drinking', 'nutrition', 'Droplets', 'habit.waterDrinking.label', 'habit.waterDrinking.description', 6, NULL, 'multiple_daily', 1),
('vegetable_tasting', 'nutrition', 'Carrot', 'habit.vegetableTasting.label', 'habit.vegetableTasting.description', 6, NULL, 'daily', 2),
('family_meals', 'nutrition', 'UtensilsCrossed', 'habit.familyMeals.label', 'habit.familyMeals.description', 6, NULL, 'daily', 3),
('self_feeding', 'nutrition', 'HandPlatter', 'habit.selfFeeding.label', 'habit.selfFeeding.description', 9, 36, 'daily', 4)
ON CONFLICT (id) DO NOTHING;

-- Predefined Formulas
INSERT INTO easy_formula_rules (id, min_weeks, max_weeks, label_key, age_range_key, description, phases, is_custom) VALUES
('easy3', 0, 6, 'easySchedule.formulas.easy3.label', 'easySchedule.formulas.easy3.ageRange', 'easySchedule.formulas.easy3.description', '[{"eat":30,"activity":30,"sleep":120},{"eat":30,"activity":30,"sleep":120},{"eat":30,"activity":30,"sleep":120},{"eat":30,"activity":30,"sleep":45},{"eatActivity":75,"sleep":720}]', FALSE),
('easy3_5', 6, 8, 'easySchedule.formulas.easy3_5.label', 'easySchedule.formulas.easy3_5.ageRange', 'easySchedule.formulas.easy3_5.description', '[{"eat":30,"activity":60,"sleep":120},{"eat":30,"activity":60,"sleep":120},{"eat":30,"activity":60,"sleep":90},{"eat":30,"activity":30,"sleep":30},{"eatActivity":75,"sleep":720}]', FALSE),
('easy4', 8, 19, 'easySchedule.formulas.easy4.label', 'easySchedule.formulas.easy4.ageRange', 'easySchedule.formulas.easy4.description', '[{"eat":30,"activity":90,"sleep":120},{"eat":30,"activity":90,"sleep":120},{"eat":30,"activity":90,"sleep":30},{"eatActivity":90,"sleep":720}]', FALSE),
('easy234', 19, 46, 'easySchedule.formulas.easy234.label', 'easySchedule.formulas.easy234.ageRange', 'easySchedule.formulas.easy234.description', '[{"eat":30,"activity":90,"sleep":120},{"eat":30,"activity":150,"sleep":60},{"eat":30,"activity":150,"sleep":0},{"eatActivity":30,"sleep":750}]', FALSE),
('easy56', 46, NULL, 'easySchedule.formulas.easy56.label', 'easySchedule.formulas.easy56.ageRange', 'easySchedule.formulas.easy56.description', '[{"eat":30,"activity":210,"sleep":0},{"eat":30,"activity":30,"sleep":120},{"eat":30,"activity":210,"sleep":0},{"eat":30,"activity":30,"sleep":720}]', FALSE)
ON CONFLICT (id) DO NOTHING;
