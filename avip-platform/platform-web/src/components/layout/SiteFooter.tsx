import { Link } from "react-router-dom";
import { site } from "@/content/marketing";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-white">
      <div className="section-shell grid gap-8 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="text-sm font-semibold">{site.name}</div>
          <p className="mt-2 max-w-md text-sm text-[var(--color-muted-foreground)]">
            Automated recovery voice calls for Shopify merchants when fulfillment fails — with
            compliance built in for India.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold">Product</div>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-muted-foreground)]">
            <li>
              <Link to="/request-demo">Try the demo</Link>
            </li>
            <li>
              <Link to="/install">Install</Link>
            </li>
            <li>
              <Link to="/#contact">Contact sales</Link>
            </li>
            <li>
              <Link to="/admin">Operator console</Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold">Legal</div>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-muted-foreground)]">
            <li>
              <Link to="/privacy">Privacy</Link>
            </li>
            <li>
              <Link to="/terms">Terms</Link>
            </li>
            <li>
              <Link to="/compliance">Compliance</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--color-border)] py-4 text-center text-xs text-[var(--color-muted-foreground)]">
        © {new Date().getFullYear()} Vedanova · {site.tagline}
      </div>
    </footer>
  );
}
