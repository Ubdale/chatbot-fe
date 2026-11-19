"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Button, Card, Input } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { GlossaryTerm } from "@/lib/types";

/** The team's words for this file ("sales" means revenue). Also learned from chat. */
export function Glossary({ datasetId }: { datasetId: string }) {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [term, setTerm] = useState("");
  const [meaning, setMeaning] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<GlossaryTerm[]>(`/datasets/${datasetId}/glossary`).then(setTerms).catch(() => undefined);
  }, [datasetId]);

  async function add(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      setTerms(
        await api<GlossaryTerm[]>(`/datasets/${datasetId}/glossary`, {
          json: { term: term.trim(), meaning: meaning.trim() },
        }),
      );
      setTerm("");
      setMeaning("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save that.");
    }
  }

  async function remove(id: string) {
    await api(`/datasets/${datasetId}/glossary/${id}`, { method: "DELETE" }).catch(() => undefined);
    setTerms((ts) => ts.filter((t) => t.id !== id));
  }

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold">Learned words</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Words your team uses for things in this file. AskData uses them in every answer. You can
        also teach them in chat: &ldquo;sales means revenue&rdquo;.
      </p>
      {terms.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {terms.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-1.5 rounded-full bg-indigo-50 py-1 pl-3 pr-1 text-sm dark:bg-indigo-950/50"
            >
              <span className="font-medium">{t.term}</span>
              <span className="text-zinc-400">→</span>
              <span>{t.meaning}</span>
              <button
                onClick={() => remove(t.id)}
                aria-label={`Forget ${t.term}`}
                className="rounded-full px-1.5 text-zinc-400 hover:bg-white hover:text-red-600 dark:hover:bg-zinc-900"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="mt-3 flex flex-wrap gap-2">
        <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Word, e.g. sales" className="max-w-40" required maxLength={100} />
        <Input value={meaning} onChange={(e) => setMeaning(e.target.value)} placeholder="Means, e.g. revenue" className="max-w-64" required maxLength={300} />
        <Button type="submit" variant="ghost">Teach</Button>
      </form>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </Card>
  );
}
