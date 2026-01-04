/**
 * FSRS-4.5 (Free Spaced Repetition Scheduler) Algorithm Implementation
 *
 * Based on the FSRS-4.5 specification:
 * https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
 *
 * FSRS uses a machine learning approach to predict memory retention and
 * schedule optimal review times based on the user's performance.
 */

// FSRS States
export const State = {
  New: 0,
  Learning: 1,
  Review: 2,
  Relearning: 3,
} as const;

export type StateType = (typeof State)[keyof typeof State];

// FSRS Ratings (1-4 scale)
export const Rating = {
  Again: 1,
  Hard: 2,
  Good: 3,
  Easy: 4,
} as const;

export type RatingType = (typeof Rating)[keyof typeof Rating];

// Default FSRS-4.5 parameters (optimized for most users)
export const defaultParams = {
  // Weight parameters (w[0] to w[16])
  w: [
    0.4, // w[0]: initial stability for Again
    0.6, // w[1]: initial stability for Hard
    2.4, // w[2]: initial stability for Good
    5.8, // w[3]: initial stability for Easy
    4.93, // w[4]: difficulty multiplier
    0.94, // w[5]: stability decay
    0.86, // w[6]: stability recovery
    0.01, // w[7]: difficulty floor
    1.49, // w[8]: good modifier
    0.14, // w[9]: hard modifier
    0.94, // w[10]: easy modifier
    2.18, // w[11]: lapse penalty
    0.05, // w[12]: lapse minimum
    0.34, // w[13]: relearn penalty
    1.26, // w[14]: easy bonus
    0.29, // w[15]: hard penalty
    2.61, // w[16]: fail penalty
  ],
  requestRetention: 0.9, // Target retention rate (90%)
  maximumInterval: 36500, // Maximum interval in days (100 years)
  easyBonus: 1.3,
  hardInterval: 1.2,
};

export type FSRSParams = typeof defaultParams;

// Card state for FSRS algorithm
export interface FSRSCard {
  stability: number; // Memory stability (days until 90% recall drops to desired retention)
  difficulty: number; // Card difficulty (0-1 scale)
  elapsedDays: number; // Days since last review
  scheduledDays: number; // Scheduled interval (days)
  reps: number; // Number of successful reviews
  lapses: number; // Number of times card was forgotten
  state: StateType; // Current learning state
  dueDate: number; // Unix timestamp when card is due
  lastReviewedAt: number | null; // Unix timestamp of last review
}

// Scheduling result for a single rating
export interface SchedulingInfo {
  card: FSRSCard;
  rating: RatingType;
  scheduledDays: number;
  elapsedDays: number;
}

// All possible scheduling outcomes
export type SchedulingCards = Record<RatingType, SchedulingInfo>;

/**
 * Create a new card with default FSRS state
 */
export function createNewCard(dueDate?: number): FSRSCard {
  const now = Math.floor(Date.now() / 1000);
  return {
    stability: 0,
    difficulty: 0.3, // Default difficulty (30%)
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    state: State.New,
    dueDate: dueDate ?? now,
    lastReviewedAt: null,
  };
}

/**
 * Calculate retrievability (probability of recall) at a given time
 *
 * R(t) = (1 + t/(9*S))^(-1)
 *
 * Where:
 * - t = elapsed time since last review (days)
 * - S = stability (days)
 */
export function calculateRetrievability(
  stability: number,
  elapsedDays: number,
  params: FSRSParams = defaultParams
): number {
  if (stability <= 0) return 0;
  const factor = 9 * stability;
  return Math.pow(1 + elapsedDays / factor, -1);
}

/**
 * Calculate the interval needed to achieve target retention
 *
 * I(R, S) = 9 * S * (1/R - 1)
 *
 * Where:
 * - R = desired retention rate
 * - S = stability
 */
export function calculateInterval(
  stability: number,
  requestRetention: number = defaultParams.requestRetention,
  maximumInterval: number = defaultParams.maximumInterval
): number {
  if (stability <= 0) return 0;
  const interval = 9 * stability * (1 / requestRetention - 1);
  return Math.min(Math.max(Math.round(interval), 1), maximumInterval);
}

/**
 * Calculate initial stability for new cards based on rating
 */
function calculateInitialStability(rating: RatingType, params: FSRSParams): number {
  return params.w[rating - 1];
}

/**
 * Calculate initial difficulty based on first rating
 *
 * D0(G) = w[4] - (G - 3) * w[5]
 */
function calculateInitialDifficulty(rating: RatingType, params: FSRSParams): number {
  const d = params.w[4] - (rating - 3) * params.w[5];
  return Math.min(Math.max(d, 0.01), 0.99);
}

/**
 * Update difficulty after a review
 *
 * D' = D - w[6] * (G - 3)
 */
function updateDifficulty(
  difficulty: number,
  rating: RatingType,
  params: FSRSParams
): number {
  const newDifficulty = difficulty - params.w[6] * (rating - 3);
  // Mean reversion: D' = w[7] + (1 - w[7]) * D
  const meanReverted = params.w[7] + (1 - params.w[7]) * newDifficulty;
  return Math.min(Math.max(meanReverted, 0.01), 0.99);
}

/**
 * Calculate new stability after a successful review
 *
 * S' = S * (1 + exp(w[8]) * (11 - D) * S^(-w[9]) * (exp(w[10] * (1 - R)) - 1))
 */
function calculateNextStabilitySuccess(
  stability: number,
  difficulty: number,
  retrievability: number,
  rating: RatingType,
  params: FSRSParams
): number {
  const hardPenalty = rating === Rating.Hard ? params.w[15] : 1;
  const easyBonus = rating === Rating.Easy ? params.w[14] : 1;

  const newStability =
    stability *
    (1 +
      Math.exp(params.w[8]) *
        (11 - difficulty * 10) *
        Math.pow(stability, -params.w[9]) *
        (Math.exp((1 - retrievability) * params.w[10]) - 1) *
        hardPenalty *
        easyBonus);

  return Math.max(newStability, 0.01);
}

/**
 * Calculate new stability after a failed review (lapse)
 *
 * S' = w[11] * D^(-w[12]) * ((S+1)^w[13] - 1) * exp(w[14] * (1 - R))
 */
function calculateNextStabilityFail(
  stability: number,
  difficulty: number,
  retrievability: number,
  params: FSRSParams
): number {
  const newStability =
    params.w[11] *
    Math.pow(difficulty * 10, -params.w[12]) *
    (Math.pow(stability + 1, params.w[13]) - 1) *
    Math.exp(params.w[16] * (1 - retrievability));

  return Math.min(Math.max(newStability, 0.01), stability);
}

/**
 * Get the next state based on current state and rating
 */
function getNextState(currentState: StateType, rating: RatingType): StateType {
  if (rating === Rating.Again) {
    if (currentState === State.New || currentState === State.Learning) {
      return State.Learning;
    }
    return State.Relearning;
  }

  if (currentState === State.New || currentState === State.Learning) {
    if (rating === Rating.Easy) {
      return State.Review;
    }
    return State.Learning;
  }

  return State.Review;
}

/**
 * Calculate the next interval based on state and rating
 */
function getNextInterval(
  card: FSRSCard,
  rating: RatingType,
  newStability: number,
  params: FSRSParams
): number {
  const state = card.state;

  if (rating === Rating.Again) {
    // Relearning: short interval (10 minutes to 1 day based on lapses)
    return Math.min(1, 0.007 * Math.pow(2, card.lapses)); // ~10 min, doubles with lapses
  }

  if (state === State.New || state === State.Learning || state === State.Relearning) {
    if (rating === Rating.Easy) {
      // Graduate immediately with calculated interval
      return calculateInterval(newStability, params.requestRetention, params.maximumInterval);
    }
    if (rating === Rating.Good) {
      // 10 minutes for Good in learning
      return 0.007; // ~10 minutes
    }
    // Hard in learning: 5 minutes
    return 0.003; // ~5 minutes
  }

  // Review state: use FSRS interval calculation
  return calculateInterval(newStability, params.requestRetention, params.maximumInterval);
}

/**
 * Schedule a card after a review
 */
export function scheduleCard(
  card: FSRSCard,
  rating: RatingType,
  now: number = Math.floor(Date.now() / 1000),
  params: FSRSParams = defaultParams
): FSRSCard {
  const elapsedDays = card.lastReviewedAt
    ? (now - card.lastReviewedAt) / (24 * 60 * 60)
    : 0;

  let newStability: number;
  let newDifficulty: number;

  if (card.state === State.New) {
    // First review of a new card
    newStability = calculateInitialStability(rating, params);
    newDifficulty = calculateInitialDifficulty(rating, params);
  } else {
    // Subsequent reviews
    const retrievability = calculateRetrievability(card.stability, elapsedDays, params);

    if (rating === Rating.Again) {
      // Lapse: card was forgotten
      newStability = calculateNextStabilityFail(
        card.stability,
        card.difficulty,
        retrievability,
        params
      );
      newDifficulty = updateDifficulty(card.difficulty, rating, params);
    } else {
      // Success: card was remembered
      newStability = calculateNextStabilitySuccess(
        card.stability,
        card.difficulty,
        retrievability,
        rating,
        params
      );
      newDifficulty = updateDifficulty(card.difficulty, rating, params);
    }
  }

  const nextState = getNextState(card.state, rating);
  const intervalDays = getNextInterval(
    { ...card, state: nextState },
    rating,
    newStability,
    params
  );
  const intervalSeconds = Math.round(intervalDays * 24 * 60 * 60);

  return {
    stability: newStability,
    difficulty: newDifficulty,
    elapsedDays: elapsedDays,
    scheduledDays: intervalDays,
    reps: rating === Rating.Again ? card.reps : card.reps + 1,
    lapses: rating === Rating.Again ? card.lapses + 1 : card.lapses,
    state: nextState,
    dueDate: now + intervalSeconds,
    lastReviewedAt: now,
  };
}

/**
 * Get all possible scheduling outcomes for a card
 */
export function getSchedulingCards(
  card: FSRSCard,
  now: number = Math.floor(Date.now() / 1000),
  params: FSRSParams = defaultParams
): SchedulingCards {
  const elapsedDays = card.lastReviewedAt
    ? (now - card.lastReviewedAt) / (24 * 60 * 60)
    : 0;

  return {
    [Rating.Again]: {
      card: scheduleCard(card, Rating.Again, now, params),
      rating: Rating.Again,
      scheduledDays: scheduleCard(card, Rating.Again, now, params).scheduledDays,
      elapsedDays,
    },
    [Rating.Hard]: {
      card: scheduleCard(card, Rating.Hard, now, params),
      rating: Rating.Hard,
      scheduledDays: scheduleCard(card, Rating.Hard, now, params).scheduledDays,
      elapsedDays,
    },
    [Rating.Good]: {
      card: scheduleCard(card, Rating.Good, now, params),
      rating: Rating.Good,
      scheduledDays: scheduleCard(card, Rating.Good, now, params).scheduledDays,
      elapsedDays,
    },
    [Rating.Easy]: {
      card: scheduleCard(card, Rating.Easy, now, params),
      rating: Rating.Easy,
      scheduledDays: scheduleCard(card, Rating.Easy, now, params).scheduledDays,
      elapsedDays,
    },
  };
}

/**
 * Format interval for display
 */
export function formatInterval(days: number): string {
  if (days < 1 / 24) {
    // Less than 1 hour
    const minutes = Math.round(days * 24 * 60);
    return `${minutes}m`;
  }
  if (days < 1) {
    // Less than 1 day
    const hours = Math.round(days * 24);
    return `${hours}h`;
  }
  if (days < 30) {
    return `${Math.round(days)}d`;
  }
  if (days < 365) {
    const months = Math.round(days / 30);
    return `${months}mo`;
  }
  const years = Math.round(days / 365);
  return `${years}y`;
}
