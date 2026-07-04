import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { portalApi } from "@/lib/portal-api";
import { cn } from "@/lib/utils";

const navItems = [{ to: "/portal", label: "Overview", icon: LayoutDashboard, end: true }];

export function PortalLayout() {
  const navigate = useNavigate();

  async function logout() {
    try {
      await portalApi.logout();
    } finally {
      navigate("/portal/login", { replace: true });
    }
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-[var(--color-border)] bg-white lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center border-b border-[var(--color-border)] px-6">
          <div>
            <div className="text-sm font-semibold tracking-wide">AVIP Portal</div>
            <div className="text-xs text-[var(--color-muted-foreground)]">Customer account</div>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:overflow-visible">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "inline-flex min-w-fit items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                    : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
          <div className="hidden lg:block lg:flex-1" />
          <div className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
            <Store className="h-4 w-4" />
            Team & billing soon
          </div>
        </nav>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="flex h-16 items-center justify-end border-b border-[var(--color-border)] bg-white px-6">
          <Button variant="outline" size="sm" onClick={() => void logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
