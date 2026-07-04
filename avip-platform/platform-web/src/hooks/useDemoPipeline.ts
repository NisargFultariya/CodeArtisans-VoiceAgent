import { useCallback, useState } from "react";

export type PipelineStepId =
  | "trigger"
  | "shopify"
  | "dispatch"
  | "reach"
  | "conversation"
  | "writeback";

export type StepState = "pending" | "active" | "done" | "error";

const STEPS: PipelineStepId[] = [
  "trigger",
  "shopify",
  "dispatch",
  "reach",
  "conversation",
  "writeback",
];

export function useDemoPipeline() {
  const [stepStates, setStepStates] = useState<Record<PipelineStepId, StepState>>(
    () => Object.fromEntries(STEPS.map((id) => [id, "pending"])) as Record<PipelineStepId, StepState>,
  );
  const [phase, setPhase] = useState<"idle" | "live" | "complete" | "error">("idle");

  const reset = useCallback(() => {
    setPhase("idle");
    setStepStates(Object.fromEntries(STEPS.map((id) => [id, "pending"])) as Record<PipelineStepId, StepState>);
  }, []);

  const setProgress = useCallback((activeIndex: number) => {
    setStepStates(
      Object.fromEntries(
        STEPS.map((id, i) => {
          if (i < activeIndex) return [id, "done"];
          if (i === activeIndex) return [id, "active"];
          return [id, "pending"];
        }),
      ) as Record<PipelineStepId, StepState>,
    );
  }, []);

  const pipeline = {
    onStart: () => {
      setPhase("live");
      setProgress(0);
    },
    onSessionCreated: () => setProgress(2),
    onConnecting: () => {
      setStepStates({
        trigger: "done",
        shopify: "done",
        dispatch: "done",
        reach: "active",
        conversation: "pending",
        writeback: "pending",
      });
      setPhase("live");
    },
    onAgentJoined: () => {
      setStepStates({
        trigger: "done",
        shopify: "done",
        dispatch: "done",
        reach: "done",
        conversation: "active",
        writeback: "pending",
      });
    },
    onComplete: () => {
      setPhase("complete");
      setStepStates(Object.fromEntries(STEPS.map((id) => [id, "done"])) as Record<PipelineStepId, StepState>);
    },
    onError: (stepId?: PipelineStepId) => {
      setPhase("error");
      const idx = STEPS.indexOf(stepId ?? "dispatch");
      setStepStates(
        Object.fromEntries(
          STEPS.map((id, i) => {
            if (i < idx) return [id, "done"];
            if (i === idx) return [id, "error"];
            return [id, "pending"];
          }),
        ) as Record<PipelineStepId, StepState>,
      );
    },
    onStop: () => reset(),
  };

  return { stepStates, phase, pipeline, reset };
}
