"use client";

import EnginePanel from "@/components/engine/EnginePanel";
import { use } from "react";

export default function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = use(params);
  return <EnginePanel key={lessonId} lessonId={lessonId} />;
}
