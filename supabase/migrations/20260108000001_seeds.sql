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
