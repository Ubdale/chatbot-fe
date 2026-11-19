"use client";

import Link from "next/link";
import { useState } from "react";

import { api, ApiError } from "@/lib/api";
import type { Digest } from "@/lib/types";

/** Re-run this answer's question every week (Monday 09:00; change it on Reports). */
export function ScheduleButton({ messageId }: { messageId: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [text, setText] = useState("");

  async function schedule() {
    setState("busy");
    try {
      const d = await api<Digest>("/digests", { json: { message_id: messageId } });
      setText(`Scheduled ${d.schedule}.`);
      setState("done");
    } catch (e) {
      setText(e instanceof ApiError ? e.message : "Couldn't schedule it.");
      setState("error");
    }
  }

  if (state === "done" || state === "error") {
    return (
      <span className={`ml-2 mt-2 inline-block text-xs ${state === "done" ? "text-emerald-700 dark:text-emerald-400" : "text-red-600"}`}>
        {text}{" "}
        {state === "done" && (
          <Link href="/reports" className="underline">
            Manage
          </Link>
        )}
      </span>
    );
  }
  return (
    <button
      onClick={schedule}
      disabled={state === "busy"}
      title="Get this answer with fresh numbers every week (by email when set up, and on Reports)"
      className="ml-2 mt-2 rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-600 transition hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300"
    >
      {state === "busy" ? "Scheduling…" : "🔔 Schedule"}
    </button>
  );
}
