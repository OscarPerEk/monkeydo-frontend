"use client";

interface Props {
  secondsLeft: number;
  totalSeconds: number;
}

export default function Timer({ secondsLeft, totalSeconds }: Props) {
  const pct = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  const barColor =
    pct > 0.5 ? "bg-emerald-500" : pct > 0.2 ? "bg-yellow-400" : "bg-red-500";

  return (
    <div className="w-full flex flex-col gap-1">
      <div className="h-0.5 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${barColor}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <div className="text-right text-xs text-zinc-500 tabular-nums">
        {mins}:{secs.toString().padStart(2, "0")}
      </div>
    </div>
  );
}
