import type { TargetWord } from "@/types/lesson";

/**
 * Counts how many characters match at each position (case-insensitive).
 * Only compares up to the shorter string's length.
 */
function correctCharCount(a: string, b: string): number {
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  const len = Math.min(al.length, bl.length);
  let count = 0;
  for (let i = 0; i < len; i++) {
    if (al[i] === bl[i]) count++;
  }
  return count;
}

export interface MatchResult {
  word: TargetWord;
  /** true = exact match (green), false = partial match (yellow) */
  exact: boolean;
}

/**
 * Finds the best unguessed word slot for the typed input.
 * Order-free: checks all unguessed slots.
 *
 * Matching rules:
 * - Exact match (case-insensitive): green
 * - ≥50% of characters correct at their position: yellow
 * - Most correct characters wins, leftmost on tie
 */
export function findBestMatch(
  input: string,
  unguessed: TargetWord[]
): MatchResult | null {
  // Exact match takes priority (case-insensitive)
  for (const word of unguessed) {
    if (input.toLowerCase() === word.word.toLowerCase()) {
      return { word, exact: true };
    }
  }

  // Partial match: correct characters at each position must cover ≥50% of target word
  let best: MatchResult | null = null;
  let bestCount = 0;

  for (const word of unguessed) {
    const count = correctCharCount(input, word.word);
    const threshold = Math.ceil(word.word.length / 2);
    if (count >= threshold && count > bestCount) {
      best = { word, exact: false };
      bestCount = count;
    }
  }

  return best;
}

/**
 * Checks whether the partial input (still being typed) could plausibly match
 * any unguessed word. Returns true if at least one word has ≥50% correct
 * characters at the positions typed so far.
 */
export function hasViableMatch(
  input: string,
  unguessed: TargetWord[]
): boolean {
  if (!input) return true;
  for (const word of unguessed) {
    const count = correctCharCount(input, word.word);
    const threshold = Math.ceil(input.length / 2);
    if (count >= threshold) return true;
  }
  return false;
}
