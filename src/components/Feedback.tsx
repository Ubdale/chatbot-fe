"use client";

import { useState } from "react";

import { api } from "@/lib/api";

/** 👍 teaches AskData this answer was right; 👎 makes sure it's never reused. */
export function Feedback({ messageId, initial }: { messageId: string; initial: number | null }) {
  const [rating, setRating] = useState<number | null>(initial);
  const [note, setNote] = useState<string | null>(null);

  async function rate(value: 1 | -1) {
    const next = rating === value ? 0 : value;
    setRating(next || null);
    try {
      const res = await api<{ rating: number | null; learned: boolean }>(
        `/chat/messages/${messageId}/feedback`,
        { json: { rating: next } },
      );
      setNote(
        res.rating === 1
          ? res.learned
            ? "Thanks! I'll learn from this for similar questions."
            : "Thanks for the feedback!"
          : res.rating === -1
            ? "Got it. I won't reuse this answer. Try rephrasing, or teach me a word (e.g. “sales means revenue”)."
            : null,
      );
    } catch {
      setRating(rating);
      setNote("Couldn't save that. Try again.");
    }
  }

  const button = (value: 1 | -1, label: string, icon: string) => (
    <button
      onClick={() => rate(value)}
      aria-label={label}
      aria-pressed={rating === value}
      className={`rounded-lg px-2 py-1 text-sm transition hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
        rating === value ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300" : "text-zinc-400"
      }`}
    >
      {icon}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-1 pt-1">
      {button(1, "Helpful", "👍")}
      {button(-1, "Not right", "👎")}
      {note && <span className="animate-fade-up ml-1 text-xs text-zinc-500">{note}</span>}
    </div>
  );
}
