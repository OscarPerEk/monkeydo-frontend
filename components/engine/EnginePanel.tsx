"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getLesson, startGame, finishGame } from "@/lib/api";
import { findBestMatch } from "@/lib/matching";
import type { LessonDetail, TargetWord } from "@/types/lesson";
import type { GameState, SlotState, WordHistoryEntry } from "@/types/game";
import InputBox from "./InputBox";
import PreGame from "./PreGame";
import Timer from "./Timer";
import WordSlot from "./WordSlot";

interface Props {
  lessonId: string;
}

interface SlotMeta {
  state: SlotState;
  typedWord: string | null;
  attempts: number;
  startedAt: number | null; // timestamp when current attempt started
  latencyMs: number | null;
}

export default function EnginePanel({ lessonId }: Props) {
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [durationSeconds, setDurationSeconds] = useState(300);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [slots, setSlots] = useState<Map<number, SlotMeta>>(new Map());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const historyRef = useRef<WordHistoryEntry[]>([]);

  // Load lesson
  useEffect(() => {
    setGameState("idle");
    setSessionId(null);
    historyRef.current = [];
    getLesson(lessonId).then((l) => {
      setLesson(l);
      setSlots(buildInitialSlots(l.target_data, "medium"));
      setSentenceIdx(0);
    });
  }, [lessonId]);

  // Sentence grouping
  const sentences = lesson
    ? groupBySentence(lesson.target_data)
    : ([] as TargetWord[][]);

  const currentSentenceWords = sentences[sentenceIdx] ?? [];
  const currentSlots = currentSentenceWords.map(
    (w) => slots.get(w.index) ?? defaultSlot()
  );
  const unguessed = currentSentenceWords.filter(
    (w) => slots.get(w.index)?.state === "hidden"
  );

  // Source sentences
  const sourceSentences = lesson ? splitSourceSentences(lesson.text_source) : [];

  // Timer
  useEffect(() => {
    if (gameState !== "playing") return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          handleFinish();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [gameState]);

  const handleStart = useCallback(
    async (dur: number, diff: "easy" | "medium" | "hard") => {
      if (!lesson) return;
      setDifficulty(diff);
      setDurationSeconds(dur);
      setSecondsLeft(dur);
      const { session_id } = await startGame({
        lesson_id: lessonId,
        duration_seconds: dur,
        difficulty: diff,
      });
      setSessionId(session_id);
      setGameState("playing");
      // rebuild slots with difficulty pre-fill
      setSlots(buildInitialSlots(lesson.target_data, diff, historyRef));
    },
    [lesson, lessonId]
  );

  const handleFirstKey = useCallback(
    (char: string) => {
      if (gameState === "pre-game") {
        handleStart(durationSeconds, difficulty);
      }
    },
    [gameState, durationSeconds, difficulty, handleStart]
  );

  const handleSubmit = useCallback(
    (input: string): boolean => {
      if (!lesson || gameState !== "playing") return false;
      const match = findBestMatch(input, unguessed);
      if (!match) return false;

      const prev = slots.get(match.word.index) ?? defaultSlot();
      const latencyMs = prev.startedAt ? Date.now() - prev.startedAt : null;
      const newState: SlotState = match.exact ? "revealed-correct" : "revealed-ok";

      historyRef.current.push({
        word_index: match.word.index,
        typed_word: input,
        status: match.exact ? "correct" : "ok",
        attempts: (prev.attempts ?? 0) + 1,
        latency_ms: latencyMs ?? 0,
      });

      setSlots((prev) => {
        const next = new Map(prev);
        next.set(match.word.index, {
          state: newState,
          typedWord: input,
          attempts: (prev.get(match.word.index)?.attempts ?? 0) + 1,
          startedAt: null,
          latencyMs,
        });
        return next;
      });

      return true;
    },
    [lesson, gameState, unguessed, slots]
  );

  const handleSkipWord = useCallback(() => {
    if (!lesson || gameState !== "playing" || unguessed.length === 0) return;
    const word = unguessed[0];
    setSlots((prev) => {
      const next = new Map(prev);
      next.set(word.index, { state: "revealed-correct", typedWord: word.word, attempts: 0, startedAt: null, latencyMs: null });
      return next;
    });
  }, [lesson, gameState, unguessed]);

  const handleSkipRow = useCallback(() => {
    if (!lesson || gameState !== "playing") return;
    setSlots((prev) => {
      const next = new Map(prev);
      for (const word of unguessed) {
        next.set(word.index, { state: "revealed-correct", typedWord: word.word, attempts: 0, startedAt: null, latencyMs: null });
      }
      return next;
    });
  }, [lesson, gameState, unguessed]);

  // Advance sentence when all words in current row are revealed
  useEffect(() => {
    if (gameState !== "playing" || currentSentenceWords.length === 0) return;
    const allDone = currentSentenceWords.every(
      (w) => slots.get(w.index)?.state !== "hidden"
    );
    if (allDone) {
      if (sentenceIdx + 1 < sentences.length) {
        setSentenceIdx((i) => i + 1);
      } else {
        handleFinish();
      }
    }
  }, [slots]);

  const handleFinish = useCallback(async () => {
    if (gameState === "finished") return;
    setGameState("finished");
    clearInterval(timerRef.current!);
    if (sessionId) {
      await finishGame({ session_id: sessionId, word_history: historyRef.current });
    }
  }, [gameState, sessionId]);

  if (!lesson) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm">
        Loading lesson…
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 px-16 py-12 max-w-3xl mx-auto w-full">
      {/* Timer */}
      {gameState === "playing" && (
        <div className="w-full">
          <Timer secondsLeft={secondsLeft} totalSeconds={durationSeconds} />
        </div>
      )}

      {/* Source row */}
      <p className="text-zinc-300 text-lg leading-relaxed text-center">
        {sourceSentences[sentenceIdx] ?? ""}
      </p>

      {/* Target row */}
      <div className="flex flex-wrap gap-x-3 gap-y-4 justify-center">
        {currentSentenceWords.map((word, i) => (
          <WordSlot
            key={word.index}
            word={word}
            state={currentSlots[i]?.state ?? "hidden"}
            typedWord={currentSlots[i]?.typedWord ?? null}
          />
        ))}
      </div>

      {/* Input / pre-game / finished */}
      {gameState === "finished" ? (
        <p className="text-zinc-500 text-sm">session saved.</p>
      ) : gameState === "idle" || gameState === "pre-game" ? (
        <div className="flex flex-col items-center gap-6">
          <PreGame onStart={handleStart} />
          <InputBox
            onSubmit={() => false}
            onSkipWord={() => {}}
            onSkipRow={() => {}}
            onFirstKey={handleFirstKey}
            started={false}
            disabled={false}
          />
        </div>
      ) : (
        <InputBox
          onSubmit={handleSubmit}
          onSkipWord={handleSkipWord}
          onSkipRow={handleSkipRow}
          onFirstKey={() => {}}
          started={true}
          disabled={false}
        />
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function defaultSlot(): SlotMeta {
  return { state: "hidden", typedWord: null, attempts: 0, startedAt: Date.now(), latencyMs: null };
}

function buildInitialSlots(
  words: TargetWord[],
  difficulty: "easy" | "medium" | "hard",
  historyRef?: React.MutableRefObject<WordHistoryEntry[]>
): Map<number, SlotMeta> {
  const map = new Map<number, SlotMeta>();
  const prefillCount = difficulty === "easy" ? Math.floor(words.length * 0.33) : 0;

  const indices = [...Array(words.length).keys()];
  const prefilled = new Set(
    [...indices].sort(() => Math.random() - 0.5).slice(0, prefillCount)
  );

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (prefilled.has(i)) {
      map.set(word.index, { state: "revealed-correct", typedWord: word.word, attempts: 0, startedAt: null, latencyMs: null });
    } else {
      map.set(word.index, defaultSlot());
    }
  }
  return map;
}

function groupBySentence(words: TargetWord[]): TargetWord[][] {
  const map = new Map<number, TargetWord[]>();
  for (const w of words) {
    if (!map.has(w.sentence_index)) map.set(w.sentence_index, []);
    map.get(w.sentence_index)!.push(w);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, ws]) => ws.sort((a, b) => a.index - b.index));
}

function splitSourceSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
