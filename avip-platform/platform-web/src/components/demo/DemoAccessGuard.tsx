import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { checkDemoAccess, grantDemoAccess } from "@/lib/demo-api";
import { Loader2 } from "lucide-react";

type DemoAccessGuardProps = {
  children: ReactNode;
};

/**
 * Protects /demo — requires a valid magic-link cookie.
 * Email links land as /demo?access=… which is exchanged for the HttpOnly cookie.
 */
export function DemoAccessGuard({ children }: DemoAccessGuardProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const token = searchParams.get("access");

      if (token) {
        try {
          await grantDemoAccess(token);
          const next = new URLSearchParams(searchParams);
          next.delete("access");
          setSearchParams(next, { replace: true });
        } catch {
          if (!cancelled) {
            navigate("/request-demo?error=invalid-link", { replace: true });
          }
          return;
        }
      }

      const granted = await checkDemoAccess();
      if (cancelled) return;

      if (granted) {
        setState("allowed");
      } else {
        navigate("/request-demo", { replace: true });
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams, setSearchParams]);

  if (state === "loading") {
    return (
      <div className="flex h-dvh items-center justify-center overflow-hidden bg-neutral-950">
        <Loader2 className="size-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (state === "denied") {
    return <Navigate to="/request-demo" replace />;
  }

  return <>{children}</>;
}
