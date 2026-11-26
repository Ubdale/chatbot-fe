import Link from "next/link";

const FEATURES = [
  { icon: "▦", title: "Ask in plain words", body: "Upload a spreadsheet, PDF, Word doc or a photo of a table, then ask questions in English, Urdu or Roman Urdu." },
  { icon: "∑", title: "Exact answers, never guessed", body: "The AI turns your question into a query; code computes the result from every row — so the numbers are always correct." },
  { icon: "🔎", title: "See the proof", body: "Every number can be opened to the exact rows behind it. Charts, highlights and shares come built in." },
  { icon: "📄", title: "Documents too", body: "Ask a PDF or contract anything — it answers from the relevant passages and cites where each fact came from." },
  { icon: "🔗", title: "Combine & compare", body: "Join two sheets on a shared key, see what changed between uploads, and clean messy data in one click." },
  { icon: "🗓", title: "Scheduled reports", body: "Get the numbers you care about e-mailed every Monday, always recomputed on your latest data." },
];

const STEPS = [
  { n: "1", title: "Upload your data", body: "A spreadsheet, CSV, PDF or image — any file." },
  { n: "2", title: "Ask a question", body: "“Revenue by region”, “overdue tasks by person”, “what changed?”." },
  { n: "3", title: "Get the answer", body: "An exact number, a chart, and a download — in seconds." },
];

export default function Landing() {
  return (
    <main className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      {/* Nav */}
      <header className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">A</span>
        <span className="text-lg font-semibold">AskData</span>
        <nav className="ml-auto flex items-center gap-2 text-sm">
          <Link href="/login" className="rounded-lg px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800">Log in</Link>
          <Link href="/signup" className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500">Try free</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="aurora" aria-hidden />
        <div className="relative z-10 mx-auto max-w-3xl px-5 pb-16 pt-16 text-center sm:pt-24">
          <p className="mb-3 text-sm font-medium text-indigo-500">Chat with your business data</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            <span className="gradient-text">Ask your spreadsheets anything.</span>
            <br />
            Exact answers, no formulas.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
            Upload a file and ask in plain English, Urdu or Roman Urdu. AskData computes the answer from your
            data — it never makes numbers up — and shows you the rows behind every result.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup" className="rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500">
              Try it free — with sample data
            </Link>
            <Link href="/login" className="rounded-xl border border-zinc-300 px-5 py-3 font-medium transition hover:border-indigo-400 dark:border-zinc-700">
              Log in
            </Link>
          </div>
          <p className="mt-4 text-xs text-zinc-500">No credit card. A sample dataset is ready the moment you sign up.</p>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-5 py-14">
        <h2 className="text-center text-2xl font-semibold">How it works</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-zinc-200 bg-white/60 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-600 font-semibold text-white">{s.n}</div>
              <h3 className="mt-3 font-medium">{s.title}</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-5 py-14">
        <h2 className="text-center text-2xl font-semibold">Everything you need to understand your data</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-zinc-200 bg-white/60 p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-2 font-medium">{f.title}</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-3xl px-5 py-10 text-center">
        <div className="rounded-2xl border border-zinc-200 bg-white/60 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
          <h2 className="text-xl font-semibold">Your data stays yours</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
            Answers are computed on a private server — your rows are never used to train anyone’s AI. Each team’s
            data is isolated, every action is logged, and you can delete everything anytime.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-3xl px-5 pb-20 pt-6 text-center">
        <h2 className="text-2xl font-semibold">Ready to ask your data a question?</h2>
        <Link href="/signup" className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500">
          Get started free
        </Link>
      </section>

      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800">
        AskData · Numbers computed from your data, never invented.
      </footer>
    </main>
  );
}
