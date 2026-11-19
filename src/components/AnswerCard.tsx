import { Chart } from "@/components/Chart";
import { DataTable } from "@/components/DataTable";
import { CodeBlocks } from "@/components/CodeBlocks";
import { ExcelButton } from "@/components/ExcelButton";
import { downloadCsv, slug } from "@/lib/download";
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

  if (message.answer.type === "file") {
    return (
      <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-[15px] leading-relaxed">{message.content}</p>
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-600 text-sm font-bold text-white">XLS</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{message.answer.label}</p>
            <p className="text-xs text-zinc-500">
              {message.answer.style ? "Excel workbook, formatted as you asked" : "Formatted Excel workbook"}
            </p>
          </div>
          {/* This message's own id: the export uses the formatting chosen in this chat. */}
          <ExcelButton messageId={message.id} filename={slug(message.answer.label)} primary />
          <ExcelButton messageId={message.id} filename={slug(message.answer.label)} format="pdf" />
        </div>
        <p className="text-xs text-zinc-500">
          Tip: ask “make the header green”, “highlight overdue tasks in red” or “add an average row”.
        </p>
      </div>
    );
  }
  if (message.answer.type === "code") {
    return (
      <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-[15px] leading-relaxed">{message.content}</p>
        <CodeBlocks blocks={message.answer.blocks} />
      </div>
    );
  }
  if (message.answer.type === "document") {
    return <DocumentAnswerCard content={message.content} answer={message.answer} />;
  }
  const { table, chart, explanation } = message.answer;
  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-[15px] leading-relaxed">
        {message.answer.reused && (
          <span
            title="Answered instantly from an identical earlier question; numbers recomputed"
            className="mr-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
          >
            ⚡ Instant
          </span>
        )}
        {message.content}
      </p>
      {explanation.data_note && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          {explanation.data_note}
        </p>
      )}

      {chart && (
        <Chart spec={chart} columns={table.columns} rows={table.rows} filename={slug(message.content)} />
      )}

      {table.rows.length > 0 && (
        <div>
          <DataTable columns={table.columns} rows={table.rows} truncated={table.truncated} />
          <button
            onClick={() => downloadCsv(table.columns, table.rows, `${slug(message.content)}.csv`)}
            className="mt-2 rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-600 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-700 dark:text-zinc-300"
          >
            ⬇ CSV
          </button>
          <ExcelButton messageId={message.id} filename={slug(message.content)} />
          <ExcelButton messageId={message.id} filename={slug(message.content)} format="pdf" />
        </div>
      )}

    </div>
  );
}
