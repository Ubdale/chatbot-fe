"use client";

import { useState } from "react";

import { api } from "@/lib/api";

/** Create a public read-only link to this answer and copy it to the clipboard. */
export function ShareButton({ messageId }: { messageId: string }) {
  const [state, setState] = useState<"idle" | "busy" | "copied">("idle");

  async function share() {
    setState("busy");
    try {
      const { token } = await api<{ token: string }>(`/chat/messages/${messageId}/share`, {
        method: "POST",
      });
      const url = `${window.location.origin}/share/${token}`;
      try {
        await navigator.clipboard.writeText(url);
        setState("copied");
      } catch {
        window.prompt("Copy this link:", url);
        setState("idle");
      }
    } catch {
      setState("idle");
    }
  }

  return (
    <button
      onClick={share}
      disabled={state === "busy"}
      title="Create a public read-only link to this answer"
      className="ml-2 mt-2 rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-600 transition hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300"
    >
      {state === "copied" ? "✓ Link copied" : state === "busy" ? "…" : "🔗 Share"}
    </button>
  );
}
