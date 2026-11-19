"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type DragEvent } from "react";

import { Button, Card, ErrorNote, Spinner } from "@/components/ui";
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
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Datasets</h1>
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
            <label className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
              Read as
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
                className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="auto">Auto</option>
                <option value="table">Table (computed answers)</option>
                <option value="document">Document (quoted answers)</option>
              </select>
            </label>
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
        <p className="text-sm text-zinc-500">No datasets yet.</p>
      ) : (
        <Card>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {datasets.map((ds) => (
              <li key={ds.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/datasets/${ds.id}`} className="font-medium hover:underline">
                    {ds.name}
                  </Link>
                  {ds.kind === "document" && (
                    <span className="ml-2 rounded bg-violet-100 px-1.5 py-0.5 text-xs text-violet-800 dark:bg-violet-950 dark:text-violet-300">
                      Document
                    </span>
                  )}
                  {ds.extraction === "ai_vision" && (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      AI-read: please check
                    </span>
                  )}
                  <p className="text-xs text-zinc-500">
                    {ds.row_count.toLocaleString()} {ds.kind === "document" ? "passages" : "rows"} ·{" "}
                    {ds.file_format.toUpperCase()} ·{" "}
                    {formatBytes(ds.size_bytes)} · added {formatDate(ds.created_at)}
                  </p>
                </div>
                <Link href={`/chat?d=${ds.id}`}>
                  <Button variant="ghost">Ask a question</Button>
                </Link>
                <Button variant="danger" onClick={() => remove(ds)}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </main>
  );
}
