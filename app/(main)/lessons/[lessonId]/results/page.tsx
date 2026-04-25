"use client";

import { useSearchParams } from "next/navigation";
import { use } from "react";
import ResultsPanel from "@/components/results/ResultsPanel";

export default function ResultsPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = use(params);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");

  return <ResultsPanel lessonId={lessonId} sessionId={sessionId} />;
}
