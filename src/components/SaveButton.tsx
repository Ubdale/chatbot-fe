"use client";

import { useState } from "react";

import { api } from "@/lib/api";

/** Star an answer so it can be re-asked later (on the latest data). */
export function SaveButton({ messageId, onSaved }: { messageId: string; onSaved?: () => void }) {
  const [state, setState] = useState<"idle" | "busy" | "saved">("idle");

  async function save() {
    if (state === "saved") return;
    setState("busy");
    try {
      await api("/chat/saved", { json: { message_id: messageId } });
      setState("saved");
      onSaved?.();
    } catch {
      setState("idle");
    }
  }

  return (
    <button
      onClick={save}
      disabled={state === "busy"}
      title="Save this question to re-ask later"
      className="ml-2 mt-2 rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-600 transition hover:border-amber-300 hover:text-amber-600 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300"
    >
      {state === "saved" ? "★ Saved" : "☆ Save"}
    </button>
  );
}
