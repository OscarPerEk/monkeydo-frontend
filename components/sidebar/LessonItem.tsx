"use client";

import type { LessonSummary } from "@/types/lesson";

interface Props {
  lesson: LessonSummary;
  activeId: string | null;
  onSelect: (id: string) => void;
}

export default function LessonItem({ lesson, activeId, onSelect }: Props) {
  const isActive = lesson.id === activeId;

  return (
    <button
      onClick={() => onSelect(lesson.id)}
      className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
        isActive
          ? "bg-white/10 text-white"
          : "text-zinc-400 hover:text-white hover:bg-white/5"
      }`}
    >
      {lesson.title}
    </button>
  );
}
