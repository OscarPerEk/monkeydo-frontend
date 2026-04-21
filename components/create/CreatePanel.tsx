"use client";

import { useState } from "react";
import { generateLesson, createLesson, type GenerateResponse } from "@/lib/api";

interface Props {
  onSaved: (lessonId: string) => void;
}

export default function CreatePanel({ onSaved }: Props) {
  const [germanText, setGermanText] = useState("");
  const [prompt, setPrompt] = useState("");
  const [preview, setPreview] = useState<GenerateResponse | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!germanText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      console.log("[CreatePanel] Generating lesson...", { textLen: germanText.length, promptLen: prompt.length });
      const result = await generateLesson(germanText, prompt);
      console.log("[CreatePanel] Generation OK:", { title: result.title, words: result.target_data.length });
      setPreview(result);
      setTitle(result.title);
    } catch (e) {
      console.error("[CreatePanel] Generation failed:", e);
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      console.log("[CreatePanel] Saving lesson:", { title });
      const lesson = await createLesson({
        title,
        text_source: preview.text_source,
        target_data: preview.target_data,
      });
      console.log("[CreatePanel] Saved:", lesson.id);
      onSaved(lesson.id);
    } catch (e) {
      console.error("[CreatePanel] Save failed:", e);
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 px-16 py-12 max-w-3xl mx-auto w-full">
      <h2 className="text-zinc-300 text-lg font-medium">Create Lesson</h2>

      {/* German text input */}
      <div className="flex flex-col gap-2">
        <label className="text-zinc-500 text-sm">German Text</label>
        <textarea
          value={germanText}
          onChange={(e) => setGermanText(e.target.value)}
          rows={6}
          className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white text-sm resize-y focus:border-zinc-500 outline-none"
        />
      </div>

      {/* Prompt input */}
      <div className="flex flex-col gap-2">
        <label className="text-zinc-500 text-sm">Prompt (optional)</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white text-sm resize-y focus:border-zinc-500 outline-none"
        />
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading || !germanText.trim()}
        className="self-start px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-30 text-white text-sm rounded-lg transition-colors"
      >
        {loading ? "Generating..." : "Generate"}
      </button>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Preview */}
      {preview && (
        <div className="flex flex-col gap-4 mt-4 border-t border-zinc-800 pt-6">
          {/* Editable title */}
          <div className="flex flex-col gap-2">
            <label className="text-zinc-500 text-sm">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-zinc-500 outline-none"
            />
          </div>

          {/* English translation */}
          <div className="flex flex-col gap-2">
            <label className="text-zinc-500 text-sm">English (source)</label>
            <p className="text-zinc-300 text-sm leading-relaxed bg-zinc-900 rounded-lg p-3 border border-zinc-800">
              {preview.text_source}
            </p>
          </div>

          {/* German words */}
          <div className="flex flex-col gap-2">
            <label className="text-zinc-500 text-sm">German (target words)</label>
            <div className="flex flex-wrap gap-2 bg-zinc-900 rounded-lg p-3 border border-zinc-800">
              {preview.target_data.map((w) => (
                <span
                  key={w.index}
                  className="text-emerald-400 text-sm bg-zinc-800 px-2 py-0.5 rounded"
                >
                  {w.word}
                </span>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white text-sm rounded-lg transition-colors"
            >
              {saving ? "Saving..." : "Save Lesson"}
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-30 text-white text-sm rounded-lg transition-colors"
            >
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
