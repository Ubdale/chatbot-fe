"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Chart } from "@/components/Chart";
import { DataTable } from "@/components/DataTable";
import { Card, ErrorNote, Input, Spinner } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { slug } from "@/lib/download";
import type { DashboardSummary, DashboardView } from "@/lib/types";

function Tile({ tile }: { tile: DashboardView["tiles"][number] }) {
  const single = tile.rows.length === 1 && tile.columns.length === 1;
  return (
    <Card className="flex flex-col gap-2 p-4">
      <h3 className="font-medium">{tile.question}</h3>
      <p className="text-xs text-zinc-500">{tile.dataset_name}</p>
      {tile.error ? (
        <p className="text-sm text-amber-600 dark:text-amber-400">{tile.summary}</p>
      ) : single ? (
        <p className="py-4 text-center text-3xl font-semibold tabular-nums">
          {String(tile.rows[0][0])}
        </p>
      ) : (
        <>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{tile.summary}</p>
          {tile.chart && (
            <Chart spec={tile.chart} columns={tile.columns} rows={tile.rows} filename={slug(tile.question)} />
          )}
          {!tile.chart && tile.rows.length > 0 && (
            <DataTable columns={tile.columns} rows={tile.rows} maxHeight="max-h-56" />
          )}
        </>
      )}
    </Card>
  );
}

export function DashboardsView({ id }: { id?: string }) {
  const [list, setList] = useState<DashboardSummary[] | null>(null);
  const [view, setView] = useState<DashboardView | "loading" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const loadList = useCallback(() => {
    api<DashboardSummary[]>("/dashboards").then(setList).catch((e: ApiError) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!id) {
      loadList();
      return;
    }
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setView("loading");
    api<DashboardView>(`/dashboards/${id}`)
      .then((v) => active && setView(v))
      .catch((e: ApiError) => {
        if (!active) return;
        setView(null);
        setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id, loadList]);

  // A single dashboard.
  if (id) {
    return (
      <main className="mx-auto w-full max-w-6xl space-y-5 px-5 py-8">
        <Link href="/dashboards" className="text-sm text-zinc-500 hover:underline">← Dashboards</Link>
        {error && <ErrorNote>{error}</ErrorNote>}
        {view === "loading" || view === null ? (
          <p className="flex items-center gap-2 text-sm text-zinc-500"><Spinner /> Loading…</p>
        ) : (
          <>
            <h1 className="text-3xl font-semibold tracking-tight"><span className="gradient-text">{view.name}</span></h1>
            {view.tiles.length === 0 ? (
              <p className="text-sm text-zinc-500">No tiles yet. Pin an answer from chat with 📌.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {view.tiles.map((t, i) => <Tile key={`${t.question}-${i}`} tile={t} />)}
              </div>
            )}
          </>
        )}
      </main>
    );
  }

  // The list of dashboards.
  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-5 py-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight"><span className="gradient-text">Dashboards</span></h1>
        <p className="mt-1 text-sm text-zinc-500">
          Pin answers from chat (📌) to a dashboard. Each tile re-runs on your latest data when you open it.
        </p>
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!newName.trim()) return;
          try {
            await api("/dashboards", { json: { name: newName.trim() } });
            setNewName("");
            loadList();
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Couldn't create it.");
          }
        }}
      >
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New dashboard name" className="min-w-64 flex-1" />
        <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500">Create</button>
      </form>
      {list === null ? (
        <p className="flex items-center gap-2 text-sm text-zinc-500"><Spinner /> Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-zinc-500">No dashboards yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((d) => (
            <Link key={d.id} href={`/dashboards/${d.id}`} className="rounded-2xl border border-zinc-200 bg-white/60 p-4 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900/50">
              <p className="font-medium">{d.name}</p>
              <p className="text-xs text-zinc-500">{d.tiles} {d.tiles === 1 ? "tile" : "tiles"}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
