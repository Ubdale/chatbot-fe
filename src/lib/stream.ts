// Ask with live progress: the backend streams server-sent events (stages, then the answer).
import { ApiError } from "@/lib/api";
import type { AskResponse } from "@/lib/types";

export type Stage = "planning" | "matching" | "querying" | "summarizing" | "searching" | "reading";

/** The stream endpoint isn't reachable (old backend, proxy): use the plain request. */
export class StreamUnavailable extends Error {}

type Event =
  | { type: "stage"; stage: Stage }
  | { type: "done"; response: AskResponse }
  | { type: "error"; status: number; detail: string };

export async function askStream(
  body: { question: string; dataset_id?: string | null; conversation_id?: string | null },
  onStage: (stage: Stage) => void,
): Promise<AskResponse> {
  let res: Response;
  try {
    res = await fetch("/api/chat/ask/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-AskData-CSRF": "1" },
      body: JSON.stringify(body),
      credentials: "same-origin",
    });
  } catch {
    throw new StreamUnavailable("network");
  }
  if (res.status === 401) {
    const login = new URL("/login", window.location.origin);
    login.searchParams.set("next", window.location.pathname + window.location.search);
    window.location.assign(login.toString());
    throw new ApiError(401, "Your session has expired. Please log in again.");
  }
  if (!res.ok || !res.body) throw new StreamUnavailable(String(res.status));

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let cut: number;
    while ((cut = buffer.indexOf("\n\n")) >= 0) {
      const block = buffer.slice(0, cut);
      buffer = buffer.slice(cut + 2);
      for (const line of block.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const event = JSON.parse(line.slice(6)) as Event;
        if (event.type === "stage") onStage(event.stage);
        else if (event.type === "done") return event.response;
        else throw new ApiError(event.status, event.detail);
      }
    }
  }
  throw new ApiError(0, "The connection dropped before the answer arrived. Please try again.");
}
