import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { grantPortalAccess } from "@/lib/portal-api";
import { validatePortalSession } from "@/lib/portal-session";
import { Loader2 } from "lucide-react";

type PortalAccessGuardProps = {
  children: ReactNode;
};

/** Exchanges /portal?access=… for an HttpOnly session cookie, then allows the portal shell. */
export function PortalAccessGuard({ children }: PortalAccessGuardProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const token = searchParams.get("access");

      if (token) {
        try {
          await grantPortalAccess(token);
          const next = new URLSearchParams(searchParams);
          next.delete("access");
          setSearchParams(next, { replace: true });
        } catch {
          if (!cancelled) {
            navigate("/portal/login?error=invalid-link", { replace: true });
          }
          return;
        }
      }

      const valid = await validatePortalSession();
      if (cancelled) return;
      setState(valid ? "allowed" : "denied");
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams, setSearchParams]);

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#eef2ff,_#f8fafc_55%)]">
        <Loader2 className="size-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (state === "denied") {
    return <Navigate to="/portal/login" replace />;
  }

  return <>{children}</>;
}

export function PortalRedirectIfAuthed() {
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    let active = true;
    validatePortalSession().then((valid) => {
      if (active && valid) setRedirect(true);
    });
    return () => {
      active = false;
    };
  }, []);

  if (redirect) {
    return <Navigate to="/portal" replace />;
  }
  return <Outlet />;
}

export function PortalRequireAuth() {
  return (
    <PortalAccessGuard>
      <Outlet />
    </PortalAccessGuard>
  );
}
