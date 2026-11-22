"use client";

import { useEffect, useState } from "react";

import { Chart } from "@/components/Chart";
import { DataTable } from "@/components/DataTable";
import { slug } from "@/lib/download";
import type { Answer } from "@/lib/types";

type Shared = {
  question: string;
  content: string;
  answer: Answer | null;
  dataset_name: string;
  created_at: string;
};

/** A public, read-only view of one shared answer (no account needed). */
export function SharedAnswer({ token }: { token: string }) {
  const [data, setData] = useState<Shared | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/chat/share/${token}`, { credentials: "omit" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setData)
      .catch(() => setError("This shared link is invalid or has been removed."));
  }, [token]);

  if (error) {
    return <main className="mx-auto max-w-2xl px-4 py-16 text-center text-zinc-500">{error}</main>;
  }
  if (!data) {
    return <main className="mx-auto max-w-2xl px-4 py-16 text-center text-zinc-400">Loading…</main>;
  }

  const ans = data.answer;
  const table = ans && "table" in ans ? ans.table : null;
  const chart = ans && "chart" in ans ? ans.chart : null;

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 px-4 py-10">
      <header className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">A</span>
        <span className="font-semibold">AskData</span>
        <span className="ml-auto text-xs text-zinc-500">
          Shared answer · {new Date(data.created_at).toLocaleDateString()}
        </span>
      </header>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold tracking-tight">{data.question}</h1>
        <p className="mt-1 text-xs text-zinc-500">From “{data.dataset_name}”</p>
        <p className="mt-4 text-[15px] leading-relaxed">{data.content}</p>
        {chart && table && (
          <div className="mt-5">
            <Chart spec={chart} columns={table.columns} rows={table.rows} filename={slug(data.question)} />
          </div>
        )}
        {table && (
          <div className="mt-5">
            <DataTable columns={table.columns} rows={table.rows} truncated={table.truncated} />
          </div>
        )}
      </div>
      <p className="text-center text-xs text-zinc-400">
        Every number was computed from the data by AskData, not written by AI.
      </p>
    </main>
  );
}
