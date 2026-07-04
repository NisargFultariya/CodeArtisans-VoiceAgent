import { useEffect, useState } from "react";
import { adminApi, type AdminDashboardResponse, ApiError } from "@/lib/api";
import { Badge, statusBadgeVariant } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatDuration } from "@/lib/utils";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      {hint ? <CardContent className="text-sm text-[var(--color-muted-foreground)]">{hint}</CardContent> : null}
    </Card>
  );
}

export function DashboardPage() {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .dashboard()
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load dashboard"));
  }, []);

  if (error) {
    return <p className="text-sm text-[var(--color-destructive)]">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Platform-wide overview across all merchant shops.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active shops" value={data.totalShops} />
        <StatCard label="Calls this month" value={data.callsThisMonth} hint={`${data.totalCalls} total`} />
        <StatCard label="Recovery rate" value={data.recoveryRate} hint={`${data.completedCalls} completed`} />
        <StatCard
          label="Open escalations"
          value={data.openEscalations}
          hint={`Avg duration ${formatDuration(Math.round(data.avgDurationSeconds))}`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent calls</CardTitle>
            <CardDescription>Latest recovery attempts across all shops.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shop</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentCalls.map((call) => (
                  <TableRow key={`${call.shopId}-${call.orderId}`}>
                    <TableCell>{call.shopDomain}</TableCell>
                    <TableCell>{call.orderId}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(call.status)}>{call.status}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(call.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent escalations</CardTitle>
            <CardDescription>Issues requiring operator attention.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shop</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentEscalations.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.shopDomain}</TableCell>
                    <TableCell>{item.orderId}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(item.status)}>{item.status}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(item.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
