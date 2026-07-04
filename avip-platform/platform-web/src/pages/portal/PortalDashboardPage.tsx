import { useEffect, useState } from "react";
import { portalApi, PortalApiError, type PortalMeResponse, type PortalShopItem } from "@/lib/portal-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

export function PortalDashboardPage() {
  const [me, setMe] = useState<PortalMeResponse | null>(null);
  const [shops, setShops] = useState<PortalShopItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [profile, shopList] = await Promise.all([portalApi.me(), portalApi.shops()]);
        if (!active) return;
        setMe(profile);
        setShops(shopList.shops);
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
          <CardTitle>Connected stores</CardTitle>
          <CardDescription>
            Shopify installations linked to this billing account. Install AVIP from Shopify Admin, then
            sign in here with the same email to claim the store.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {shops.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No stores linked yet. After you install the AVIP app, return here with the same email to
              connect it.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  <TableHead>Shop ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shops.map((shop) => (
                  <TableRow key={shop.id}>
                    <TableCell className="font-medium">{shop.shopDomain}</TableCell>
                    <TableCell className="font-mono text-xs text-[var(--color-muted-foreground)]">
                      {shop.id}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
