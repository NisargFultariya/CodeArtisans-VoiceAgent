import { site } from "@/content/marketing";

export function TermsPage() {
  return (
    <main className="py-16">
      <div className="section-shell max-w-3xl prose-legal">
        <h1 className="text-3xl font-semibold">Terms of service</h1>
        <p className="mt-2 text-sm">Last updated: June 2026. Placeholder — replace with counsel-reviewed terms before launch.</p>
        <h2>Service</h2>
        <p>
          AVIP provides automated voice outreach for Shopify merchants when fulfillment fails or
          requires customer confirmation. Use is subject to Shopify&apos;s terms and applicable
          telecom regulations in your markets.
        </p>
        <h2>Merchant responsibilities</h2>
        <p>
          Merchants must obtain valid customer consent, configure allowed NDR stages correctly, and
          respond to escalations routed from AVIP workflows.
        </p>
        <h2>Contact</h2>
        <p>
          Questions: <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
        </p>
      </div>
    </main>
  );
}
