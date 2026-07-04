import { useEffect, useState } from "react";
import { adminApi, type AdminCallItem, ApiError } from "@/lib/api";
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
import { Play, FileText, ChevronDown, ChevronUp } from "lucide-react";

type OutboundCallItem = {
  id: string;
  phoneNumber: string | null;
  status: string;
  scenario: string | null;
  language: string | null;
  voice: string | null;
  mode: string;
  duration: number | null;
  recordingUrl: string | null;
  transcript: string | null;
  createdAt: string;
};

export function CallsPage() {
  const [activeTab, setActiveTab] = useState<"shopify" | "manual">("manual");
  const [shopifyCalls, setShopifyCalls] = useState<AdminCallItem[]>([]);
  const [manualCalls, setManualCalls] = useState<OutboundCallItem[]>([]);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    if (activeTab === "shopify") {
      adminApi
        .calls()
        .then((response) => setShopifyCalls(response.calls))
        .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load Shopify calls"))
        .finally(() => setLoading(false));
    } else {
      fetch("/api/calls")
        .then((res) => res.json())
        .then((data) => setManualCalls(data))
        .catch(() => setError("Failed to load manual calls"))
        .finally(() => setLoading(false));
    }
  }, [activeTab]);

  const toggleExpand = (callId: string) => {
    setExpandedCallId(expandedCallId === callId ? null : callId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Calls Log</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            History of recovery and custom outbound voice calls.
          </p>
        </div>
        
        <div className="inline-flex rounded-xl bg-slate-100 p-1 shadow-inner">
          <button
            onClick={() => setActiveTab("manual")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === "manual" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Manual Dial
          </button>
          <button
            onClick={() => setActiveTab("shopify")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === "shopify" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Shopify Orders
          </button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{activeTab === "manual" ? "Manual Outbound Calls" : "Shopify Recovery Calls"}</CardTitle>
          <CardDescription>
            {loading ? "Loading calls..." : `${activeTab === "manual" ? manualCalls.length : shopifyCalls.length} rows loaded`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-[var(--color-destructive)]">{error}</p>
          ) : activeTab === "manual" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone / Mode</TableHead>
                  <TableHead>Scenario</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Recording</TableHead>
                  <TableHead>Transcript</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {manualCalls.map((call) => {
                  const isExpanded = expandedCallId === call.id;
                  return (
                    <>
                      <TableRow key={call.id} className={isExpanded ? "border-b-0 bg-slate-50/40" : ""}>
                        <TableCell>
                          <div className="font-semibold text-slate-900">{call.phoneNumber || "Browser Demo"}</div>
                          <div className="text-[11px] text-slate-500 capitalize">{call.mode} · {call.language}</div>
                        </TableCell>
                        <TableCell className="capitalize">{call.scenario}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(call.status.toLowerCase())}>{call.status}</Badge>
                        </TableCell>
                        <TableCell>{formatDuration(call.duration)}</TableCell>
                        <TableCell>
                          {call.recordingUrl ? (
                            <a 
                              href={call.recordingUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-medium"
                            >
                              <Play className="size-3.5" /> Play
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {call.transcript ? (
                            <button
                              onClick={() => toggleExpand(call.id)}
                              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-medium"
                            >
                              <FileText className="size-3.5" /> 
                              {isExpanded ? "Hide" : "View"}
                              {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                      {isExpanded && call.transcript && (
                        <TableRow key={`${call.id}-details`} className="bg-slate-50/40 hover:bg-slate-50/40">
                          <TableCell colSpan={6} className="px-6 py-4 border-t border-slate-100">
                            <div className="rounded-xl border border-slate-200 bg-white p-4 max-w-3xl">
                              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Conversation Transcript</h4>
                              <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                                {call.transcript.split("\n").filter(Boolean).map((line, index) => {
                                  const isAgent = line.startsWith("[agent]") || line.includes("agent:");
                                  const isSystem = line.startsWith("[system]") || line.includes("system:");
                                  
                                  let cleanLine = line.replace(/^\[(agent|user|system)\]\s*/i, "");
                                  cleanLine = cleanLine.replace(/^(agent|you|system):\s*/i, "");

                                  return (
                                    <div
                                      key={index}
                                      className={`flex flex-col max-w-[85%] rounded-2xl px-4 py-2 text-xs leading-relaxed ${
                                        isAgent ? "bg-indigo-50 text-indigo-950 mr-auto rounded-tl-none" :
                                        isSystem ? "bg-amber-50 text-amber-900 mx-auto text-center border border-amber-100" :
                                        "bg-slate-100 text-slate-900 ml-auto rounded-tr-none"
                                      }`}
                                    >
                                      <span className="text-[9px] font-bold opacity-60 mb-0.5 uppercase">
                                        {isAgent ? "SONIQA (AGENT)" : isSystem ? "SYSTEM" : "RECIPIENT"}
                                      </span>
                                      <span>{cleanLine}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shop</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shopifyCalls.map((call) => (
                  <TableRow key={`${call.shopId}-${call.orderId}`}>
                    <TableCell>{call.shopDomain}</TableCell>
                    <TableCell>{call.orderId}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(call.status)}>{call.status}</Badge>
                    </TableCell>
                    <TableCell>{call.outcome ?? "—"}</TableCell>
                    <TableCell>{formatDuration(call.durationSeconds)}</TableCell>
                    <TableCell>{formatDate(call.updatedAt)}</TableCell>
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
