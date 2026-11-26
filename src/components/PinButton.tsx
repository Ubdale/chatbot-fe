"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { DashboardSummary } from "@/lib/types";

/** Pin an answer to a dashboard (pick an existing one or type a new name). */
export function PinButton({ messageId }: { messageId: string }) {
  const [open, setOpen] = useState(false);
  const [boards, setBoards] = useState<DashboardSummary[]>([]);
  const [name, setName] = useState("");
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (open) api<DashboardSummary[]>("/dashboards").then(setBoards).catch(() => undefined);
  }, [open]);

  async function pin(body: { dashboard_id?: string; name?: string }) {
    try {
      const d = await api<DashboardSummary>("/dashboards/pin", { json: { message_id: messageId, ...body } });
      setDone(d.name);
      setOpen(false);
    } catch {
      setDone("Couldn't pin");
    }
  }

  if (done) {
    return <span className="ml-2 mt-2 inline-block text-xs text-emerald-700 dark:text-emerald-400">📌 Pinned to “{done}”</span>;
  }
  return (
    <span className="relative ml-2 mt-2 inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Pin to a dashboard"
        className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-600 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-700 dark:text-zinc-300"
      >
        📌 Pin
      </button>
      {open && (
        <div className="absolute bottom-full z-20 mb-1 w-56 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          {boards.map((b) => (
            <button
              key={b.id}
              onClick={() => pin({ dashboard_id: b.id })}
              className="block w-full truncate rounded-md px-2 py-1.5 text-left text-sm hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
            >
              {b.name}
            </button>
          ))}
          <form
            className="mt-1 flex gap-1 border-t border-zinc-100 pt-2 dark:border-zinc-800"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) void pin({ name: name.trim() });
            }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New dashboard…"
              className="min-w-0 flex-1 rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button type="submit" className="rounded-md bg-indigo-600 px-2 text-xs text-white">Add</button>
          </form>
        </div>
      )}
    </span>
  );
}
