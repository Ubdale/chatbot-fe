"use client";

import { useState } from "react";

import { downloadExport } from "@/lib/download";

export function ExcelButton({
  messageId,
  filename,
  primary = false,
  format = "xlsx",
}: {
  messageId: string;
  filename: string;
  primary?: boolean;
  format?: "xlsx" | "pdf";
}) {
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");

  async function click() {
    setState("busy");
    try {
      await downloadExport(messageId, filename, format);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  const style = primary
    ? "rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
    : "ml-2 mt-2 rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-600 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-zinc-700 dark:text-zinc-300";
  return (
    <button onClick={click} disabled={state === "busy"} className={style}>
      {state === "busy" ? "Preparing…" : state === "error" ? "Try again" : format === "pdf" ? "⬇ PDF" : "⬇ Excel"}
    </button>
  );
}
