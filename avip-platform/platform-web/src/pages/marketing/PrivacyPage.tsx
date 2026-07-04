import { site } from "@/content/marketing";

export function PrivacyPage() {
  return (
    <main className="py-16">
      <div className="section-shell max-w-3xl prose-legal">
        <h1 className="text-3xl font-semibold">Privacy policy</h1>
        <p className="mt-2 text-sm">Last updated: June 2026. Placeholder — replace with counsel-reviewed text before launch.</p>
        <h2>What we collect</h2>
        <p>
          Store and order data required to run recovery voice calls, call transcripts and outcomes,
          and Shopify OAuth tokens stored securely for your shop.
        </p>
        <h2>How we use data</h2>
        <p>
          To orchestrate recovery workflows, place outbound calls, log outcomes in your merchant
          app, and maintain compliance audit records.
        </p>
        <h2>Retention</h2>
        <p>
          Operational records and recordings are retained according to your plan and our published
          retention schedule (TBD with legal).
        </p>
        <h2>Contact</h2>
        <p>
          Privacy requests: <a href={`mailto:${site.privacyEmail}`}>{site.privacyEmail}</a>
        </p>
      </div>
    </main>
  );
}
