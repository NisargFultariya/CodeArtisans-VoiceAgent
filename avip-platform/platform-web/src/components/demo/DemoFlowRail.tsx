import { cn } from "@/lib/utils";
import type { PipelineStepId, StepState } from "@/hooks/useDemoPipeline";
import { Check, Circle, X } from "lucide-react";

const STEPS: Array<{ id: PipelineStepId; label: string; badge?: string }> = [
  { id: "trigger", label: "Triggered" },
  { id: "shopify", label: "Shopify", badge: "Sim" },
  { id: "dispatch", label: "Dispatch" },
  { id: "reach", label: "Reach", badge: "Browser" },
  { id: "conversation", label: "Talk", badge: "Scenario" },
  { id: "writeback", label: "Writeback", badge: "Sim" },
];

function StepDot({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 ring-1 ring-emerald-300">
        <Check className="size-3 text-emerald-600" />
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="flex size-6 items-center justify-center rounded-full bg-red-100 ring-1 ring-red-300">
        <X className="size-3 text-red-600" />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="flex size-6 items-center justify-center rounded-full bg-indigo-100 ring-2 ring-indigo-400">
        <Circle className="size-2 fill-indigo-500 text-indigo-500" />
      </span>
    );
  }
  return (
    <span className="flex size-6 items-center justify-center rounded-full bg-slate-100 ring-1 ring-slate-200">
      <Circle className="size-2 text-slate-300" />
    </span>
  );
}

type DemoFlowRailProps = {
  stepStates: Record<PipelineStepId, StepState>;
};

export function DemoFlowRail({ stepStates }: DemoFlowRailProps) {
  return (
    <div className="shrink-0 border-b border-slate-100 bg-slate-50/60 px-3 py-3 md:px-5">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
        What happens in production
      </p>
      <div className="flex items-center justify-between gap-1">
        {STEPS.map((step, index) => {
          const state = stepStates[step.id];
          return (
            <div key={step.id} className="flex min-w-0 flex-1 items-center gap-1">
              <div className="flex shrink-0 flex-col items-center gap-1">
                <StepDot state={state} />
                <span
                  className={cn(
                    "max-w-[4.5rem] truncate text-center text-[10px] font-medium text-slate-500",
                    state === "active" && "text-indigo-600",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 ? (
                <div
                  className={cn(
                    "mx-1 h-px min-w-3 flex-1",
                    state === "done" ? "bg-emerald-300" : "bg-slate-200",
                  )}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
