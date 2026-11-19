"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { DataTable } from "@/components/DataTable";
import { Card, ErrorNote, Input, Spinner } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { Digest, DigestRun } from "@/lib/types";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HOURS = Array.from({ length: 24 }, (_, h) => h);

function fmtNumber(v: number): string {
  return Number.isInteger(v) ? v.toLocaleString() : v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function Delta({ now, before }: { now?: number | null; before?: number | null }) {
  if (now == null || before == null) return null;
  if (now === before) return <span className="text-zinc-500"> · same as last time</span>;
  const diff = now - before;
  const pct = before ? ` (${diff > 0 ? "+" : ""}${Math.round((diff / before) * 100)}%)` : "";
  return (
    <span className={diff > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
      {" "}
      · {diff > 0 ? "▲" : "▼"} {fmtNumber(Math.abs(diff))}
      {pct} since last time
    </span>
  );
}

function DigestEditor({ digest, onChange }: { digest: Digest; onChange: () => void }) {
  const [recipients, setRecipients] = useState(digest.recipients.join(", "));
  const [state, setState] = useState<"idle" | "busy">("idle");
  const [note, setNote] = useState<string | null>(null);

  async function save(patch: Record<string, unknown>) {
    setState("busy");
    setNote(null);
    try {
      await api(`/digests/${digest.id}`, { method: "PATCH", json: patch });
      onChange();
    } catch (e) {
      setNote(e instanceof ApiError ? e.message : "Couldn't save.");
    } finally {
      setState("idle");
    }
  }

  async function runNow() {
    setState("busy");
    setNote(null);
    try {
      const run = await api<DigestRun>(`/digests/${digest.id}/run`, { method: "POST" });
      setNote(run.emailed ? "Sent by email and added below." : `Added below. ${run.email_note ?? ""}`);
      onChange();
    } catch (e) {
      setNote(e instanceof ApiError ? e.message : "Couldn't send it.");
    } finally {
      setState("idle");
    }
  }

  async function remove() {
    if (!confirm(`Delete the digest “${digest.title}”?`)) return;
    await api(`/digests/${digest.id}`, { method: "DELETE" });
    onChange();
  }

  const select =
    "rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900";
  return (
    <Card className={`space-y-3 p-4 ${digest.active ? "" : "opacity-60"}`}>
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{digest.title}</h3>
          <p className="text-xs text-zinc-500">
            From “{digest.dataset_name}” · next: {new Date(digest.next_run_at).toLocaleString()}
            {digest.last_run_at && ` · last: ${new Date(digest.last_run_at).toLocaleString()}`}
          </p>
        </div>
        <button
          onClick={runNow}
          disabled={state === "busy"}
          className="rounded-md border border-indigo-200 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
        >
          {state === "busy" ? "…" : "Send now"}
        </button>
        <button
          onClick={() => save({ active: !digest.active })}
          className="rounded-md border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700"
        >
          {digest.active ? "Pause" : "Resume"}
        </button>
        <button onClick={remove} className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
          Delete
        </button>
      </div>

      <ul className="list-inside list-disc text-sm text-zinc-700 dark:text-zinc-300">
        {digest.questions.map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <select
          value={digest.cadence}
          onChange={(e) => save({ cadence: e.target.value })}
          className={select}
          aria-label="How often"
        >
          <option value="weekly">Every week</option>
          <option value="daily">Every day</option>
        </select>
        {digest.cadence === "weekly" && (
          <select
            value={digest.weekday}
            onChange={(e) => save({ weekday: Number(e.target.value) })}
            className={select}
            aria-label="Day"
          >
            {DAYS.map((d, i) => (
              <option key={d} value={i}>
                on {d}
              </option>
            ))}
          </select>
        )}
        <select value={digest.hour} onChange={(e) => save({ hour: Number(e.target.value) })} className={select} aria-label="Time">
          {HOURS.map((h) => (
            <option key={h} value={h}>
              at {String(h).padStart(2, "0")}:00
            </option>
          ))}
        </select>
        <span className="text-xs text-zinc-500">{digest.timezone}</span>
      </div>

      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const list = recipients
            .split(/[,\s]+/)
            .map((r) => r.trim())
            .filter(Boolean);
          void save({ recipients: list });
        }}
      >
        <Input
          value={recipients}
          onChange={(e) => setRecipients(e.target.value)}
          placeholder="Email addresses, separated by commas"
          className="min-w-64 flex-1"
          aria-label="Recipients"
        />
        <button type="submit" className="rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700">
          Save recipients
        </button>
      </form>
      {note && <p className="text-xs text-zinc-600 dark:text-zinc-400">{note}</p>}
    </Card>
  );
}

function RunCard({ run }: { run: DigestRun }) {
  return (
    <Card className="space-y-3 p-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <h3 className="font-semibold">{run.digest_title}</h3>
        <span className="text-xs text-zinc-500">
          {new Date(run.created_at).toLocaleString()} · data version {run.dataset_version}
          {run.emailed ? " · emailed" : ""}
        </span>
      </div>
      {run.changes && (
        <p className="rounded-md bg-indigo-50 px-3 py-2 text-sm text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">
          New data since the last digest: {run.changes.added.toLocaleString()} new rows,{" "}
          {run.changes.removed.toLocaleString()} removed, {run.changes.changed.toLocaleString()} changed.
        </p>
      )}
      {run.content.map((item) => (
        <div key={item.question} className="space-y-1.5">
          <p className="text-sm font-medium">{item.question}</p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {item.summary}
            <Delta now={item.headline} before={item.previous} />
          </p>
          {item.columns && item.rows && item.rows.length > 1 && (
            <DataTable columns={item.columns} rows={item.rows} truncated={item.truncated} maxHeight="max-h-64" />
          )}
        </div>
      ))}
      {!run.emailed && run.email_note && <p className="text-xs text-zinc-500">{run.email_note}</p>}
    </Card>
  );
}

export function ReportsView() {
  const [digests, setDigests] = useState<Digest[] | null>(null);
  const [runs, setRuns] = useState<DigestRun[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<Digest[]>("/digests")
      .then(setDigests)
      .catch((e: ApiError) => setError(e.message));
    api<DigestRun[]>("/digests/runs?limit=20")
      .then(setRuns)
      .catch(() => undefined);
  }, []);

  useEffect(load, [load]);

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-zinc-500">
          Questions AskData re-runs on a schedule, with fresh numbers each time. To add one, ask a question in{" "}
          <Link href="/chat" className="text-indigo-600 hover:underline">
            chat
          </Link>{" "}
          and say “send me this every Monday at 9”, or press 🔔 Schedule under the answer.
        </p>
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Scheduled</h2>
        {digests === null ? (
          <p className="flex items-center gap-2 text-sm text-zinc-500">
            <Spinner /> Loading…
          </p>
        ) : digests.length === 0 ? (
          <p className="text-sm text-zinc-500">No scheduled reports yet.</p>
        ) : (
          digests.map((d) => <DigestEditor key={`${d.id}-${d.next_run_at}-${d.active}`} digest={d} onChange={load} />)
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Recent digests</h2>
        {runs.length === 0 ? (
          <p className="text-sm text-zinc-500">Digests appear here when they are sent.</p>
        ) : (
          runs.map((r) => <RunCard key={r.id} run={r} />)
        )}
      </section>
    </main>
  );
}
