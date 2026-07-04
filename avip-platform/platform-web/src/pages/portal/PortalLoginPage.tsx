import { type FormEvent, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { portalApi, PortalApiError } from "@/lib/portal-api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function PortalLoginPage() {
  const [searchParams] = useSearchParams();
  const linkError =
    searchParams.get("error") === "invalid-link"
      ? "This sign-in link is invalid or has expired. Request a new one below."
      : null;

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [error, setError] = useState<string | null>(linkError);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await portalApi.requestLogin(
        email.trim(),
        fullName.trim() || undefined,
        accountName.trim() || undefined,
      );
      setSuccess(response.message);
    } catch (err) {
      setError(err instanceof PortalApiError ? err.message : "Could not send sign-in link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#eef2ff,_#f8fafc_55%)] p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>AVIP Customer Portal</CardTitle>
          <CardDescription>
            Sign in with a magic link to manage your stores, team, and usage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="portal-email">
                Work email
              </label>
              <Input
                id="portal-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="portal-full-name">
                Your name <span className="text-[var(--color-muted-foreground)]">(optional)</span>
              </label>
              <Input
                id="portal-full-name"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="portal-account-name">
                Company name <span className="text-[var(--color-muted-foreground)]">(optional)</span>
              </label>
              <Input
                id="portal-account-name"
                value={accountName}
                onChange={(event) => setAccountName(event.target.value)}
              />
            </div>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {success ? (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            ) : null}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Sending link…" : "Email me a sign-in link"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
