"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { Button, Card, ErrorNote, Input } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { User } from "@/lib/types";

type Member = User;
type Invite = { id: string; email: string; role: string; expires_at: string; token?: string };
type AuditEvent = {
  id: string;
  actor_email: string | null;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
};

const ACTION_LABELS: Record<string, string> = {
  "workspace.created": "created the workspace",
  "user.login": "logged in",
  "invite.created": "invited",
  "invite.revoked": "cancelled the invite for",
  "invite.accepted": "joined",
  "member.role_changed": "changed the role of",
  "member.removed": "removed",
  "password.changed": "changed their password",
  "sessions.revoked": "logged out everywhere",
  "dataset.uploaded": "uploaded",
  "dataset.deleted": "deleted",
  "conversation.deleted": "deleted a conversation",
};

function describe(e: AuditEvent): string {
  const d = e.details ?? {};
  const what = (d.email ?? d.name ?? d.file ?? "") as string;
  const extra = e.action === "member.role_changed" ? ` (${d.old} → ${d.new})` : "";
  return `${ACTION_LABELS[e.action] ?? e.action} ${what}${extra}`.trim();
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-zinc-500">{hint}</p>}
      <div className="mt-4">{children}</div>
    </Card>
  );
}

export function SettingsView() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [newLink, setNewLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const isAdmin = me?.role === "owner" || me?.role === "admin";

  useEffect(() => {
    api<User>("/auth/me").then(setMe).catch(() => undefined);
    api<Member[]>("/workspaces/me/members").then(setMembers).catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!isAdmin) return;
    api<Invite[]>("/workspaces/me/invites").then(setInvites).catch(() => undefined);
    api<AuditEvent[]>("/workspaces/me/audit?limit=50").then(setEvents).catch(() => undefined);
  }, [isAdmin]);

  async function run<T>(action: () => Promise<T>, ok?: string): Promise<T | undefined> {
    setError(null);
    setNotice(null);
    try {
      const result = await action();
      if (ok) setNotice(ok);
      return result;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    }
  }

  async function sendInvite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const created = await run(() =>
      api<Invite>("/workspaces/me/invites", { json: { email: form.get("email"), role: form.get("role") } }),
    );
    if (created?.token) {
      setNewLink(`${window.location.origin}/invite/${created.token}`);
      setInvites((list) => [created, ...list]);
      e.currentTarget.reset();
    }
  }

  async function changeRole(member: Member, role: string) {
    const updated = await run(() => api<Member>(`/workspaces/me/members/${member.id}`, { method: "PATCH", json: { role } }), "Role updated.");
    if (updated) setMembers((list) => list.map((m) => (m.id === updated.id ? updated : m)));
  }

  async function remove(member: Member) {
    if (!confirm(`Remove ${member.email}? They'll be signed out and lose their conversations.`)) return;
    const ok = await run(() => api(`/workspaces/me/members/${member.id}`, { method: "DELETE" }).then(() => true), "Member removed.");
    if (ok) setMembers((list) => list.filter((m) => m.id !== member.id));
  }

  async function changePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const done = await run(
      () => api("/auth/change-password", { json: { current_password: form.get("current"), new_password: form.get("next") } }),
      "Password changed. You've been signed out everywhere else.",
    );
    if (done) e.currentTarget.reset();
  }

  async function logoutEverywhere() {
    if (!confirm("Sign out of every browser and device, including this one?")) return;
    await run(() => api("/auth/logout-everywhere", { method: "POST" }));
    router.replace("/login");
    router.refresh();
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-5 py-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight"><span className="gradient-text">Settings</span></h1>
        <p className="mt-1 text-sm text-zinc-500">Your team, your account and recent activity.</p>
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}
      {notice && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          {notice}
        </p>
      )}

      <Section title="Team" hint="Owners and admins can invite people. Members can upload data and ask questions.">
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {members.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-3 py-2.5">
              <span className="flex-1 text-sm">
                {m.email} {m.id === me?.id && <span className="text-zinc-400">(you)</span>}
              </span>
              {isAdmin && m.id !== me?.id ? (
                <>
                  <select
                    value={m.role}
                    onChange={(e) => changeRole(m, e.target.value)}
                    className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    {me?.role === "owner" && <option value="owner">Owner</option>}
                  </select>
                  <Button variant="danger" onClick={() => remove(m)}>Remove</Button>
                </>
              ) : (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs capitalize text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {m.role}
                </span>
              )}
            </li>
          ))}
        </ul>

        {isAdmin && (
          <>
            <form onSubmit={sendInvite} className="mt-4 flex flex-wrap gap-2">
              <Input name="email" type="email" required placeholder="colleague@company.com" className="max-w-72" />
              <select name="role" className="rounded-lg border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <Button type="submit">Create invite link</Button>
            </form>
            {newLink && (
              <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm dark:border-indigo-900 dark:bg-indigo-950/40">
                <p className="mb-2">Send this link to your colleague. It works once and expires in 7 days.</p>
                <div className="flex gap-2">
                  <code className="flex-1 truncate rounded bg-white px-2 py-1 text-xs dark:bg-zinc-900">{newLink}</code>
                  <Button variant="ghost" onClick={() => navigator.clipboard.writeText(newLink)}>Copy</Button>
                </div>
              </div>
            )}
            {invites.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-zinc-500">
                {invites.map((i) => (
                  <li key={i.id} className="flex items-center gap-2">
                    Waiting for {i.email} ({i.role}) · expires {formatDate(i.expires_at)}
                    <button
                      className="text-red-600 hover:underline"
                      onClick={async () => {
                        await run(() => api(`/workspaces/me/invites/${i.id}`, { method: "DELETE" }));
                        setInvites((list) => list.filter((x) => x.id !== i.id));
                      }}
                    >
                      cancel
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Section>

      <Section title="Security">
        <form onSubmit={changePassword} className="flex flex-wrap gap-2">
          <Input name="current" type="password" required placeholder="Current password" className="max-w-56" autoComplete="current-password" />
          <Input name="next" type="password" required minLength={8} placeholder="New password (8+ characters)" className="max-w-64" autoComplete="new-password" />
          <Button type="submit">Change password</Button>
        </form>
        <div className="mt-4 flex items-center gap-3 text-sm text-zinc-500">
          Lost a device or shared a computer?
          <Button variant="ghost" onClick={logoutEverywhere}>Log out everywhere</Button>
        </div>
      </Section>

      {isAdmin && (
        <Section title="Activity" hint="Who did what in this workspace (latest 50).">
          <ul className="space-y-1.5 text-sm">
            {events.map((e) => (
              <li key={e.id} className="flex gap-3">
                <span className="w-28 shrink-0 tabular-nums text-zinc-400">{formatDate(e.created_at)}</span>
                <span>
                  <span className="font-medium">{e.actor_email ?? "Someone"}</span> {describe(e)}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </main>
  );
}
