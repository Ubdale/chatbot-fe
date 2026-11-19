"use client";

import { useState } from "react";

export function CodeBlocks({ blocks }: { blocks: { language: string; code: string }[] }) {
  const [copied, setCopied] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {blocks.map((b, i) => (
        <div key={i} className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between bg-zinc-100 px-3 py-1.5 text-xs text-zinc-500 dark:bg-zinc-950">
            <span className="font-medium uppercase tracking-wide">{b.language}</span>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(b.code).catch(() => undefined);
                setCopied(i);
                setTimeout(() => setCopied(null), 1500);
              }}
              className="rounded px-2 py-0.5 hover:bg-white dark:hover:bg-zinc-800"
            >
              {copied === i ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <pre className="overflow-x-auto bg-zinc-50 p-3 font-mono text-xs leading-relaxed dark:bg-zinc-950/60">
            {b.code}
          </pre>
        </div>
      ))}
    </div>
  );
}
