"use client";

import { useRef, useState } from "react";

type SpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onend: () => void;
  onerror: () => void;
  start: () => void;
  stop: () => void;
};

/** Voice input using the browser's own speech recognition (no server, free). Hidden
 * where the browser doesn't support it. */
export function MicButton({ onText, disabled }: { onText: (t: string) => void; disabled?: boolean }) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognition | null>(null);

  const Ctor =
    typeof window !== "undefined"
      ? ((window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition; SpeechRecognition?: new () => SpeechRecognition })
          .SpeechRecognition ??
        (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition)
      : undefined;
  if (!Ctor) return null;

  function toggle() {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new Ctor!();
    rec.lang = navigator.language || "en-US";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      const text = Array.from({ length: e.results.length }, (_, i) => e.results[i][0].transcript).join(" ");
      if (text) onText(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      aria-label={listening ? "Stop listening" : "Speak your question"}
      title="Speak your question"
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition disabled:opacity-40 ${
        listening
          ? "bg-red-500 text-white animate-pulse"
          : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      }`}
    >
      🎤
    </button>
  );
}
