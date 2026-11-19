"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { AnswerCard } from "@/components/AnswerCard";
import { Feedback } from "@/components/Feedback";
import { Thinking } from "@/components/Thinking";
import { Button, ErrorNote } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { askStream, StreamUnavailable, type Stage } from "@/lib/stream";
import { suggestQuestions } from "@/lib/suggestions";
import type {
  AskResponse,
  Conversation,
  ConversationSummary,
  Dataset,
  DatasetSummary,
  Message,
} from "@/lib/types";

function useElapsedSeconds(running: boolean): number {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const started = Date.now();
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => {
      clearInterval(id);
      setSeconds(0);
    };
  }, [running]);
  return seconds;
}

function UserBubble({ text, faded = false }: { text: string; faded?: boolean }) {
  return (
    <div className="animate-fade-up flex justify-end">
      <p
        className={`max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-lg bg-linear-to-br from-indigo-600 to-violet-600 px-4 py-2.5 text-[15px] text-white shadow-sm ${
          faded ? "opacity-80" : ""
        }`}
      >
        {text}
      </p>
    </div>
  );
}

function AssistantTurn({ message }: { message: Message }) {
  return (
    <div className="animate-fade-up flex gap-3">
      <div className="avatar-orb mt-0.5 h-8 w-8 shrink-0">✦</div>
      <div className="min-w-0 flex-1">
        <AnswerCard message={message} />
        {message.status !== "failed" && <Feedback messageId={message.id} initial={message.rating ?? null} />}
      </div>
    </div>
  );
}

const SUGGESTION_ICONS = ["◆", "↗", "◷", "≡", "?"];

export function ChatView() {
  const router = useRouter();
  const params = useSearchParams();
  const conversationId = params.get("c");
  const datasetParam = params.get("d");

  const [datasets, setDatasets] = useState<DatasetSummary[] | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  // The loaded thread, tagged with its conversation id (null = a new, unsaved chat).
  const [thread, setThread] = useState<{ id: string | null; datasetId: string | null; messages: Message[] }>({
    id: null,
    datasetId: null,
    messages: [],
  });
  const [chosenDatasetId, setChosenDatasetId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Dataset | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const elapsed = useElapsedSeconds(pending !== null);

  // Everything below is derived from the URL + loaded data (no state syncing in effects).
  const threadLoaded = thread.id === conversationId;
  const messages = threadLoaded ? thread.messages : [];
  const datasetId = conversationId
    ? threadLoaded
      ? thread.datasetId
      : null
    : (datasets?.find((d) => d.id === (chosenDatasetId ?? datasetParam))?.id ?? datasets?.[0]?.id ?? null);
  const dataset = detail && detail.id === datasetId ? detail : null;

  useEffect(() => {
    api<DatasetSummary[]>("/datasets").then(setDatasets).catch((e: ApiError) => setError(e.message));
    api<ConversationSummary[]>("/chat/conversations").then(setConversations).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!conversationId || threadLoaded) return;
    api<Conversation>(`/chat/conversations/${conversationId}`)
      .then((conv) => setThread({ id: conv.id, datasetId: conv.dataset_id, messages: conv.messages }))
      .catch((e: ApiError) => setError(e.message));
  }, [conversationId, threadLoaded]);

  useEffect(() => {
    if (!datasetId) return;
    api<Dataset>(`/datasets/${datasetId}`).then(setDetail).catch(() => undefined);
  }, [datasetId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pending, stage]);

  // Grow the composer with its text (up to ~6 lines).
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const ask = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || pending) return;
      setPending(q);
      setStage(null);
      setError(null);
      setInput("");
      const body = conversationId
        ? { question: q, conversation_id: conversationId }
        : { question: q, dataset_id: datasetId };
      let sawStage = false;
      try {
        let res: AskResponse;
        try {
          res = await askStream(body, (s) => {
            sawStage = true;
            setStage(s);
          });
        } catch (e) {
          // No live progress available (older backend or a buffering proxy): plain request.
          if (!(e instanceof StreamUnavailable) || sawStage) throw e;
          res = await api<AskResponse>("/chat/ask", { json: body });
        }
        setThread((t) => ({
          id: res.conversation_id,
          datasetId,
          messages: [...(t.id === res.conversation_id ? t.messages : []), res.question, res.reply],
        }));
        if (!conversationId) router.replace(`/chat?c=${res.conversation_id}`, { scroll: false });
        api<ConversationSummary[]>("/chat/conversations").then(setConversations).catch(() => undefined);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Something went wrong.");
        setInput(q);
      } finally {
        setPending(null);
        setStage(null);
        inputRef.current?.focus();
      }
    },
    [conversationId, datasetId, pending, router],
  );

  async function removeConversation(id: string) {
    if (!confirm("Delete this conversation?")) return;
    await api(`/chat/conversations/${id}`, { method: "DELETE" }).catch(() => undefined);
    setConversations((cs) => cs.filter((c) => c.id !== id));
    if (id === conversationId) router.replace("/chat");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void ask(input);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void ask(input);
    }
  }

  if (datasets && datasets.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <div className="max-w-sm space-y-4">
          <div className="avatar-orb mx-auto h-14 w-14 text-2xl">✦</div>
          <h2 className="text-xl font-semibold">Upload something to talk about</h2>
          <p className="text-sm text-zinc-500">
            A spreadsheet, a PDF, a Word document or even a photo of a table. Then ask anything.
          </p>
          <Link href="/datasets">
            <Button>Upload a file</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isNew = !conversationId;
  const kind = dataset?.kind ?? "table";
  const suggestions = dataset ? suggestQuestions(dataset.columns, dataset.kind) : [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200 p-3 md:flex dark:border-zinc-800">
        <button
          onClick={() => router.push("/chat")}
          className="mb-3 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium shadow-sm transition hover:border-indigo-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-800"
        >
          <span className="text-indigo-500">✦</span> New chat
        </button>
        <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wide text-zinc-400">Recent</p>
        <div className="space-y-0.5 overflow-y-auto">
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center rounded-lg text-sm transition ${
                c.id === conversationId
                  ? "bg-indigo-50 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-100"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
              }`}
            >
              <Link href={`/chat?c=${c.id}`} className="flex-1 truncate px-3 py-2" title={c.title}>
                {c.title}
              </Link>
              <button
                onClick={() => removeConversation(c.id)}
                className="mr-1 hidden rounded px-1.5 text-zinc-400 hover:text-red-600 group-hover:block"
                aria-label="Delete conversation"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-2.5 text-sm dark:border-zinc-800">
          <span className="text-zinc-500">Talking to</span>
          {isNew && datasets ? (
            <select
              value={datasetId ?? ""}
              onChange={(e) => setChosenDatasetId(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1 font-medium dark:border-zinc-700 dark:bg-zinc-900"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.kind === "document" ? "📄 " : "▦ "}
                  {d.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="font-medium">{dataset?.name ?? "…"}</span>
          )}
          <button
            className="ml-auto rounded-md px-2 py-1 text-zinc-600 hover:bg-zinc-100 md:hidden dark:text-zinc-400 dark:hover:bg-zinc-800"
            onClick={() => router.push("/chat")}
          >
            New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {isNew && messages.length === 0 && !pending && (
              <div className="animate-fade-up pt-8 text-center">
                <div className="avatar-orb mx-auto mb-4 h-14 w-14 text-2xl">✦</div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {dataset ? `What would you like to know about “${dataset.name}”?` : "What would you like to know?"}
                </h1>
                <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
                  {kind === "document"
                    ? "Ask in plain English. Answers quote the document, with the page they came from."
                    : "Ask in plain English. The numbers are computed straight from your data, never guessed."}
                </p>
                {suggestions.length > 0 && (
                  <div className="mt-8 grid gap-2 text-left sm:grid-cols-2">
                    {suggestions.map((s, i) => (
                      <button
                        key={s}
                        onClick={() => ask(s)}
                        className="group flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-800"
                      >
                        <span className="mt-0.5 text-indigo-500 transition group-hover:scale-110">
                          {SUGGESTION_ICONS[i % SUGGESTION_ICONS.length]}
                        </span>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {messages.map((m) =>
              m.role === "user" ? <UserBubble key={m.id} text={m.content} /> : <AssistantTurn key={m.id} message={m} />,
            )}

            {pending && (
              <>
                <UserBubble text={pending} faded />
                <Thinking stage={stage} kind={kind} elapsed={elapsed} />
              </>
            )}
            {error && <ErrorNote>{error}</ErrorNote>}
            <div ref={bottomRef} />
          </div>
        </div>

        <form onSubmit={onSubmit} className="sticky bottom-0 bg-linear-to-t from-[var(--background)] via-[var(--background)] to-transparent px-4 pb-4 pt-2">
          <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-3xl border border-zinc-300 bg-white p-2 pl-4 shadow-lg shadow-indigo-500/5 transition focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 dark:border-zinc-700 dark:bg-zinc-900">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              maxLength={500}
              placeholder={
                isNew
                  ? kind === "document"
                    ? "Ask about the document…"
                    : "Ask anything, e.g. top 10 customers by revenue last quarter"
                  : "Ask a follow-up…"
              }
              className="max-h-40 flex-1 resize-none bg-transparent py-2 text-[15px] outline-none placeholder:text-zinc-400"
              disabled={!datasetId}
              aria-label="Your question"
            />
            <button
              type="submit"
              disabled={!input.trim() || !!pending || !datasetId}
              aria-label="Send"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-linear-to-br from-indigo-600 to-violet-600 text-white shadow transition hover:scale-105 disabled:scale-100 disabled:opacity-40"
            >
              {pending ? <span className="pulse-dot" /> : "↑"}
            </button>
          </div>
          <p className="mx-auto mt-1.5 max-w-3xl text-center text-[11px] text-zinc-400">
            Enter to send · Teach me your words, e.g. “sales means revenue” · Numbers are computed, never invented
          </p>
        </form>
      </section>
    </div>
  );
}
