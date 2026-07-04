export const site = {
  name: "Soniqa",
  tagline: "Multilingual voice recovery for Shopify",
  supportEmail: "support@vedanova.com",
  privacyEmail: "privacy@vedanova.com",
  salesEmail: "hello@vedanova.com",
};

export const contactDetails = [
  {
    label: "Sales",
    value: "hello@vedanova.com",
    href: "mailto:hello@vedanova.com",
  },
  {
    label: "Support",
    value: "support@vedanova.com",
    href: "mailto:support@vedanova.com",
  },
  {
    label: "India HQ",
    value: "Mumbai · Remote-first",
  },
] as const;

export const navLinks = [
  { href: "/#product", label: "Product" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/compliance", label: "Compliance" },
  { href: "/#contact", label: "Contact" },
];

export const heroWords = ["failed deliveries", "NDR events", "RTO losses"];

export const stats = [
  { value: "₹150+", label: "Typical cost per failed COD delivery" },
  { value: "24–48h", label: "Window before a shipment becomes RTO" },
  { value: "5+ languages", label: "Hindi, Gujarati, Tamil, Telugu, Marathi & more" },
];

export const timelineSteps = [
  {
    title: "Install",
    description: "Add Soniqa to Shopify and configure language, prompts, and escalation email.",
  },
  {
    title: "Trigger",
    description: "Fulfillment fails or an NDR event fires your Temporal recovery workflow.",
  },
  {
    title: "Call",
    description:
      "The agent places a recovery call with TRAI AI disclosure in the opening seconds.",
  },
  {
    title: "Outcome",
    description: "Confirm, reschedule, or escalate — logged in Shopify and the platform audit trail.",
  },
];

export const bentoFeatures = [
  {
    title: "Multilingual voice agent",
    description:
      "Customers hear their language — not a generic IVR — with Sarvam-powered STT and TTS.",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    title: "Shopify-native",
    description: "Install, configure, and monitor recovery from your embedded admin app.",
    className: "md:col-span-1",
  },
  {
    title: "NDR-aware",
    description: "AI on NDR-1 and NDR-2 only. NDR-3 routes to your ops team automatically.",
    className: "md:col-span-1",
  },
  {
    title: "Compliance by design",
    description: "Checkout consent, DND checks, recordings, and audit schema from day one.",
    className: "md:col-span-2",
  },
  {
    title: "Live browser demo",
    description: "Try the agent before you install — pick a language and speak naturally.",
    className: "md:col-span-1",
  },
];

export const compliancePillars = [
  {
    title: "TRAI disclosure",
    description: "AI identity is disclosed in the opening seconds of every outbound call.",
  },
  {
    title: "Consent",
    description: "Checkout consent is captured with timestamp and order linkage before any dial.",
  },
  {
    title: "NDR policy",
    description: "Automated calls only at NDR-1 and NDR-2. NDR-3 escalates — no AI dial.",
  },
  {
    title: "Audit & recordings",
    description: "Call outcomes, compliance events, and recording storage with retention policy.",
  },
];

export const faqs = [
  {
    question: "Which delivery failures trigger a call?",
    answer:
      "NDR-1 and NDR-2 events in your workflow, configurable per shop. Soniqa does not auto-dial on NDR-3.",
  },
  {
    question: "Is customer consent required?",
    answer:
      "Yes. A pre-dial gate checks consent and DND status before any outbound recovery call is placed.",
  },
  {
    question: "What languages are supported?",
    answer:
      "Hindi, Gujarati, Tamil, Telugu, Marathi, and more — try the live demo to hear the agent.",
  },
  {
    question: "Where is call data stored?",
    answer:
      "Operational data in PostgreSQL, recordings in object storage. See our Compliance page for details.",
  },
];
