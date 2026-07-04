import { Link } from "react-router-dom";
import { LampHeader } from "@/components/aceternity/lamp-header";
import { FocusCards } from "@/components/aceternity/focus-cards";
import { compliancePillars } from "@/content/marketing";
import { site } from "@/content/marketing";

export function CompliancePage() {
  return (
    <main className="py-16">
      <div className="section-shell max-w-3xl">
        <LampHeader
          title="Compliance & trust"
          subtitle="How AVIP handles consent, NDR policy, disclosure, and auditability."
          className="text-left"
        />
        <div className="prose-legal mt-10">
          <p>
            AVIP provides automated voice outreach for Shopify merchants. Use is subject to
            applicable telecom regulations in your markets and your own merchant policies.
          </p>
          <h2>Overview</h2>
          <p>
            Recovery calls are placed only when compliance gates pass: valid consent, allowed NDR
            stage, and DND checks. Every gate decision is auditable in the platform database.
          </p>
        </div>
        <div className="mt-10">
          <FocusCards cards={compliancePillars} />
        </div>
        <div className="prose-legal mt-10">
          <h2>TRAI AI disclosure</h2>
          <p>
            The voice agent identifies itself as an automated assistant in the opening seconds of
            every outbound call, before recovery dialogue begins.
          </p>
          <h2>Consent model</h2>
          <ul>
            <li>Checkout or cart consent captured with order linkage and timestamp</li>
            <li>Pre-dial verification via internal compliance API before workflow places a call</li>
            <li>Consent status queryable per shop and order</li>
          </ul>
          <h2>NDR stages</h2>
          <ul>
            <li>NDR-1 and NDR-2: automated AI recovery calls allowed when consent passes</li>
            <li>NDR-3: escalate to human ops — AVIP does not auto-dial</li>
          </ul>
          <h2>Recordings & retention</h2>
          <p>
            Call recordings are stored in object storage with keys linked on the call record.
            Retention policy to be finalized with legal counsel before production launch.
          </p>
          <h2>Contact</h2>
          <p>
            Compliance questions:{" "}
            <a href={`mailto:${site.privacyEmail}`}>{site.privacyEmail}</a>
          </p>
          <p className="text-sm">
            Also see <Link to="/privacy">Privacy</Link> and <Link to="/terms">Terms</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}
