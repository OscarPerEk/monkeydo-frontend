import type { WordHistoryOut } from "@/types/game";
import type { TargetWord } from "@/types/lesson";

type Difficulty = "easy" | "medium" | "hard";

export interface SessionStats {
  score: number; // 0–100
  wpm: number;
  progress: number; // 0–100
}

/**
 * Mirrors the hint-length formula from EnginePanel.
 * Returns how many characters were revealed as a hint.
 */
function getHintLength(
  wordLen: number,
  difficulty: Difficulty,
  attempts: number,
): number {
  if (attempts <= 1) return 0; // first attempt has no hint
  const wrongCount = attempts - 1;
  let base: number;
  if (difficulty === "easy") base = wordLen;
  else if (difficulty === "medium") base = Math.ceil(wordLen / 2);
  else base = 1;
  return Math.min(base + (wrongCount - 1), wordLen);
}

/**
 * Compute session statistics from word history.
 *
 * Scoring rules:
 * - correct (green) = 100 base points
 * - ok (yellow) = 50 base points
 * - wrong (failed) = 0 points
 * - skipped (enter-skip) = excluded entirely
 * - Hint penalty: base × (1 - hintCharsRevealed / wordLength)
 *
 * WPM: total correct characters (green + yellow words) / 5 / minutes
 * Progress: attempted words / total non-excluded words
 */
/**
 * @param playableCount - number of words that were actually playable (not excluded, not out of range)
 */
export function computeSessionStats(
  history: WordHistoryOut[],
  targetData: TargetWord[],
  difficulty: Difficulty,
  durationSeconds: number,
  playableCount?: number,
): SessionStats {
  const nonExcluded = playableCount ?? targetData.filter((w) => !w.excluded).length;
  const wordMap = new Map(targetData.map((w) => [w.index, w]));

  let totalScore = 0;
  let maxScore = 0;
  let correctChars = 0;
  let attemptedCount = 0;
  let totalLatencyMs = 0;

  for (const entry of history) {
    if (entry.status === "skipped") continue;

    attemptedCount++;
    const target = wordMap.get(entry.word_index);
    const wordLen = target?.word.length ?? 1;

    let base: number;
    if (entry.status === "correct") base = 100;
    else if (entry.status === "ok") base = 50;
    else base = 0;

    const hintLen = getHintLength(wordLen, difficulty, entry.attempts);
    const hintPenalty = hintLen / wordLen;
    const wordScore = base * (1 - hintPenalty);

    totalScore += wordScore;
    maxScore += 100;

    if (entry.status === "correct" || entry.status === "ok") {
      correctChars += wordLen;
    }

    totalLatencyMs += entry.latency_ms;
  }

  const score = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  // WPM: use actual time spent (sum of latencies), fall back to duration
  const elapsedMs = totalLatencyMs > 0 ? totalLatencyMs : durationSeconds * 1000;
  const elapsedMin = elapsedMs / 60000;
  const wpm = elapsedMin > 0 ? correctChars / 5 / elapsedMin : 0;

  const progress =
    nonExcluded > 0 ? Math.min((attemptedCount / nonExcluded) * 100, 100) : 0;

  return {
    score: Math.round(score * 10) / 10,
    wpm: Math.round(wpm * 10) / 10,
    progress: Math.round(progress * 10) / 10,
  };
}

export type MasteryLevel = "gold" | "green" | "yellow" | "red";

/**
 * For the "Insgesamt" view: compute mastery per word based on last 3 sessions.
 * Returns a map from word_index to mastery level.
 */
export function computeOverallMastery(
  allHistories: WordHistoryOut[][],
): Map<number, MasteryLevel> {
  // Group by word_index, keep only the last 3 entries (sessions are ordered newest-first)
  const wordSessions = new Map<number, WordHistoryOut[]>();
  for (const history of allHistories) {
    for (const entry of history) {
      if (entry.status === "skipped") continue;
      if (!wordSessions.has(entry.word_index)) {
        wordSessions.set(entry.word_index, []);
      }
      wordSessions.get(entry.word_index)!.push(entry);
    }
  }

  const result = new Map<number, MasteryLevel>();
  for (const [wordIndex, entries] of wordSessions) {
    const last3 = entries.slice(0, 3);
    const correctCount = last3.filter(
      (e) => e.status === "correct" || e.status === "ok",
    ).length;

    let level: MasteryLevel;
    if (correctCount >= 3) level = "gold";
    else if (correctCount === 2) level = "green";
    else if (correctCount === 1) level = "yellow";
    else level = "red";

    result.set(wordIndex, level);
  }

  return result;
}
