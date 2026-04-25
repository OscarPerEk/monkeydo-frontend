"use client";

import { useState } from "react";
import type { FolderOut } from "@/types/lesson";
import LessonItem from "./LessonItem";

interface Props {
  folder: FolderOut;
  activeId: string | null;
}

export default function FolderItem({ folder, activeId }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <span className={`transition-transform ${open ? "rotate-90" : ""}`}>›</span>
        {folder.name}
      </button>
      {open && (
        <div className="pl-3">
          {folder.lessons.map((lesson) => (
            <LessonItem
              key={lesson.id}
              lesson={lesson}
              activeId={activeId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
