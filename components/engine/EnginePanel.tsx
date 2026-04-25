"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getLesson, startGame, finishGame } from "@/lib/api";
import { findBestMatch, hasViableMatch } from "@/lib/matching";
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
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("hard");
  const [durationSeconds, setDurationSeconds] = useState(300);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [slots, setSlots] = useState<Map<number, SlotMeta>>(new Map());
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const historyRef = useRef<WordHistoryEntry[]>([]);

  // Load lesson
  useEffect(() => {
    setGameState("idle");
    setSessionId(null);
    historyRef.current = [];
    getLesson(lessonId).then((l) => {
      setLesson(l);
      setSlots(buildInitialSlots(l.target_data));
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
      setSlots(buildInitialSlots(lesson.target_data));
    },
    [lesson, lessonId]
  );

  const handleFirstKey = useCallback(
    (char: string) => {
      if (gameState === "idle" || gameState === "pre-game") {
        handleStart(durationSeconds, difficulty);
      }
    },
    [gameState, durationSeconds, difficulty, handleStart]
  );

  const handleSubmit = useCallback(
    (input: string): boolean => {
      if (!lesson || gameState !== "playing") return false;
      const match = findBestMatch(input, unguessed);
      if (!match) {
        // Wrong answer — increment hints
        const nextWrong = wrongAttempts + 1;
        setWrongAttempts(nextWrong);

        // Check if hint now reveals the full word → auto-reveal as failed
        const targetWord = unguessed[0];
        if (targetWord) {
          const hintLen = getHintLength(targetWord.word, difficulty, nextWrong);
          if (hintLen >= targetWord.word.length) {
            setSlots((prev) => {
              const next = new Map(prev);
              next.set(targetWord.index, {
                state: "revealed-failed",
                typedWord: null,
                attempts: nextWrong,
                startedAt: null,
                latencyMs: null,
              });
              return next;
            });
            historyRef.current.push({
              word_index: targetWord.index,
              typed_word: input,
              status: "wrong",
              attempts: nextWrong,
              latency_ms: 0,
            });
            setWrongAttempts(0);
          }
        }
        return false;
      }

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
          typedWord: match.word.word,
          attempts: (prev.get(match.word.index)?.attempts ?? 0) + 1,
          startedAt: null,
          latencyMs,
        });
        return next;
      });

      setWrongAttempts(0);
      return true;
    },
    [lesson, gameState, unguessed, slots, wrongAttempts, difficulty]
  );

  const handleSkipWord = useCallback(() => {
    if (!lesson || gameState !== "playing" || unguessed.length === 0) return;
    const word = unguessed[0];
    setSlots((prev) => {
      const next = new Map(prev);
      next.set(word.index, { state: "revealed-correct", typedWord: word.word, attempts: 0, startedAt: null, latencyMs: null });
      return next;
    });
    setWrongAttempts(0);
  }, [lesson, gameState, unguessed]);

  const handleSkipRow = useCallback(() => {
    if (!lesson || gameState !== "playing") return;
    setSlots((prev) => {
      const next = new Map(prev);
      for (const word of unguessed) {
        next.set(word.index, { state: "revealed-failed", typedWord: null, attempts: 0, startedAt: null, latencyMs: null });
      }
      return next;
    });
    setWrongAttempts(0);
  }, [lesson, gameState, unguessed]);

  const handleRequestHint = useCallback(() => {
    if (!lesson || gameState !== "playing" || unguessed.length === 0) return;
    const nextWrong = wrongAttempts + 1;
    setWrongAttempts(nextWrong);

    const targetWord = unguessed[0];
    const hintLen = getHintLength(targetWord.word, difficulty, nextWrong);
    if (hintLen >= targetWord.word.length) {
      setSlots((prev) => {
        const next = new Map(prev);
        next.set(targetWord.index, {
          state: "revealed-failed",
          typedWord: null,
          attempts: nextWrong,
          startedAt: null,
          latencyMs: null,
        });
        return next;
      });
      historyRef.current.push({
        word_index: targetWord.index,
        typed_word: "",
        status: "wrong",
        attempts: nextWrong,
        latency_ms: 0,
      });
      setWrongAttempts(0);
    }
  }, [lesson, gameState, unguessed, wrongAttempts, difficulty]);

  const checkPartial = useCallback(
    (input: string): boolean => {
      if (gameState !== "playing") return true;
      return hasViableMatch(input, unguessed);
    },
    [gameState, unguessed]
  );

  const handleFinish = useCallback(async () => {
    if (gameState === "finished") return;
    setGameState("finished");
    clearInterval(timerRef.current!);
    if (sessionId) {
      await finishGame({ session_id: sessionId, word_history: historyRef.current });
    }
  }, [gameState, sessionId]);

  // Advance sentence when all words in current row are revealed (3s delay, skippable)
  const [sentencePause, setSentencePause] = useState(false);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advanceToNextSentence = useCallback(() => {
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    setSentencePause(false);
    // restart timer
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
    if (sentenceIdx + 1 < sentences.length) {
      setSentenceIdx((i) => i + 1);
    } else {
      handleFinish();
    }
  }, [sentenceIdx, sentences.length, handleFinish]);

  useEffect(() => {
    if (gameState !== "playing" || currentSentenceWords.length === 0) return;
    const allDone = currentSentenceWords.every(
      (w) => slots.get(w.index)?.state !== "hidden"
    );
    if (allDone) {
      setSentencePause(true);
      clearInterval(timerRef.current!);
      pauseTimeoutRef.current = setTimeout(advanceToNextSentence, 3000);
      return () => {
        if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
      };
    }
  }, [slots]);

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
            onRequestHint={() => {}}
            onSkipPause={() => {}}
            onFirstKey={handleFirstKey}
            checkPartial={() => true}
            started={false}
            disabled={false}
            hint={null}
          />
        </div>
      ) : (
        <InputBox
          onSubmit={handleSubmit}
          onSkipWord={handleSkipWord}
          onSkipRow={handleSkipRow}
          onRequestHint={handleRequestHint}
          onSkipPause={advanceToNextSentence}
          onFirstKey={() => {}}
          checkPartial={checkPartial}
          started={true}
          disabled={sentencePause}
          hint={getHint(unguessed[0], difficulty, wrongAttempts)}
        />
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function defaultSlot(): SlotMeta {
  return { state: "hidden", typedWord: null, attempts: 0, startedAt: Date.now(), latencyMs: null };
}

function buildInitialSlots(words: TargetWord[]): Map<number, SlotMeta> {
  const map = new Map<number, SlotMeta>();
  for (const word of words) {
    if (word.excluded) {
      map.set(word.index, { state: "revealed-excluded", typedWord: word.word, attempts: 0, startedAt: null, latencyMs: null });
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
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

function getHintLength(
  word: string,
  difficulty: "easy" | "medium" | "hard",
  wrongCount: number
): number {
  if (wrongCount === 0) return 0;
  let base: number;
  if (difficulty === "easy") base = word.length;
  else if (difficulty === "medium") base = Math.ceil(word.length / 2);
  else base = 1;
  return Math.min(base + (wrongCount - 1), word.length);
}

function getHint(
  word: TargetWord | undefined,
  difficulty: "easy" | "medium" | "hard",
  wrongCount: number
): string | null {
  if (!word || wrongCount === 0) return null;
  const len = getHintLength(word.word, difficulty, wrongCount);
  if (len >= word.word.length) return word.word;
  return word.word.slice(0, len) + "…";
}
