import { type FormEvent, useState } from "react";
import { LampHeader } from "@/components/aceternity/lamp-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function InstallPage() {
  const [shop, setShop] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const normalized = shop.trim().toLowerCase().replace(/\.myshopify\.com$/, "");
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(normalized)) {
      setError("Enter a valid Shopify subdomain (letters, numbers, hyphens).");
      return;
    }
    setError(null);
    window.location.href = `/oauth/shopify?shop=${encodeURIComponent(`${normalized}.myshopify.com`)}`;
  }

  return (
    <main className="py-16">
      <div className="section-shell max-w-xl">
        <LampHeader
          title="Install on Shopify"
          subtitle="Enter your store subdomain to continue to Shopify OAuth."
          className="text-left"
        />
        <form className="mt-10 space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-medium" htmlFor="shop">
              Store subdomain
            </label>
            <div className="mt-2 flex overflow-hidden rounded-md border border-[var(--color-border)]">
              <Input
                id="shop"
                value={shop}
                onChange={(event) => setShop(event.target.value)}
                className="border-0 focus-visible:ring-0"
                placeholder="your-store"
                required
              />
              <span className="flex items-center bg-[var(--color-muted)] px-3 text-sm text-[var(--color-muted-foreground)]">
                .myshopify.com
              </span>
            </div>
          </div>
          {error ? <p className="text-sm text-[var(--color-destructive)]">{error}</p> : null}
          <p className="text-xs text-[var(--color-muted-foreground)]">
            OAuth callback: <code>/oauth/shopify/callback</code> (wire-up pending on platform API)
          </p>
          <Button type="submit" className="w-full">
            Continue to Shopify
          </Button>
        </form>
      </div>
    </main>
  );
}
