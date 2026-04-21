"use client";

import { useEffect, useState } from "react";
import { getSidebar } from "@/lib/api";
import type { SidebarData } from "@/types/lesson";
import FolderItem from "./FolderItem";
import LessonItem from "./LessonItem";

interface Props {
  activeId: string | null;
  onSelect: (id: string) => void;
}

export default function Sidebar({ activeId, onSelect }: Props) {
  const [data, setData] = useState<SidebarData | null>(null);

  useEffect(() => {
    getSidebar().then(setData).catch(console.error);
  }, []);

  return (
    <aside className="w-56 min-w-56 h-full flex flex-col bg-zinc-900 border-r border-zinc-800 overflow-y-auto">
      <div className="px-3 py-4 text-lg font-bold tracking-tight text-white">
        monkeydo
      </div>
      <nav className="flex-1 flex flex-col gap-1 px-1 pb-4">
        {data ? (
          <>
            {data.folders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                activeId={activeId}
                onSelect={onSelect}
              />
            ))}
            {data.root_lessons.length > 0 && (
              <div className="mt-2">
                {data.root_lessons.map((lesson) => (
                  <LessonItem
                    key={lesson.id}
                    lesson={lesson}
                    activeId={activeId}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="px-3 text-xs text-zinc-600">Loading...</p>
        )}
      </nav>
    </aside>
  );
}
