export type WordStatus = "correct" | "ok" | "wrong" | "skipped";

export type SlotState = "hidden" | "revealed-correct" | "revealed-ok" | "revealed-failed" | "revealed-excluded";

export interface WordHistoryEntry {
  word_index: number;
  typed_word: string;
  status: WordStatus;
  attempts: number;
  latency_ms: number;
}

export interface GameStartRequest {
  lesson_id: string;
  duration_seconds: number;
  difficulty: "easy" | "medium" | "hard";
}

export interface GameFinishRequest {
  session_id: string;
  word_history: WordHistoryEntry[];
}

export type GameState = "idle" | "pre-game" | "playing" | "finished";

export interface GameSessionSummary {
  id: string;
  difficulty: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface WordHistoryOut {
  word_index: number;
  typed_word: string;
  status: WordStatus;
  attempts: number;
  latency_ms: number;
}
