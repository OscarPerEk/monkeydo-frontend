import type { TargetWord } from "@/types/lesson";

/**
 * Returns the length of the shared prefix between two strings (case-insensitive).
 */
function sharedPrefixLength(a: string, b: string): number {
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  let i = 0;
  while (i < al.length && i < bl.length && al[i] === bl[i]) i++;
  return i;
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
 * - Shared prefix covers ≥50% of the target word: yellow
 * - Best coverage wins, leftmost on tie
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

  // Partial match: shared prefix must cover ≥50% of target word
  let best: MatchResult | null = null;
  let bestRatio = 0;

  for (const word of unguessed) {
    const prefixLen = sharedPrefixLength(input, word.word);
    const ratio = prefixLen / word.word.length;
    if (ratio >= 0.5 && ratio > bestRatio) {
      best = { word, exact: false };
      bestRatio = ratio;
    }
  }

  return best;
}
