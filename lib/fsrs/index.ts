/**
 * FSRS (Free Spaced Repetition Scheduler) Module
 *
 * This module provides:
 * - FSRS-4.5 algorithm for adaptive spaced repetition
 * - Levenshtein distance calculation for spelling accuracy
 * - Automatic rating conversion based on spelling accuracy
 */

export {
  // FSRS Core
  State,
  Rating,
  defaultParams,
  createNewCard,
  calculateRetrievability,
  calculateInterval,
  scheduleCard,
  getSchedulingCards,
  formatInterval,
  type StateType,
  type RatingType,
  type FSRSParams,
  type FSRSCard,
  type SchedulingInfo,
  type SchedulingCards,
} from './fsrs';

export {
  // Levenshtein & Rating
  calculateLevenshtein,
  calculateDamerauLevenshtein,
  levenshteinToRating,
  analyzeError,
  generateDiff,
  getRatingDescription,
  calculateAccuracy,
  type ErrorType,
  type LevenshteinResult,
  type ErrorAnalysis,
  type DiffSegment,
} from './levenshtein-rating';
