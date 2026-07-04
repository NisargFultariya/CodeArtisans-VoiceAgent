import { useEffect, useState } from "react";
import { portalApi, PortalApiError, type PortalMeResponse } from "@/lib/portal-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function PortalDashboardPage() {
  const [me, setMe] = useState<PortalMeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const profile = await portalApi.me();
        if (!active) return;
        setMe(profile);
      } catch (err) {
        if (!active) return;
        setError(err instanceof PortalApiError ? err.message : "Failed to load portal");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !me) {
    return <p className="text-sm text-[var(--color-destructive)]">{error ?? "Unable to load account"}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{me.accountName}</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Signed in as {me.email} · {me.role}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome to AVIP Portal</CardTitle>
          <CardDescription>
            Manage your AI Voice Agent settings, outbound calling compliance, and view real-time call performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Use the navigation menu to access outbound logs, configure compliance settings, or trigger new demo calls.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
