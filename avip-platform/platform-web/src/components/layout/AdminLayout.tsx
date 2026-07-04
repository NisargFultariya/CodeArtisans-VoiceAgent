import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Mail, PhoneCall, Store, TriangleAlert, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearSession, getUsername } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/shops", label: "Shops", icon: Store },
  { to: "/admin/calls", label: "Calls", icon: PhoneCall },
  { to: "/admin/demo-invites", label: "Demo invites", icon: Mail },
  { to: "/admin/escalations", label: "Escalations", icon: TriangleAlert },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const username = getUsername() ?? "admin";

  function logout() {
    clearSession();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-[var(--color-border)] bg-white lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center border-b border-[var(--color-border)] px-6">
          <div>
            <div className="text-sm font-semibold tracking-wide">AVIP Platform</div>
            <div className="text-xs text-[var(--color-muted-foreground)]">Operator console</div>
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
        </nav>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-white px-6">
          <div className="text-sm text-[var(--color-muted-foreground)]">
            Signed in as <span className="font-medium text-[var(--color-foreground)]">{username}</span>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
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
