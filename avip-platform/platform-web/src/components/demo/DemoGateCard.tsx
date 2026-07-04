import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { demoRequestErrorMessage } from "@/components/marketing/DemoRequestSuccess";
import { requestDemoAccess } from "@/lib/marketing-api";
import { CheckCircle2, Mail } from "lucide-react";

export function DemoGateCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    try {
      const result = await requestDemoAccess(String(form.get("email") ?? ""));
      setMessage(result.message);
    } catch (err) {
      setError(demoRequestErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-lg border-white/10 bg-white/95 shadow-2xl backdrop-blur-md">
      <CardHeader className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Voice demo</p>
        <CardTitle className="text-3xl">Try the recovery agent</CardTitle>
        <CardDescription className="text-base leading-relaxed">
          Enter your email and we&apos;ll send a magic link. Open it on this device, pick a scenario
          and language, toggle the mic to speak, and talk with the Soniqa recovery agent.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {message ? (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950">
            <CheckCircle2 className="text-emerald-600" />
            <AlertTitle>{message}</AlertTitle>
            <AlertDescription className="space-y-2 text-emerald-900">
              <p>The link expires in 72 hours. Check spam if you don&apos;t see it within a minute.</p>
              <p className="text-xs">
                Local dev: open{" "}
                <a href="http://127.0.0.1:8025" className="underline" target="_blank" rel="noreferrer">
                  Mailpit
                </a>{" "}
                to read the email.
              </p>
            </AlertDescription>
          </Alert>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              <Mail className="size-4" />
              {loading ? "Sending link…" : "Email me a demo link"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              On Shopify and want a sales walkthrough?{" "}
              <Link to="/#contact" className="text-primary underline-offset-2 hover:underline">
                Contact us
              </Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
