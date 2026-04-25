"use client";

import type { SessionStats } from "@/lib/scoring";

interface Props {
  stats: SessionStats;
}

export default function StatsBar({ stats }: Props) {
  return (
    <div className="flex gap-8 justify-center text-sm">
      <div className="flex flex-col items-center">
        <span className="text-zinc-500">Score</span>
        <span className="text-white text-lg font-semibold">{stats.score}%</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-zinc-500">WPM</span>
        <span className="text-white text-lg font-semibold">{stats.wpm}</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-zinc-500">Progress</span>
        <span className="text-white text-lg font-semibold">{stats.progress}%</span>
      </div>
    </div>
  );
}
