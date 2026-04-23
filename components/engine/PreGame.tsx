"use client";

import { useState } from "react";

interface Props {
  onStart: (durationSeconds: number, difficulty: "easy" | "medium" | "hard") => void;
}

const DURATIONS = [1, 2, 3, 5, 10] as const;
const DIFFICULTIES = ["easy", "medium", "hard"] as const;
const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "easy",
  medium: "medium",
  hard: "hard",
};

export default function PreGame({ onStart }: Props) {
  const [duration, setDuration] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("hard");

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div>
        <h2 className="text-zinc-500 text-sm uppercase tracking-widest mb-3">duration</h2>
        <div className="flex gap-2">
          {DURATIONS.map((min) => (
            <button
              key={min}
              onClick={() => setDuration(min)}
              className={`px-4 py-2 rounded text-sm tabular-nums transition-colors ${
                duration === min
                  ? "bg-zinc-600 text-white"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
              }`}
            >
              {min}m
            </button>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-zinc-500 text-sm uppercase tracking-widest mb-3">difficulty</h2>
        <div className="flex gap-2">
          {DIFFICULTIES.map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficulty(diff)}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                difficulty === diff
                  ? "bg-zinc-600 text-white"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
              }`}
            >
              {DIFFICULTY_LABELS[diff]}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={() => onStart(duration * 60, difficulty)}
        className="px-6 py-2 rounded bg-zinc-700 text-white hover:bg-zinc-600 transition-colors text-sm"
      >
        start
      </button>
      <p className="text-xs text-zinc-600">or press any letter to start</p>
    </div>
  );
}
