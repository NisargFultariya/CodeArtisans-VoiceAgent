import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PipelineStepId, StepState } from "@/hooks/useDemoPipeline";
import { Check, Circle, X } from "lucide-react";

const STEPS: Array<{
  id: PipelineStepId;
  label: string;
  detail: string;
  badge?: string;
}> = [
  {
    id: "trigger",
    label: "Call triggered",
    detail: "Fulfillment error starts recovery workflow",
  },
  {
    id: "shopify",
    label: "Order from Shopify",
    detail: "Customer, phone, and order context loaded",
    badge: "Simulated",
  },
  {
    id: "dispatch",
    label: "Voice agent dispatched",
    detail: "LiveKit room and recovery agent join",
  },
  {
    id: "reach",
    label: "Reach customer",
    detail: "Production: PSTN dial · Demo: your browser (WebRTC)",
    badge: "Browser demo",
  },
  {
    id: "conversation",
    label: "Recovery conversation",
    detail: "Agent confirms reason and next steps",
  },
  {
    id: "writeback",
    label: "Update Shopify",
    detail: "Attempt and notes written to the order",
    badge: "Simulated",
  },
];

function StepIcon({ state }: { state: StepState }) {
  if (state === "done") return <Check className="size-3.5 text-emerald-600" />;
  if (state === "error") return <X className="size-3.5 text-destructive" />;
  if (state === "active") return <Circle className="size-3.5 fill-primary text-primary" />;
  return <Circle className="size-3.5 text-muted-foreground/40" />;
}

type DemoFlowSidebarProps = {
  stepStates: Record<PipelineStepId, StepState>;
  phase: string;
};

export function DemoFlowSidebar({ stepStates, phase }: DemoFlowSidebarProps) {
  return (
    <Card className="h-fit lg:sticky lg:top-24">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Production flow</CardTitle>
        <CardDescription>What happens when fulfillment fails in your store</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4" data-phase={phase}>
          {STEPS.map((step, index) => {
            const state = stepStates[step.id];
            return (
              <li key={step.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full border",
                      state === "active" && "border-primary bg-primary/10",
                      state === "done" && "border-emerald-200 bg-emerald-50",
                      state === "error" && "border-destructive/30 bg-destructive/10",
                      state === "pending" && "border-border bg-muted/50",
                    )}
                  >
                    <StepIcon state={state} />
                  </div>
                  {index < STEPS.length - 1 ? (
                    <div
                      className={cn(
                        "my-1 w-px flex-1 min-h-4",
                        state === "done" ? "bg-emerald-300" : "bg-border",
                      )}
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{step.label}</span>
                    {step.badge ? (
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                        {step.badge}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="mt-6 text-xs text-muted-foreground">
          Live demo uses WebRTC in your browser; production calls the customer&apos;s phone.
        </p>
      </CardContent>
    </Card>
  );
}
