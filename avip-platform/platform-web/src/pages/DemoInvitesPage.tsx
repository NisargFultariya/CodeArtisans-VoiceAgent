import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminApi } from "@/lib/api";
import { demoRequestErrorMessage } from "@/components/marketing/DemoRequestSuccess";

export function DemoInvitesPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [requests, setRequests] = useState<
    Awaited<ReturnType<typeof adminApi.demoRequests>>["requests"]
  >([]);

  useEffect(() => {
    adminApi
      .demoRequests(30)
      .then((data) => setRequests(data.requests))
      .catch(() => setRequests([]));
  }, [message]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await adminApi.sendDemoInvite(email);
      setMessage(result.message);
      setEmail("");
    } catch (err) {
      setError(demoRequestErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const demoAccessRows = requests.filter((row) =>
    ["demo-access", "admin-invite", "voice-demo"].includes(row.source),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Voice demo invites</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Send a time-limited magic link to the hold-to-talk demo. Local dev emails appear in
          Mailpit.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send invite</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={onSubmit}>
            <div className="flex-1">
              <label className="text-sm font-medium" htmlFor="invite-email">
                Email
              </label>
              <Input
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="prospect@company.com"
                className="mt-2"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending…" : "Send magic link"}
            </Button>
          </form>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent demo access requests</CardTitle>
        </CardHeader>
        <CardContent>
          {demoAccessRows.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">No invites yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {demoAccessRows.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--color-border)] px-3 py-2"
                >
                  <span className="font-medium">{row.email}</span>
                  <span className="text-[var(--color-muted-foreground)]">
                    {row.source} · {new Date(row.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
