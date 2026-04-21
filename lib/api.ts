import type { SidebarData, LessonDetail, TargetWord } from "@/types/lesson";
import type { GameStartRequest, GameFinishRequest } from "@/types/game";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export const getSidebar = (): Promise<SidebarData> =>
  apiFetch("/sidebar");

export const getLesson = (id: string): Promise<LessonDetail> =>
  apiFetch(`/lessons/${id}`);

export const startGame = (body: GameStartRequest): Promise<{ session_id: string }> =>
  apiFetch("/games/start", { method: "POST", body: JSON.stringify(body) });

export const finishGame = (body: GameFinishRequest): Promise<{ ok: boolean }> =>
  apiFetch("/games/finish", { method: "POST", body: JSON.stringify(body) });

export interface GenerateResponse {
  title: string;
  text_source: string;
  target_data: TargetWord[];
}

export const generateLesson = (germanText: string, prompt: string): Promise<GenerateResponse> =>
  apiFetch("/lessons/generate", {
    method: "POST",
    body: JSON.stringify({ german_text: germanText, prompt }),
  });

export const createLesson = (body: {
  title: string;
  text_source: string;
  target_data: TargetWord[];
  folder_id?: string;
}): Promise<LessonDetail> =>
  apiFetch("/lessons", { method: "POST", body: JSON.stringify(body) });
