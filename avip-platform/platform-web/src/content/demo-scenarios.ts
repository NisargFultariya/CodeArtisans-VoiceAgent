export const DEMO_SCENARIOS = [
  {
    value: "landmark",
    label: "Landmark check",
    description: "Fix incomplete addresses — ask for a nearby landmark before dispatch.",
  },
  {
    value: "availability",
    label: "Availability lock",
    description: "Prevent NDR-1/2 — confirm the customer will be home tomorrow 10 AM–5 PM.",
  },
  {
    value: "payment",
    label: "Payment readiness",
    description: "Reduce cash-not-ready fails — confirm cash or UPI before delivery.",
  },
  {
    value: "backup_contact",
    label: "Backup contact",
    description: "Save phone-switched-off orders — collect an alternate number.",
  },
  {
    value: "impulse_modification",
    label: "Order change",
    description: "Catch buyer's remorse — offer size or color change before dispatch.",
  },
  {
    value: "recruitment",
    label: "Recruitment screening",
    description: "AI Recruitment Assistant (Meera) — conduct candidate pre-screening and check qualifications.",
  },
] as const;

export type DemoScenarioId = (typeof DEMO_SCENARIOS)[number]["value"];

export const DEFAULT_DEMO_SCENARIO: DemoScenarioId = "availability";

export function demoScenarioLabel(id: string) {
  return DEMO_SCENARIOS.find((s) => s.value === id)?.label ?? id;
}

export function demoScenarioDescription(id: string) {
  return DEMO_SCENARIOS.find((s) => s.value === id)?.description ?? "";
}
