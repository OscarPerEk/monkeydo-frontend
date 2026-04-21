import type { TargetWord } from "@/types/lesson";

/**
 * A word is accepted when the typed input is a correct prefix of the target
 * AND covers ≥50% of that word's length.
 */
function isPrefixMatch(input: string, candidate: string): boolean {
  const i = input.toLowerCase();
  const c = candidate.toLowerCase();
  return c.startsWith(i) && i.length / c.length >= 0.5;
}

export interface MatchResult {
  word: TargetWord;
  /** true = exact match (green), false = prefix match (yellow) */
  exact: boolean;
}

/**
 * Finds the best unguessed word slot for the typed input.
 * Order-free: checks all unguessed slots.
 * Returns the slot with highest prefix coverage (≥50%). Leftmost wins on tie.
 */
export function findBestMatch(
  input: string,
  unguessed: TargetWord[]
): MatchResult | null {
  // Exact match takes priority
  for (const word of unguessed) {
    if (input.toLowerCase() === word.word.toLowerCase()) {
      return { word, exact: true };
    }
  }

  // Prefix match: highest coverage wins, leftmost on tie
  let best: MatchResult | null = null;
  let bestRatio = 0;

  for (const word of unguessed) {
    const ratio = input.length / word.word.length;
    if (isPrefixMatch(input, word.word) && ratio > bestRatio) {
      best = { word, exact: false };
      bestRatio = ratio;
    }
  }

  return best;
}
