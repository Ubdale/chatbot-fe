"use client";

import Link from "next/link";
import type React from "react";
import { useEffect, useRef, useState, type DragEvent } from "react";

import { Button, ErrorNote, Spinner } from "@/components/ui";
import { Select } from "@/components/Select";
import { api, ApiError } from "@/lib/api";
import { formatBytes, formatDate } from "@/lib/format";
import type { DatasetSummary, UploadResult } from "@/lib/types";

const MAX_MB = 20;
const ACCEPT =
  ".csv,.tsv,.txt,.xlsx,.xlsm,.xls,.ods,.json,.jsonl,.parquet,.pdf,.docx,.md,.png,.jpg,.jpeg,.webp";
const EXTENSIONS = ACCEPT.split(",");
const isAccepted = (name: string) => EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext));
type Mode = "auto" | "table" | "document";

export function DatasetsView() {
  const [datasets, setDatasets] = useState<DatasetSummary[] | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [mode, setMode] = useState<Mode>("auto");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api<DatasetSummary[]>("/datasets").then(setDatasets).catch((e: ApiError) => setError(e.message));
  }, []);

  async function upload(file: File) {
    setError(null);
    setNotice(null);
    if (!isAccepted(file.name)) return setError("That file type isn't supported.");
    if (file.size > MAX_MB * 1024 * 1024) return setError(`That file is over the ${MAX_MB} MB limit.`);
    setUploading(file.name);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("mode", mode);
      const ds = await api<UploadResult>("/datasets", { form });
      setDatasets((list) => [ds, ...(list ?? [])]);
      const others = ds.sheet_names.filter((s) => s !== ds.sheet_name);
      setNotice(
        ds.kind === "document"
          ? `Added “${ds.name}” as a document (${ds.row_count.toLocaleString()} passages). Answers will quote it with page sources.`
          : `Added “${ds.name}”: ${ds.row_count.toLocaleString()} rows, ${ds.columns.length} columns.` +
              (others.length ? ` Used “${ds.sheet_name}” (others: ${others.join(", ")}).` : "") +
              (ds.extraction === "ai_vision"
                ? " This table was read from an image by AI: please check the preview."
                : "") +
              (ds.extra_sheets?.length
                ? ` Other sheets were added as their own datasets: ${ds.extra_sheets.join(", ")}.`
                : ""),
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Upload failed.");
    } finally {
      setUploading(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function remove(ds: DatasetSummary) {
    if (!confirm(`Delete “${ds.name}” and its conversations?`)) return;
    try {
      await api(`/datasets/${ds.id}`, { method: "DELETE" });
      setDatasets((list) => list?.filter((d) => d.id !== ds.id) ?? null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Delete failed.");
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void upload(file);
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-5 py-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight"><span className="gradient-text">Your data</span></h1>
        <p className="mt-1 text-sm text-zinc-500">
          Upload a CSV or Excel file. Only column names, types and a few sample values are shared
          with the AI, never your rows.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragging
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
            : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
        }`}
      >
        {uploading ? (
          <p className="flex items-center gap-2 text-sm">
            <Spinner /> Uploading and analysing {uploading}…
          </p>
        ) : (
          <>
            <p className="text-sm font-medium">Drag a file here, or</p>
            <Button className="mt-3" onClick={() => fileInput.current?.click()}>
              Choose a file
            </Button>
            <p className="mt-2 text-xs text-zinc-500">
              Spreadsheets, CSV, JSON, PDF, Word, text or a picture of a table, up to {MAX_MB} MB
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
              Read as
              <Select
                value={mode}
                onValueChange={(v) => setMode(v as Mode)}
                ariaLabel="Read as"
                items={[
                  { value: "auto", label: "Auto" },
                  { value: "table", label: "Table (computed answers)" },
                  { value: "document", label: "Document (quoted answers)" },
                ]}
              />
            </div>
          </>
        )}
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </div>

      {notice && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          {notice}
        </p>
      )}
      {error && <ErrorNote>{error}</ErrorNote>}

      {datasets === null ? (
        <p className="flex items-center gap-2 text-sm text-zinc-500">
          <Spinner /> Loading…
        </p>
      ) : datasets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500">No datasets yet. Want to see how it works?</p>
          <button
            onClick={async () => {
              try {
                const ds = await api<UploadResult>("/datasets/demo", { method: "POST" });
                setDatasets((list) => [ds, ...(list ?? [])]);
                setNotice(`Loaded “${ds.name}”. Open it and try “revenue by region”.`);
              } catch {
                setError("Couldn't load the sample data.");
              }
            }}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            ✨ Load sample data
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {datasets.map((ds, i) => (
            <div
              key={ds.id}
              style={{ "--i": i } as React.CSSProperties}
              className="card-rise group relative flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white/70 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-indigo-700"
            >
              <div className="flex items-start gap-3">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-base font-bold text-white ${ds.kind === "document" ? "bg-gradient-to-br from-violet-500 to-fuchsia-600" : "bg-gradient-to-br from-indigo-500 to-blue-600"}`}>
                  {ds.kind === "document" ? "📄" : "▦"}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/datasets/${ds.id}`} className="block truncate font-medium hover:text-indigo-600 dark:hover:text-indigo-400" title={ds.name}>
                    {ds.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {ds.row_count.toLocaleString()} {ds.kind === "document" ? "passages" : "rows"} · {ds.file_format.toUpperCase()}
                  </p>
                </div>
              </div>
              {(ds.version > 1 || ds.extraction === "ai_vision") && (
                <div className="flex flex-wrap gap-1.5">
                  {ds.version > 1 && (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">v{ds.version}</span>
                  )}
                  {ds.extraction === "ai_vision" && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">AI-read: please check</span>
                  )}
                </div>
              )}
              <p className="text-xs text-zinc-400">
                {formatBytes(ds.size_bytes)} · added {formatDate(ds.created_at)}
              </p>
              <div className="mt-auto flex items-center gap-2 pt-1">
                <Link href={`/chat?d=${ds.id}`} className="flex-1">
                  <Button variant="ghost" className="w-full">Ask a question</Button>
                </Link>
                <button
                  onClick={() => remove(ds)}
                  aria-label={`Delete ${ds.name}`}
                  className="rounded-lg px-2 py-1.5 text-sm text-zinc-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-950/30"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
