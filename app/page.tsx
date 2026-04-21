"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import EnginePanel from "@/components/engine/EnginePanel";
import CreatePanel from "@/components/create/CreatePanel";

export default function Home() {
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [mode, setMode] = useState<"play" | "create">("play");
  const [sidebarKey, setSidebarKey] = useState(0);

  const handleCreateClick = () => {
    setMode("create");
    setActiveLessonId(null);
  };

  const handleLessonSelect = (id: string) => {
    setMode("play");
    setActiveLessonId(id);
  };

  const handleSaved = (lessonId: string) => {
    setSidebarKey((k) => k + 1);
    setMode("play");
    setActiveLessonId(lessonId);
  };

  return (
    <div className="h-full flex overflow-hidden">
      <Sidebar
        key={sidebarKey}
        activeId={activeLessonId}
        onSelect={handleLessonSelect}
        onCreateClick={handleCreateClick}
      />
      <main className="flex-1 flex items-center justify-center overflow-y-auto">
        {mode === "create" ? (
          <CreatePanel onSaved={handleSaved} />
        ) : activeLessonId ? (
          <EnginePanel key={activeLessonId} lessonId={activeLessonId} />
        ) : (
          <p className="text-zinc-600 text-sm">select a lesson to begin</p>
        )}
      </main>
    </div>
  );
}
