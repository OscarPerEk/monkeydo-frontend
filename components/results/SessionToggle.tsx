"use client";

interface Props {
  active: "session" | "overall";
  onToggle: (view: "session" | "overall") => void;
  hasSession: boolean;
}

export default function SessionToggle({ active, onToggle, hasSession }: Props) {
  return (
    <div className="flex gap-1 bg-zinc-900 rounded-lg p-1 text-sm">
      {hasSession && (
        <button
          onClick={() => onToggle("session")}
          className={`px-3 py-1 rounded-md transition-colors ${
            active === "session"
              ? "bg-zinc-700 text-white"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Diese Sitzung
        </button>
      )}
      <button
        onClick={() => onToggle("overall")}
        className={`px-3 py-1 rounded-md transition-colors ${
          active === "overall"
            ? "bg-zinc-700 text-white"
            : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        Insgesamt
      </button>
    </div>
  );
}
