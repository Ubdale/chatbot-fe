"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { Button, Card, ErrorNote, Input, Spinner } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

type Info = { email: string; role: string; workspace_name: string };

export function AcceptInvite({ token }: { token: string }) {
  const router = useRouter();
  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Info>(`/auth/invites/${encodeURIComponent(token)}`, { allowUnauthorized: true })
      .then(setInfo)
      .catch((e: ApiError) => setError(e.message));
  }, [token]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/auth/invites/accept", {
        json: { token, password: new FormData(e.currentTarget).get("password") },
        allowUnauthorized: true,
      });
      router.replace("/chat");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="avatar-orb mx-auto mb-3 h-12 w-12 text-xl">✦</div>
          <h1 className="text-xl font-semibold">
            {info ? `Join ${info.workspace_name} on AskData` : "Join your team on AskData"}
          </h1>
          {info && (
            <p className="mt-1 text-sm text-zinc-500">
              You were invited as {info.role === "admin" ? "an admin" : "a member"} ({info.email}).
            </p>
          )}
        </div>
        <Card className="p-6">
          {!info && !error && (
            <p className="flex items-center gap-2 text-sm text-zinc-500"><Spinner /> Checking your invite…</p>
          )}
          {info && (
            <form onSubmit={onSubmit} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Choose a password</span>
                <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
                <span className="text-xs text-zinc-500">At least 8 characters.</span>
              </label>
              <Button type="submit" disabled={busy} className="w-full">
                {busy && <Spinner />} Join workspace
              </Button>
            </form>
          )}
          {error && <ErrorNote>{error}</ErrorNote>}
        </Card>
      </div>
    </main>
  );
}
