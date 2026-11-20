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
  extra_sheets: string[];
};

/** One problem the data doctor found. */
export type DoctorIssue = {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  column: string | null;
  rows: number;
  detail: string;
  examples: string[];
  fixable: boolean;
  fix_label: string | null;
};

export type DoctorReport = { dataset_id: string; version: number; summary: string; issues: DoctorIssue[] };

/** A new version of a table (uploaded or fixed), and what changed. */
export type VersionResult = {
  dataset: Dataset;
  changes: {
    key: string | null;
    added: number;
    removed: number;
    changed: number;
    rows_before: number;
    rows_after: number;
  };
};

/** A scheduled report: questions re-run daily or weekly. */
export type Digest = {
  id: string;
  title: string;
  dataset_id: string;
  dataset_name: string;
  questions: string[];
  cadence: "daily" | "weekly";
  weekday: number;
  hour: number;
  minute: number;
  timezone: string;
  schedule: string;
  recipients: string[];
  active: boolean;
  next_run_at: string;
  last_run_at: string | null;
};

export type DigestRun = {
  id: string;
  digest_id: string;
  digest_title: string;
  created_at: string;
  dataset_version: number;
  content: {
    question: string;
    summary: string;
    columns?: string[];
    rows?: unknown[][];
    truncated?: boolean;
    headline?: number | null;
    previous?: number | null;
    error?: string;
  }[];
  changes: { added: number; removed: number; changed: number } | null;
  emailed: boolean;
  email_note: string | null;
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
    /** Table RAG: how names and topics were matched to the data */
    retrieval_notes?: string[];
  };
  summary_source: "llm" | "template";
  /** a data doctor report, with fixable issues */
  doctor?: { dataset_id: string; version: number; issues: DoctorIssue[] };
  /** answered instantly from an identical earlier question */
  reused?: boolean;
};

export type DocumentAnswer = {
  type: "document";
  /** false: the model's answer couldn't be backed up by the passages and was withheld */
  grounded: boolean;
  sources: { n: number; page: number | null; text: string; cited: boolean }[];
};

export type CodeAnswer = {
  type: "code";
  blocks: { language: string; code: string }[];
};

export type FileAnswer = {
  type: "file";
  format: "xlsx" | "pdf" | "docx" | "pptx" | "csv" | "png";
  message_id: string;
  label: string;
  style?: Record<string, unknown> | null; // formatting asked for in chat
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: "answered" | "clarification" | "failed" | null;
  answer: Answer | DocumentAnswer | CodeAnswer | FileAnswer | null;
  /** 1 helpful, -1 wrong */
  rating?: number | null;
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

export type GlossaryTerm = { id: string; term: string; meaning: string; created_at: string };
