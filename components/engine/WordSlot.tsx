"use client";

import type { SlotState } from "@/types/game";
import type { TargetWord } from "@/types/lesson";

interface Props {
  word: TargetWord;
  state: SlotState;
  typedWord: string | null;
}

export default function WordSlot({ word, state, typedWord }: Props) {
  if (state === "hidden") {
    return (
      <span className="inline-block px-1 min-w-[2rem] h-6 rounded bg-zinc-800 border border-zinc-700" />
    );
  }

  const isExact = state === "revealed-correct";
  const textColor = isExact ? "text-emerald-400" : "text-yellow-400";

  return (
    <span className={`text-sm leading-5 ${textColor}`}>
      {typedWord ?? word.word}
    </span>
  );
}
