/**
 * Levenshtein Distance to FSRS Rating Conversion
 *
 * This module calculates the Levenshtein (edit) distance between user input
 * and the target word, then converts it to an FSRS rating for adaptive
 * spaced repetition scheduling.
 *
 * The key insight is that instead of subjective self-reported ratings
 * ("Easy", "Hard", "Again"), we use an objective metric based on actual
 * spelling accuracy.
 */

import { Rating, type RatingType } from './fsrs';

// Error type classification
export type ErrorType = 'perfect' | 'typo' | 'phonetic' | 'major';

// Result of Levenshtein analysis
export interface LevenshteinResult {
  rating: RatingType;
  distance: number;
  normalizedError: number;
  errorType: ErrorType;
  isCorrect: boolean;
}

// Detailed error analysis
export interface ErrorAnalysis {
  type: ErrorType;
  description: string;
  suggestions: string[];
}

/**
 * Calculate Levenshtein distance between two strings
 *
 * Uses Wagner-Fischer algorithm with O(min(m,n)) space optimization.
 * The Levenshtein distance is the minimum number of single-character edits
 * (insertions, deletions, substitutions) required to transform one string
 * into another.
 */
export function calculateLevenshtein(a: string, b: string): number {
  // Normalize to lowercase for comparison
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();

  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  // Ensure s1 is the shorter string for space efficiency
  const [short, long] = s1.length <= s2.length ? [s1, s2] : [s2, s1];
  const m = short.length;
  const n = long.length;

  // Previous and current row of distances
  let prev = Array.from({ length: m + 1 }, (_, i) => i);
  const curr = new Array<number>(m + 1);

  for (let j = 1; j <= n; j++) {
    curr[0] = j;
    for (let i = 1; i <= m; i++) {
      if (short[i - 1] === long[j - 1]) {
        curr[i] = prev[i - 1];
      } else {
        curr[i] = 1 + Math.min(prev[i - 1], prev[i], curr[i - 1]);
      }
    }
    // Swap rows
    prev = [...curr];
  }

  return prev[m];
}

/**
 * Calculate Damerau-Levenshtein distance (includes transpositions)
 *
 * This variant also counts transposition of two adjacent characters
 * as a single edit, which better captures common typing errors.
 */
export function calculateDamerauLevenshtein(a: string, b: string): number {
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();

  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const m = s1.length;
  const n = s2.length;

  // Use a 2D array for the full algorithm (needed for transpositions)
  const d: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;

      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );

      // Transposition
      if (i > 1 && j > 1 && s1[i - 1] === s2[j - 2] && s1[i - 2] === s2[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
      }
    }
  }

  return d[m][n];
}

/**
 * Check if the error is likely a transposition
 */
function hasTransposition(input: string, target: string): boolean {
  const a = input.toLowerCase();
  const b = target.toLowerCase();

  if (Math.abs(a.length - b.length) > 1) return false;

  let transpositions = 0;
  const minLen = Math.min(a.length, b.length);

  for (let i = 0; i < minLen - 1; i++) {
    if (a[i] !== b[i] && a[i] === b[i + 1] && a[i + 1] === b[i]) {
      transpositions++;
      i++; // Skip the next character as it's part of the transposition
    }
  }

  return transpositions > 0;
}

/**
 * Simple phonetic similarity check using common patterns
 */
function arePhoneticallySimlar(input: string, target: string): boolean {
  const a = input.toLowerCase();
  const b = target.toLowerCase();

  // Common phonetic confusions
  const phoneticPairs = [
    ['ie', 'ei'],
    ['ph', 'f'],
    ['ck', 'k'],
    ['ou', 'o'],
    ['ee', 'ea'],
    ['oo', 'u'],
    ['tion', 'sion'],
    ['ance', 'ence'],
    ['able', 'ible'],
    ['er', 'or'],
    ['ar', 'er'],
    ['le', 'el'],
    ['c', 's'],
    ['c', 'k'],
    ['qu', 'kw'],
  ];

  // Normalize both strings with phonetic replacements
  let aNorm = a;
  let bNorm = b;

  for (const [from, to] of phoneticPairs) {
    aNorm = aNorm.replace(new RegExp(from, 'g'), to);
    bNorm = bNorm.replace(new RegExp(from, 'g'), to);
  }

  // If normalized versions are more similar, it's likely a phonetic error
  const originalDistance = calculateLevenshtein(a, b);
  const normalizedDistance = calculateLevenshtein(aNorm, bNorm);

  return normalizedDistance < originalDistance;
}

/**
 * Check for common rule violations
 */
function checkRuleViolations(input: string, target: string): string | null {
  const a = input.toLowerCase();
  const b = target.toLowerCase();

  // i before e except after c
  if (
    (a.includes('ei') && b.includes('ie') && !b.includes('cei')) ||
    (a.includes('ie') && b.includes('ei') && !a.includes('cie'))
  ) {
    return 'i before e except after c';
  }

  // Silent e rules
  if (target.endsWith('e') && !input.endsWith('e')) {
    return 'Missing silent e at the end';
  }

  // Double consonant rules
  const doubleConsonants = ['bb', 'cc', 'dd', 'ff', 'gg', 'kk', 'll', 'mm', 'nn', 'pp', 'rr', 'ss', 'tt', 'zz'];
  for (const dc of doubleConsonants) {
    if (b.includes(dc) && !a.includes(dc)) {
      return `Missing double ${dc[0]}`;
    }
    if (a.includes(dc) && !b.includes(dc)) {
      return `Extra double ${dc[0]}`;
    }
  }

  return null;
}

/**
 * Convert Levenshtein distance to FSRS rating
 *
 * Rating thresholds are normalized by word length:
 * - Perfect (0 errors): Rating 4 (Easy)
 * - Minor typo (<=10% error rate): Rating 3 (Good)
 * - Moderate error (<=30%): Rating 2 (Hard)
 * - Major error (>30%): Rating 1 (Again)
 */
export function levenshteinToRating(
  userInput: string,
  targetWord: string
): LevenshteinResult {
  const distance = calculateDamerauLevenshtein(userInput, targetWord);
  const normalizedError = distance / targetWord.length;
  const isCorrect = distance === 0;

  let rating: RatingType;
  let errorType: ErrorType;

  if (distance === 0) {
    rating = Rating.Easy;
    errorType = 'perfect';
  } else if (normalizedError <= 0.1) {
    // Up to 10% error rate: minor typo (Good)
    rating = Rating.Good;
    errorType = 'typo';
  } else if (normalizedError <= 0.3) {
    // Up to 30% error rate: moderate error (Hard)
    rating = Rating.Hard;
    // Check if it's a phonetic error
    errorType = arePhoneticallySimlar(userInput, targetWord) ? 'phonetic' : 'typo';
  } else {
    // Over 30% error rate: major error (Again)
    rating = Rating.Again;
    errorType = 'major';
  }

  return {
    rating,
    distance,
    normalizedError,
    errorType,
    isCorrect,
  };
}

/**
 * Analyze the error in detail for user feedback
 */
export function analyzeError(userInput: string, targetWord: string): ErrorAnalysis {
  const { distance, normalizedError, errorType } = levenshteinToRating(userInput, targetWord);
  const suggestions: string[] = [];

  if (distance === 0) {
    return {
      type: 'perfect',
      description: 'Perfect spelling!',
      suggestions: [],
    };
  }

  let description: string;

  // Check for specific patterns
  if (hasTransposition(userInput, targetWord)) {
    description = 'Letter transposition detected';
    suggestions.push('Check the order of adjacent letters');
  } else if (arePhoneticallySimlar(userInput, targetWord)) {
    description = 'Phonetic error - sounds similar but different spelling';
    suggestions.push('Focus on the letter patterns, not just the sound');

    // Check for specific rule violations
    const ruleViolation = checkRuleViolations(userInput, targetWord);
    if (ruleViolation) {
      suggestions.push(`Remember: ${ruleViolation}`);
    }
  } else if (normalizedError <= 0.2) {
    description = 'Minor spelling error';
    suggestions.push('Almost there! Review the word carefully');
  } else if (normalizedError <= 0.4) {
    description = 'Several spelling mistakes';
    suggestions.push('Practice this word more frequently');
    suggestions.push('Try breaking the word into syllables');
  } else {
    description = 'Significant spelling difference';
    suggestions.push('Study the etymology of this word');
    suggestions.push('Practice writing the word multiple times');
  }

  return {
    type: errorType,
    description,
    suggestions,
  };
}

/**
 * Generate a visual diff showing the differences between input and target
 */
export interface DiffSegment {
  text: string;
  type: 'correct' | 'wrong' | 'missing' | 'extra';
}

export function generateDiff(userInput: string, targetWord: string): DiffSegment[] {
  const segments: DiffSegment[] = [];
  const a = userInput.toLowerCase();
  const b = targetWord.toLowerCase();

  let i = 0;
  let j = 0;

  while (i < a.length || j < b.length) {
    if (i >= a.length) {
      // Remaining characters in target are missing
      segments.push({ text: b.slice(j), type: 'missing' });
      break;
    }
    if (j >= b.length) {
      // Remaining characters in input are extra
      segments.push({ text: a.slice(i), type: 'extra' });
      break;
    }
    if (a[i] === b[j]) {
      // Characters match
      let matchEnd = i;
      while (matchEnd < a.length && matchEnd - i < b.length - j && a[matchEnd] === b[j + matchEnd - i]) {
        matchEnd++;
      }
      segments.push({ text: a.slice(i, matchEnd), type: 'correct' });
      j += matchEnd - i;
      i = matchEnd;
    } else {
      // Characters don't match - find the next matching point
      segments.push({ text: a[i], type: 'wrong' });
      i++;
      j++;
    }
  }

  return segments;
}

/**
 * Get a human-readable description of the FSRS rating
 */
export function getRatingDescription(rating: RatingType): string {
  switch (rating) {
    case Rating.Again:
      return 'Again (review soon)';
    case Rating.Hard:
      return 'Hard (short interval)';
    case Rating.Good:
      return 'Good (normal interval)';
    case Rating.Easy:
      return 'Easy (long interval)';
  }
}

/**
 * Calculate accuracy percentage from Levenshtein distance
 */
export function calculateAccuracy(distance: number, wordLength: number): number {
  if (wordLength === 0) return distance === 0 ? 100 : 0;
  return Math.max(0, Math.round((1 - distance / wordLength) * 100));
}
