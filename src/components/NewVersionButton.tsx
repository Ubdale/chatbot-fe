"use client";

import { useRef, useState } from "react";

import { api, ApiError } from "@/lib/api";
import type { VersionResult } from "@/lib/types";

/** Upload a newer file (e.g. this week's export) onto an existing table. */
export function NewVersionButton({
  datasetId,
  onUploaded,
}: {
  datasetId: string;
  onUploaded: (result: VersionResult) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setMessage(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const result = await api<VersionResult>(`/datasets/${datasetId}/versions`, { form });
      const c = result.changes;
      setMessage({
        ok: true,
        text:
          `Version ${result.dataset.version} saved: ${c.added.toLocaleString()} new, ` +
          `${c.removed.toLocaleString()} removed, ${c.changed.toLocaleString()} changed rows. ` +
          "Ask “what changed?” in chat for the details.",
      });
      onUploaded(result);
    } catch (e) {
      setMessage({ ok: false, text: e instanceof ApiError ? e.message : "Upload failed." });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={input}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <button
        onClick={() => input.current?.click()}
        disabled={busy}
        title="Upload a newer copy of this file; the current one is kept so you can compare"
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium transition hover:border-indigo-400 disabled:opacity-50 dark:border-zinc-700"
      >
        {busy ? "Uploading…" : "⬆ Upload new version"}
      </button>
      {message && (
        <p className={`max-w-sm text-right text-xs ${message.ok ? "text-emerald-700 dark:text-emerald-400" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
