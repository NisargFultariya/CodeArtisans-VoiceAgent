import { Outlet } from "react-router-dom";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteNav } from "@/components/layout/SiteNav";

export function MarketingLayout() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <Outlet />
      <SiteFooter />
    </div>
  );
}
