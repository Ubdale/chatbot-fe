import { Chart } from "@/components/Chart";
import { DataTable } from "@/components/DataTable";
import type { DocumentAnswer, Message } from "@/lib/types";

function DocumentAnswerCard({ content, answer }: { content: string; answer: DocumentAnswer }) {
  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-[15px] leading-relaxed">{content}</p>
      {!answer.grounded && (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          The AI&apos;s answer included details it couldn&apos;t back up with the document, so it
          was not shown. Read the passages below instead.
        </p>
      )}
      <details open={!answer.grounded} className="rounded-lg border border-zinc-200 text-sm dark:border-zinc-800">
        <summary className="cursor-pointer select-none px-3 py-2 font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
          Sources from the document
        </summary>
        <ol className="space-y-2 border-t border-zinc-200 px-3 py-3 dark:border-zinc-800">
          {answer.sources.map((s) => (
            <li
              key={s.n}
              className={`rounded-md p-2 ${s.cited ? "bg-indigo-50 dark:bg-indigo-950/40" : "bg-zinc-50 dark:bg-zinc-950"}`}
            >
              <p className="mb-1 text-xs font-medium text-zinc-500">
                [{s.n}] {s.page ? `Page ${s.page}` : "Passage"}
                {s.cited && " · used in the answer"}
              </p>
              <p className="whitespace-pre-line text-zinc-700 dark:text-zinc-300">{s.text}</p>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}

export function AnswerCard({ message }: { message: Message }) {
  if (message.status === "clarification") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950/30">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
          Need a bit more detail
        </p>
        {message.content}
      </div>
    );
  }
  if (message.status === "failed" || !message.answer) {
    return (
      <div className="whitespace-pre-line rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
        {message.content}
      </div>
    );
  }

  if (message.answer.type === "document") {
    return <DocumentAnswerCard content={message.content} answer={message.answer} />;
  }
  const { table, chart, explanation } = message.answer;
  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-[15px] leading-relaxed">{message.content}</p>
      {explanation.data_note && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          {explanation.data_note}
        </p>
      )}

      {chart && <Chart spec={chart} columns={table.columns} rows={table.rows} />}

      {table.rows.length > 0 && (
        <DataTable columns={table.columns} rows={table.rows} truncated={table.truncated} />
      )}

    </div>
  );
}
