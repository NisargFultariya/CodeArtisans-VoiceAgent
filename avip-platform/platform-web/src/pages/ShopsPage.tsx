import { useEffect, useState } from "react";
import { adminApi, type AdminShopItem, ApiError } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export function ShopsPage() {
  const [shops, setShops] = useState<AdminShopItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .shops()
      .then((response) => setShops(response.shops))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load shops"));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Shops</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Installed Shopify merchants connected to AVIP.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All shops</CardTitle>
          <CardDescription>{shops.length} active merchant{shops.length === 1 ? "" : "s"}</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-[var(--color-destructive)]">{error}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Installed</TableHead>
                  <TableHead>Calls</TableHead>
                  <TableHead>Shop ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shops.map((shop) => (
                  <TableRow key={shop.id}>
                    <TableCell className="font-medium">{shop.shopDomain}</TableCell>
                    <TableCell>{formatDate(shop.installedAt)}</TableCell>
                    <TableCell>{shop.callCount}</TableCell>
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
