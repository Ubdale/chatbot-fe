"use client";

import { useEffect, useState } from "react";

import type { Stage } from "@/lib/stream";

const WORDS: Record<Stage | "waiting", string[]> = {
  waiting: ["Thinking…", "Getting started…", "Warming up the engines…", "Opening your data…"],
  planning: [
    "Reading your question…",
    "Figuring out what you need…",
    "Matching it to your columns…",
    "Planning the query…",
    "Pondering…",
  ],
  querying: ["Running the numbers…", "Crunching your data…", "Querying the table…", "Counting carefully…"],
  summarizing: [
    "Writing the summary…",
    "Double-checking every number…",
    "Putting it in plain English…",
    "Polishing the answer…",
  ],
  searching: ["Searching the document…", "Finding the right passages…", "Skimming the pages…"],
  reading: ["Reading the passages…", "Checking facts against the text…", "Quoting the source…"],
};

const STEPS: Record<"table" | "document", { stage: Stage; label: string }[]> = {
  table: [
    { stage: "planning", label: "Understand" },
    { stage: "querying", label: "Compute" },
    { stage: "summarizing", label: "Explain" },
  ],
  document: [
    { stage: "searching", label: "Search" },
    { stage: "reading", label: "Read & cite" },
  ],
};

function RotatingWords({ words }: { words: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => n + 1), 2200);
    return () => clearInterval(id);
  }, []);
  return (
    <span key={i} className="shimmer-text animate-fade-up inline-block font-medium">
      {words[i % words.length]}
    </span>
  );
}

export function Thinking({
  stage,
  kind,
  elapsed,
}: {
  stage: Stage | null;
  kind: "table" | "document";
  elapsed: number;
}) {
  const steps = STEPS[kind];
  const current = stage ? steps.findIndex((s) => s.stage === stage) : -1;
  return (
    <div className="animate-fade-up flex gap-3">
      <div className="avatar-orb thinking-orb mt-0.5 h-8 w-8 shrink-0">✦</div>
      <div className="min-w-0 space-y-2 pt-1">
        <div className="text-[15px]">
          {/* keyed by stage so the word cycle restarts on each new step */}
          <RotatingWords key={stage ?? "waiting"} words={WORDS[stage ?? "waiting"]} />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
          {steps.map((s, i) => {
            const state = i < current ? "done" : i === current ? "active" : "todo";
            return (
              <span key={s.stage} className="flex items-center gap-1.5">
                <span
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 transition-colors ${
                    state === "done"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : state === "active"
                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                        : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800/60"
                  }`}
                >
                  {state === "done" ? "✓" : state === "active" ? <span className="pulse-dot" /> : "·"}
                  {s.label}
                </span>
                {i < steps.length - 1 && <span className="text-zinc-300 dark:text-zinc-700">→</span>}
              </span>
            );
          })}
          {elapsed >= 3 && <span className="ml-1 tabular-nums">{elapsed}s</span>}
        </div>
        {elapsed >= 20 && (
          <p className="text-xs text-zinc-500">
            Still working: your private AI model runs on its own server and can take a little longer.
          </p>
        )}
      </div>
    </div>
  );
}
