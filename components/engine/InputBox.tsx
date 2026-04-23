"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  onSubmit: (value: string) => boolean; // returns true if accepted
  onSkipWord: () => void;
  onSkipRow: () => void;
  onRequestHint: () => void;
  onSkipPause: () => void; // skip the 3s pause between sentences
  onFirstKey: (char: string) => void;
  started: boolean;
  disabled: boolean; // true during sentence pause
  hint: string | null;
}

export default function InputBox({
  onSubmit,
  onSkipWord,
  onSkipRow,
  onRequestHint,
  onSkipPause,
  onFirstKey,
  started,
  disabled,
  hint,
}: Props) {
  const [value, setValue] = useState("");
  const [flash, setFlash] = useState<"red" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [disabled]);

  const triggerRed = () => {
    setFlash("red");
    setTimeout(() => setFlash(null), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Any key during pause → skip to next sentence
    if (disabled) {
      e.preventDefault();
      onSkipPause();
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        onSkipRow();
      } else {
        onSkipWord();
      }
      setValue("");
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed) {
        // Empty Enter → skip entire sentence (red)
        if (started) onSkipRow();
        return;
      }
      const accepted = onSubmit(trimmed);
      if (accepted) {
        setValue("");
      } else {
        triggerRed();
        setValue("");
      }
      return;
    }

    if (e.key === " ") {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed) {
        // Empty Space → request next hint
        if (started) onRequestHint();
        return;
      }
      const accepted = onSubmit(trimmed);
      if (accepted) {
        setValue("");
      } else {
        triggerRed();
        setValue("");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    if (!started && newVal.trim()) {
      onFirstKey(newVal.trim());
    }
    setValue(newVal);
  };

  const borderColor = flash === "red" ? "border-red-500" : "border-zinc-700 focus:border-zinc-500";

  return (
    <div className="flex flex-col items-center gap-2">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={false}
        placeholder=""
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className={`bg-transparent border-b-2 outline-none text-white text-base w-48 pb-0.5 text-center transition-colors ${borderColor} placeholder-zinc-700 ${disabled ? "opacity-30" : ""}`}
      />
      {hint && (
        <span className="text-zinc-500 text-sm">{hint}</span>
      )}
    </div>
  );
}
