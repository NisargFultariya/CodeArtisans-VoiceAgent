import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { validateAdminSession } from "@/lib/admin-session";
import { isAuthenticated } from "@/lib/auth";

export function RequireAuth() {
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    let active = true;
    (async () => {
      if (!isAuthenticated()) {
        if (active) setState("denied");
        return;
      }
      const valid = await validateAdminSession();
      if (active) setState(valid ? "ok" : "denied");
    })();
    return () => {
      active = false;
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--color-muted-foreground)]">
        Verifying session…
      </div>
    );
  }
  if (state === "denied") {
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
}

export function RedirectIfAuthed() {
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      return;
    }
    let active = true;
    validateAdminSession().then((valid) => {
      if (active && valid) setRedirect(true);
    });
    return () => {
      active = false;
    };
  }, []);

  if (redirect) {
    return <Navigate to="/admin" replace />;
  }
  return <Outlet />;
}
