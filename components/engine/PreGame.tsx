"use client";

interface Props {
  onStart: (durationSeconds: number, difficulty: "easy" | "medium" | "hard") => void;
}

const DURATIONS = [1, 2, 3, 5, 10] as const;
const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export default function PreGame({ onStart }: Props) {
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div>
        <h2 className="text-zinc-500 text-sm uppercase tracking-widest mb-3">duration</h2>
        <div className="flex gap-2">
          {DURATIONS.map((min) => (
            <button
              key={min}
              onClick={() => onStart(min * 60, "medium")}
              className="px-4 py-2 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors text-sm tabular-nums"
            >
              {min}m
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-zinc-600">press any letter to start with defaults (5m · medium)</p>
    </div>
  );
}
