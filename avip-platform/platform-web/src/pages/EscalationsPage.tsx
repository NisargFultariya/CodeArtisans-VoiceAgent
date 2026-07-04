import { useEffect, useState } from "react";
import { adminApi, type AdminEscalationItem, ApiError } from "@/lib/api";
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
import { formatDate } from "@/lib/utils";

export function EscalationsPage() {
  const [escalations, setEscalations] = useState<AdminEscalationItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .escalations()
      .then((response) => setEscalations(response.escalations))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load escalations"),
      );
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Escalations</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Open and resolved issues flagged during recovery calls.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All escalations</CardTitle>
          <CardDescription>{escalations.length} rows loaded</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-[var(--color-destructive)]">{error}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shop</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {escalations.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.shopDomain}</TableCell>
                    <TableCell>{item.orderId}</TableCell>
                    <TableCell>{item.reason ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(item.status)}>{item.status}</Badge>
                    </TableCell>
                    <TableCell>{item.assignee ?? "—"}</TableCell>
                    <TableCell>{formatDate(item.updatedAt)}</TableCell>
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
