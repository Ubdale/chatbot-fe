"use client";

import { useState } from "react";

import { api, ApiError } from "@/lib/api";
import type { DoctorIssue, VersionResult } from "@/lib/types";

const SEVERITY: Record<string, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  low: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

/** The data doctor's findings, with checkboxes for the safe automatic fixes. */
export function DoctorPanel({
  datasetId,
  issues,
  onFixed,
}: {
  datasetId: string;
  issues: DoctorIssue[];
  onFixed?: (result: VersionResult) => void;
}) {
  const fixable = issues.filter((i) => i.fixable);
  const [chosen, setChosen] = useState<Set<string>>(() => new Set(fixable.map((i) => i.id)));
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [message, setMessage] = useState<string | null>(null);

  function toggle(id: string) {
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function fix() {
    setState("busy");
    setMessage(null);
    try {
      const result = await api<VersionResult>(`/datasets/${datasetId}/doctor/fix`, {
        json: { issue_ids: [...chosen] },
      });
      const c = result.changes;
      setMessage(
        `Fixed and saved as version ${result.dataset.version} (${c.rows_before.toLocaleString()} → ` +
          `${c.rows_after.toLocaleString()} rows, ${c.changed.toLocaleString()} changed). ` +
          "The previous version is kept: ask “what changed?” in chat to see every change.",
      );
      setState("done");
      onFixed?.(result);
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : "Couldn't apply the fixes. Try again.");
      setState("idle");
    }
  }

  if (issues.length === 0) {
    return <p className="text-sm text-emerald-700 dark:text-emerald-400">✓ No problems found.</p>;
  }

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {issues.map((issue) => (
          <li key={issue.id} className="flex gap-3 px-3 py-2.5 text-sm">
            <div className="pt-0.5">
              {issue.fixable ? (
                <input
                  type="checkbox"
                  checked={chosen.has(issue.id)}
                  disabled={state !== "idle"}
                  onChange={() => toggle(issue.id)}
                  aria-label={`Fix: ${issue.title}`}
                  className="h-4 w-4 accent-indigo-600"
                />
              ) : (
                <span className="inline-block h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${SEVERITY[issue.severity]}`}>
                  {issue.severity}
                </span>
                <span className="font-medium">{issue.title}</span>
                {issue.column && <span className="text-zinc-500">in {issue.column}</span>}
                <span className="text-xs text-zinc-500">
                  · {issue.rows.toLocaleString()} {issue.rows === 1 ? "row" : "rows"}
                </span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400">{issue.detail}</p>
              {issue.examples.length > 0 && (
                <p className="truncate text-xs text-zinc-500" title={issue.examples.join("\n")}>
                  e.g. {issue.examples.slice(0, 3).join(" · ")}
                </p>
              )}
              {issue.fixable && issue.fix_label && (
                <p className="text-xs text-indigo-700 dark:text-indigo-300">Fix: {issue.fix_label}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
      {fixable.length > 0 && state !== "done" && (
        <button
          onClick={fix}
          disabled={state === "busy" || chosen.size === 0}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {state === "busy" ? "Fixing…" : `Fix ${chosen.size} selected`}
        </button>
      )}
      {message && (
        <p
          className={`text-sm ${state === "done" ? "text-emerald-700 dark:text-emerald-400" : "text-red-600"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
