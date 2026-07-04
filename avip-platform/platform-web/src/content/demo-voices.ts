/** Sarvam bulbul:v3 speakers — curated for the Soniqa demo. */
export const DEMO_VOICES = [
  { value: "priya", label: "Priya", description: "Warm, natural (default)" },
  { value: "ishita", label: "Ishita", description: "Clear and confident" },
  { value: "ritu", label: "Ritu", description: "Friendly conversational" },
  { value: "neha", label: "Neha", description: "Professional" },
  { value: "kavya", label: "Kavya", description: "Calm and reassuring" },
  { value: "shreya", label: "Shreya", description: "Upbeat" },
] as const;

export type DemoVoiceId = (typeof DEMO_VOICES)[number]["value"];

export const DEFAULT_DEMO_VOICE: DemoVoiceId = "priya";

export function demoVoiceLabel(id: string) {
  return DEMO_VOICES.find((v) => v.value === id)?.label ?? id;
}
