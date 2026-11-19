"use client";

import { useState } from "react";

import { DataTable } from "@/components/DataTable";
import { api } from "@/lib/api";
import { formatValue } from "@/lib/format";

type Evidence = { columns: string[]; rows: unknown[][]; total: number };

/**
 * The answer's table, plus proof: "Show rows behind this" lists the exact rows the
 * numbers were computed from; in a grouped answer, clicking a row shows that group's rows.
 */
export function ProofTable({
  messageId,
  table,
  plan,
}: {
  messageId: string;
  table: { columns: string[]; rows: unknown[][]; truncated: boolean };
  plan: Record<string, unknown>;
}) {
  const metric = String(plan.metric ?? "");
  const canProve = metric !== "" && metric !== "rows" && metric !== "describe";
  const groupBy = Array.isArray(plan.group_by) ? plan.group_by.length : 0;
  const dims = groupBy + (plan.time_grain ? 1 : 0);

  const [open, setOpen] = useState<string | null>(null); // label of what's shown
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [evidence, setEvidence] = useState<Evidence | null>(null);

  async function show(group: unknown[] | null) {
    const label = group ? group.map((v, i) => formatValue(v, table.columns[i])).join(" · ") : "this answer";
    if (open === label) {
      setOpen(null);
      return;
    }
    setOpen(label);
    setState("busy");
    try {
      const query = group ? `?group=${encodeURIComponent(JSON.stringify(group))}` : "";
      setEvidence(await api<Evidence>(`/chat/messages/${messageId}/evidence${query}`));
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="space-y-3">
      <DataTable
        columns={table.columns}
        rows={table.rows}
        truncated={table.truncated}
        onRowClick={canProve && dims > 0 ? (row) => show(row.slice(0, dims)) : undefined}
      />
      {canProve && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <button
            onClick={() => show(null)}
            className="rounded-md border border-indigo-200 px-2 py-1 font-medium text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
          >
            🔎 {open === "this answer" ? "Hide rows" : "Show rows behind this"}
          </button>
          {dims > 0 && <span>or click a row above to see the rows behind that number</span>}
        </div>
      )}
      {open && (
        <div className="animate-fade-up rounded-lg border border-indigo-200 bg-indigo-50/40 p-3 dark:border-indigo-900 dark:bg-indigo-950/20">
          <div className="mb-2 flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-indigo-800 dark:text-indigo-200">
              Rows behind {open === "this answer" ? "this answer" : `“${open}”`}
              {evidence && state === "idle" && (
                <span className="font-normal text-zinc-500">
                  {" "}
                  · {evidence.total.toLocaleString()} {evidence.total === 1 ? "row" : "rows"}
                  {evidence.total > evidence.rows.length && `, first ${evidence.rows.length} shown`}
                </span>
              )}
            </span>
            <button onClick={() => setOpen(null)} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
              ✕
            </button>
          </div>
          {state === "busy" && <p className="text-xs text-zinc-500">Finding the rows…</p>}
          {state === "error" && <p className="text-xs text-red-600">Couldn&apos;t load the rows. Try again.</p>}
          {state === "idle" && evidence && (
            <DataTable columns={evidence.columns} rows={evidence.rows} pretty={false} maxHeight="max-h-80" />
          )}
        </div>
      )}
    </div>
  );
}
