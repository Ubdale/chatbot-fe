"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { DataTable } from "@/components/DataTable";
import { Card, ErrorNote, Input, Spinner } from "@/components/ui";
import { Select } from "@/components/Select";
import { api, ApiError } from "@/lib/api";
import type { Digest, DigestRun } from "@/lib/types";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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

function DigestEditor({ digest, onRemoved }: { digest: Digest; onRemoved: () => void }) {
  // Work on a local copy so rescheduling updates in place (no remount, no lost focus).
  const [local, setLocal] = useState<Digest>(digest);
  const [recipientInput, setRecipientInput] = useState("");
  const [state, setState] = useState<"idle" | "busy">("idle");
  const [note, setNote] = useState<string | null>(null);

  async function save(patch: Record<string, unknown>) {
    setState("busy");
    setNote(null);
    try {
      const updated = await api<Digest>(`/digests/${local.id}`, { method: "PATCH", json: patch });
      setLocal(updated);
    } catch (e) {
      setNote(e instanceof ApiError ? e.message : "Couldn't save.");
    } finally {
      setState("idle");
    }
  }

  function addRecipients() {
    const added = recipientInput
      .split(/[,\s]+/)
      .map((r) => r.trim().toLowerCase())
      .filter((r) => r.includes("@"));
    if (added.length === 0) return;
    const merged = Array.from(new Set([...local.recipients, ...added]));
    setRecipientInput("");
    void save({ recipients: merged });
  }

  function removeRecipient(email: string) {
    void save({ recipients: local.recipients.filter((r) => r !== email) });
  }

  async function runNow() {
    setState("busy");
    setNote(null);
    try {
      const run = await api<DigestRun>(`/digests/${local.id}/run`, { method: "POST" });
      setNote(run.emailed ? "Sent by email and added below." : `Added below. ${run.email_note ?? ""}`);
      onRemoved(); // refresh the "recent digests" list
    } catch (e) {
      setNote(e instanceof ApiError ? e.message : "Couldn't send it.");
    } finally {
      setState("idle");
    }
  }

  async function remove() {
    if (!confirm(`Delete the digest “${local.title}”?`)) return;
    await api(`/digests/${local.id}`, { method: "DELETE" });
    onRemoved();
  }

  return (
    <Card className={`space-y-3 p-4 ${local.active ? "" : "opacity-60"}`}>
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">
            {local.condition_op && (
              <span className="mr-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                🚨 Alert
              </span>
            )}
            {local.title}
          </h3>
          {local.condition_op && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Notifies only when the value {{ ">": "goes above", ">=": "reaches", "<": "drops below", "<=": "falls to" }[local.condition_op] ?? local.condition_op}{" "}
              {local.condition_value?.toLocaleString()}
            </p>
          )}
          <p className="text-xs text-zinc-500">
            From “{local.dataset_name}” · next: {new Date(local.next_run_at).toLocaleString()}
            {local.last_run_at && ` · last: ${new Date(local.last_run_at).toLocaleString()}`}
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
          onClick={() => save({ active: !local.active })}
          className="rounded-md border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700"
        >
          {local.active ? "Pause" : "Resume"}
        </button>
        <button onClick={remove} className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
          Delete
        </button>
      </div>

      <ul className="list-inside list-disc text-sm text-zinc-700 dark:text-zinc-300">
        {local.questions.map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Select
          value={local.cadence}
          onValueChange={(v) => save({ cadence: v })}
          ariaLabel="How often"
          items={[
            { value: "weekly", label: "Every week" },
            { value: "daily", label: "Every day" },
          ]}
        />
        {local.cadence === "weekly" && (
          <Select
            value={String(local.weekday)}
            onValueChange={(v) => save({ weekday: Number(v) })}
            ariaLabel="Day"
            items={DAYS.map((d, i) => ({ value: String(i), label: `on ${d}` }))}
          />
        )}
        <span className="flex items-center gap-1.5">
          at
          <Select
            value={String(local.hour)}
            onValueChange={(v) => save({ hour: Number(v), minute: local.minute ?? 0 })}
            ariaLabel="Hour"
            items={Array.from({ length: 24 }, (_, h) => ({
              value: String(h),
              label: String(h).padStart(2, "0"),
            }))}
          />
          <span className="text-zinc-400">:</span>
          <Select
            value={String(local.minute ?? 0)}
            onValueChange={(v) => save({ hour: local.hour, minute: Number(v) })}
            ariaLabel="Minute"
            items={Array.from({ length: 60 }, (_, m) => ({
              value: String(m),
              label: String(m).padStart(2, "0"),
            }))}
          />
        </span>
        <span className="text-xs text-zinc-500">{local.timezone}</span>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-zinc-500">
          Send to {local.recipients.length} {local.recipients.length === 1 ? "address" : "addresses"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {local.recipients.map((email) => (
            <span
              key={email}
              className="inline-flex items-center gap-1 rounded-full bg-indigo-50 py-0.5 pl-2.5 pr-1 text-xs text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200"
            >
              {email}
              <button
                onClick={() => removeRecipient(email)}
                aria-label={`Remove ${email}`}
                disabled={local.recipients.length === 1}
                className="rounded-full px-1 text-indigo-400 hover:text-red-600 disabled:opacity-30"
                title={local.recipients.length === 1 ? "Keep at least one recipient" : "Remove"}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addRecipients();
          }}
        >
          <Input
            value={recipientInput}
            onChange={(e) => setRecipientInput(e.target.value)}
            placeholder="Add email(s), separated by commas"
            className="min-w-64 flex-1"
            aria-label="Add recipients"
          />
          <button type="submit" className="rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700">
            Add
          </button>
        </form>
      </div>
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem("slack") as HTMLInputElement;
          void save({ slack_webhook: input.value.trim() });
        }}
      >
        <Input
          name="slack"
          defaultValue=""
          placeholder={local.slack ? "Slack connected ✓ — paste a new webhook to change" : "Slack webhook URL (optional)"}
          className="min-w-64 flex-1"
          aria-label="Slack webhook"
        />
        <button type="submit" className="rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700">
          {local.slack ? "Update Slack" : "Send to Slack"}
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
    <main className="mx-auto w-full max-w-5xl space-y-8 px-5 py-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight"><span className="gradient-text">Reports</span></h1>
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
          digests.map((d) => <DigestEditor key={d.id} digest={d} onRemoved={load} />)
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
