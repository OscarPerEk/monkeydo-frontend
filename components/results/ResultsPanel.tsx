"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLesson, getLessonSessions, getSessionHistory, updateLessonRange } from "@/lib/api";
import { computeSessionStats, computeOverallMastery } from "@/lib/scoring";
import type { SessionStats, MasteryLevel } from "@/lib/scoring";
import type { LessonDetail } from "@/types/lesson";
import type { GameSessionSummary, WordHistoryOut, WordStatus } from "@/types/game";
import StatsBar from "./StatsBar";
import SessionToggle from "./SessionToggle";
import TextDisplay from "./TextDisplay";
import type { SelectedRange } from "./TextDisplay";

interface Props {
  lessonId: string;
  sessionId: string | null;
}

export default function ResultsPanel({ lessonId, sessionId }: Props) {
  const router = useRouter();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [view, setView] = useState<"session" | "overall">(
    sessionId ? "session" : "overall",
  );

  // Session view state
  const [sessionHistory, setSessionHistory] = useState<WordHistoryOut[] | null>(null);
  const [sessionMeta, setSessionMeta] = useState<GameSessionSummary | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [wordStatusMap, setWordStatusMap] = useState<Map<number, WordStatus>>(new Map());

  // Overall view state
  const [allHistories, setAllHistories] = useState<WordHistoryOut[][] | null>(null);
  const [masteryMap, setMasteryMap] = useState<Map<number, MasteryLevel>>(new Map());
  const [overallStats, setOverallStats] = useState<SessionStats | null>(null);

  // Range selection state
  const [pendingRange, setPendingRange] = useState<SelectedRange | null>(null);
  const [saving, setSaving] = useState(false);

  // Load lesson
  useEffect(() => {
    getLesson(lessonId).then(setLesson);
  }, [lessonId]);

  // Load session data
  useEffect(() => {
    if (!sessionId || !lesson) return;

    getLessonSessions(lessonId).then((sessions) => {
      const meta = sessions.find((s) => s.id === sessionId);
      if (meta) setSessionMeta(meta);
    });

    getSessionHistory(sessionId).then((history) => {
      setSessionHistory(history);

      const statusMap = new Map<number, WordStatus>();
      for (const entry of history) {
        statusMap.set(entry.word_index, entry.status);
      }
      setWordStatusMap(statusMap);

      const difficulty = (sessionMeta?.difficulty ?? "hard") as "easy" | "medium" | "hard";
      const duration = sessionMeta?.duration_seconds ?? 300;
      setSessionStats(computeSessionStats(history, lesson.target_data, difficulty, duration));
    });
  }, [sessionId, lesson, sessionMeta?.difficulty, sessionMeta?.duration_seconds, lessonId]);

  // Load overall data when toggled
  const loadOverall = useCallback(async () => {
    if (!lesson || allHistories) return;
    const sessions = await getLessonSessions(lessonId);
    const recent = sessions.slice(0, 10);
    const histories = await Promise.all(
      recent.map((s) => getSessionHistory(s.id)),
    );
    setAllHistories(histories);
    setMasteryMap(computeOverallMastery(histories));

    if (recent.length > 0) {
      const allEntries = histories.flat();
      const diff = (recent[0].difficulty ?? "hard") as "easy" | "medium" | "hard";
      const dur = recent[0].duration_seconds ?? 300;
      setOverallStats(computeSessionStats(allEntries, lesson.target_data, diff, dur));
    }
  }, [lesson, lessonId, allHistories]);

  useEffect(() => {
    if (view === "overall") loadOverall();
  }, [view, loadOverall]);

  const handleSaveRange = async () => {
    if (!pendingRange) return;
    setSaving(true);
    await updateLessonRange(lessonId, pendingRange.startWordIndex, pendingRange.endWordIndex);
    router.push(`/lessons/${lessonId}`);
  };

  const handleClearRange = async () => {
    setSaving(true);
    await updateLessonRange(lessonId, null, null);
    const updated = await getLesson(lessonId);
    setLesson(updated);
    setPendingRange(null);
    setSaving(false);
  };

  if (!lesson) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm">
        Loading…
      </div>
    );
  }

  const currentStats = view === "session" ? sessionStats : overallStats;
  const hasSavedRange = lesson.range_start_index != null && lesson.range_end_index != null;

  return (
    <div className="flex-1 flex flex-col items-center gap-6 px-16 py-12 max-w-3xl mx-auto w-full overflow-y-auto">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <h2 className="text-zinc-400 text-sm">{lesson.title}</h2>
        <button
          onClick={() => router.push(`/lessons/${lessonId}`)}
          className="text-zinc-500 hover:text-white text-sm transition-colors"
        >
          Spielen
        </button>
      </div>

      {/* Toggle */}
      <SessionToggle
        active={view}
        onToggle={setView}
        hasSession={!!sessionId}
      />

      {/* Stats */}
      {currentStats && <StatsBar stats={currentStats} />}

      {/* Text display */}
      <TextDisplay
        targetData={lesson.target_data}
        wordStatusMap={view === "session" ? wordStatusMap : undefined}
        masteryMap={view === "overall" ? masteryMap : undefined}
        mode={view}
        savedRange={
          hasSavedRange
            ? { start: lesson.range_start_index!, end: lesson.range_end_index! }
            : null
        }
        onSelectionChange={setPendingRange}
      />

      {/* Range actions */}
      <div className="flex gap-3">
        {pendingRange && (
          <button
            onClick={handleSaveRange}
            disabled={saving}
            className="px-4 py-2 rounded bg-yellow-500 text-black text-sm font-medium hover:bg-yellow-400 transition-colors disabled:opacity-50"
          >
            {saving ? "Speichern…" : "Range speichern & spielen"}
          </button>
        )}
        {hasSavedRange && !pendingRange && (
          <button
            onClick={handleClearRange}
            disabled={saving}
            className="px-4 py-2 rounded bg-zinc-800 text-zinc-400 text-sm hover:text-white border border-zinc-700 hover:border-zinc-500 transition-colors disabled:opacity-50"
          >
            {saving ? "Löschen…" : "Range löschen"}
          </button>
        )}
      </div>
    </div>
  );
}
