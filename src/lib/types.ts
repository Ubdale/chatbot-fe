// Mirrors the FastAPI response schemas (app/schemas/*.py).

export type User = {
  id: string;
  email: string;
  role: string;
  workspace_id: string;
  created_at: string;
};

export type ColumnKind = "number" | "text" | "date" | "datetime" | "boolean";

export type Column = {
  name: string;
  type: string;
  kind: ColumnKind;
  null_count: number;
  distinct_count: number;
  samples: unknown[];
  min: unknown;
  max: unknown;
};

export type DatasetSummary = {
  id: string;
  name: string;
  original_filename: string;
  file_format: "csv" | "xlsx";
  sheet_name: string | null;
  size_bytes: number;
  row_count: number;
  version: number;
  /** "table": answers computed with SQL. "document": answers quoted from the text. */
  kind: "table" | "document";
  /** "ai_vision" when an AI model read the table from an image: ask users to check it. */
  extraction: string | null;
  created_at: string;
};

export type Dataset = DatasetSummary & { columns: Column[] };

export type UploadResult = Dataset & {
  sheet_names: string[];
  detected_encoding: string | null;
};

export type Preview = {
  dataset_id: string;
  columns: string[];
  rows: unknown[][];
  row_count: number;
};

export type Chart = {
  type: "bar" | "line" | "pie";
  x: string;
  y: string;
  series: string | null;
};

export type Answer = {
  type?: "table";
  table: { columns: string[]; rows: unknown[][]; truncated: boolean };
  chart: Chart | null;
  explanation: {
    description: string;
    sql: string;
    params: unknown[];
    date_range: { start: string; end: string; label: string } | null;
    plan: Record<string, unknown>;
    cached: boolean;
    elapsed_ms: number;
    data_note?: string | null;
  };
  summary_source: "llm" | "template";
};

export type DocumentAnswer = {
  type: "document";
  /** false: the model's answer couldn't be backed up by the passages and was withheld */
  grounded: boolean;
  sources: { n: number; page: number | null; text: string; cited: boolean }[];
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: "answered" | "clarification" | "failed" | null;
  answer: Answer | DocumentAnswer | null;
  created_at: string;
};

export type ConversationSummary = {
  id: string;
  title: string;
  dataset_id: string;
  created_at: string;
  updated_at: string;
};

export type Conversation = ConversationSummary & { messages: Message[] };

export type AskResponse = {
  conversation_id: string;
  question: Message;
  reply: Message;
};
