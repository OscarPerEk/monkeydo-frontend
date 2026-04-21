"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import EnginePanel from "@/components/engine/EnginePanel";

export default function Home() {
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  return (
    <div className="h-full flex overflow-hidden">
      <Sidebar activeId={activeLessonId} onSelect={setActiveLessonId} />
      <main className="flex-1 flex items-center justify-center overflow-y-auto">
        {activeLessonId ? (
          <EnginePanel key={activeLessonId} lessonId={activeLessonId} />
        ) : (
          <p className="text-zinc-600 text-sm">select a lesson to begin</p>
        )}
      </main>
    </div>
  );
}
