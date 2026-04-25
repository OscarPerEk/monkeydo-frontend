"use client";

import { useState } from "react";
import type { TargetWord } from "@/types/lesson";
import type { WordStatus } from "@/types/game";
import type { MasteryLevel } from "@/lib/scoring";

export interface SelectedRange {
  startWordIndex: number;
  endWordIndex: number;
}

interface Props {
  targetData: TargetWord[];
  wordStatusMap?: Map<number, WordStatus>;
  masteryMap?: Map<number, MasteryLevel>;
  mode: "session" | "overall";
  /** Current saved range (word indices) */
  savedRange?: { start: number; end: number } | null;
  /** Called when local selection changes (not yet saved) */
  onSelectionChange?: (range: SelectedRange | null) => void;
}

const sessionColors: Record<WordStatus, string> = {
  correct: "text-emerald-400",
  ok: "text-yellow-400",
  wrong: "text-red-400",
  skipped: "text-zinc-300",
};

const masteryColors: Record<MasteryLevel, string> = {
  gold: "text-amber-300",
  green: "text-emerald-400",
  yellow: "text-yellow-400",
  red: "text-red-400",
};

type RangeState = "idle" | "start-selected" | "complete";

export default function TextDisplay({
  targetData,
  wordStatusMap,
  masteryMap,
  mode,
  savedRange,
  onSelectionChange,
}: Props) {
  const [rangeState, setRangeState] = useState<RangeState>("idle");
  const [startSentence, setStartSentence] = useState<number | null>(null);
  const [endSentence, setEndSentence] = useState<number | null>(null);

  // Group words by sentence_index
  const sentenceMap = new Map<number, TargetWord[]>();
  for (const w of targetData) {
    if (!sentenceMap.has(w.sentence_index)) sentenceMap.set(w.sentence_index, []);
    sentenceMap.get(w.sentence_index)!.push(w);
  }
  const sortedSentences = [...sentenceMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([idx, words]) => ({ sentenceIndex: idx, words: words.sort((a, b) => a.index - b.index) }));

  // Derive saved sentence range from saved word range
  const savedStartSentence = savedRange
    ? targetData.find((w) => w.index === savedRange.start)?.sentence_index ?? null
    : null;
  const savedEndSentence = savedRange
    ? targetData.find((w) => w.index === savedRange.end)?.sentence_index ?? null
    : null;

  function handleSentenceClick(sentenceIndex: number) {
    if (!onSelectionChange) return;

    if (rangeState === "idle" || rangeState === "complete") {
      setStartSentence(sentenceIndex);
      setEndSentence(null);
      setRangeState("start-selected");
      onSelectionChange(null); // clear pending selection
    } else if (rangeState === "start-selected") {
      const s = Math.min(startSentence!, sentenceIndex);
      const e = Math.max(startSentence!, sentenceIndex);
      setStartSentence(s);
      setEndSentence(e);
      setRangeState("complete");

      // Compute word index range and notify parent
      const wordsInRange = targetData.filter(
        (w) => w.sentence_index >= s && w.sentence_index <= e,
      );
      if (wordsInRange.length > 0) {
        onSelectionChange({
          startWordIndex: Math.min(...wordsInRange.map((w) => w.index)),
          endWordIndex: Math.max(...wordsInRange.map((w) => w.index)),
        });
      }
    }
  }

  function handleClear() {
    setStartSentence(null);
    setEndSentence(null);
    setRangeState("idle");
    onSelectionChange?.(null);
  }

  function isSentenceInRange(sentenceIndex: number): boolean {
    // During active selection
    if (rangeState === "start-selected" && startSentence != null) {
      return sentenceIndex === startSentence;
    }
    if (rangeState === "complete" && startSentence != null && endSentence != null) {
      return sentenceIndex >= startSentence && sentenceIndex <= endSentence;
    }
    // Show saved range when idle
    if (rangeState === "idle" && savedStartSentence != null && savedEndSentence != null) {
      return sentenceIndex >= savedStartSentence && sentenceIndex <= savedEndSentence;
    }
    return false;
  }

  function getWordColor(word: TargetWord): string {
    if (word.excluded) return "text-blue-400";
    if (mode === "session") {
      const status = wordStatusMap?.get(word.index);
      if (!status) return "text-zinc-300";
      return sessionColors[status];
    } else {
      const mastery = masteryMap?.get(word.index);
      if (!mastery) return "text-zinc-300";
      return masteryColors[mastery];
    }
  }

  return (
    <div className="w-full space-y-3">
      {/* Range hint */}
      {onSelectionChange && (
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          {rangeState === "start-selected" && <span>Klicke den Endsatz…</span>}
          {rangeState === "idle" && !savedRange && <span>Klicke einen Satz als Startpunkt</span>}
          {rangeState === "idle" && savedRange && <span>Aktive Range gespeichert</span>}
          {(rangeState === "complete" || (rangeState === "idle" && savedRange)) && (
            <button
              onClick={handleClear}
              className="text-zinc-500 hover:text-zinc-300 transition-colors underline"
            >
              Range löschen
            </button>
          )}
        </div>
      )}

      {/* Text */}
      <div className="w-full max-h-[50vh] overflow-y-auto space-y-2">
        {sortedSentences.map(({ sentenceIndex, words }) => {
          const inRange = isSentenceInRange(sentenceIndex);
          const clickable = !!onSelectionChange;
          return (
            <p
              key={sentenceIndex}
              onClick={clickable ? () => handleSentenceClick(sentenceIndex) : undefined}
              className={`text-base leading-relaxed rounded px-2 py-1 -mx-2 ${
                inRange ? "bg-yellow-400/10 border-l-2 border-yellow-400" : ""
              } ${clickable ? "cursor-pointer hover:bg-zinc-800/50" : ""}`}
            >
              {words.map((word, j) => (
                <span key={word.index}>
                  {j > 0 && " "}
                  <span className={getWordColor(word)}>{word.word}</span>
                </span>
              ))}
            </p>
          );
        })}
      </div>
    </div>
  );
}
