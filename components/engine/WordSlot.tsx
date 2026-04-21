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

  if (state === "revealed-correct") {
    return (
      <span className="text-sm leading-5 text-emerald-400">
        {typedWord ?? word.word}
      </span>
    );
  }

  // Partial match: show correct prefix in yellow, remaining chars in red
  const target = word.word;
  const typed = typedWord ?? "";
  const tLower = typed.toLowerCase();
  const wLower = target.toLowerCase();

  // Find shared prefix length
  let prefixLen = 0;
  while (prefixLen < tLower.length && prefixLen < wLower.length && tLower[prefixLen] === wLower[prefixLen]) {
    prefixLen++;
  }

  const correctPart = target.slice(0, prefixLen);
  const missingPart = target.slice(prefixLen);

  return (
    <span className="text-sm leading-5">
      <span className="text-yellow-400">{correctPart}</span>
      <span className="text-red-400">{missingPart}</span>
    </span>
  );
}
