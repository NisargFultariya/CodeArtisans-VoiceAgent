import { Outlet } from "react-router-dom";

/** Full-screen shell for the live voice demo — no marketing nav or footer. */
export function DemoLayout() {
  return (
    <div className="demo-shell h-dvh overflow-hidden bg-slate-50 text-slate-900">
      <Outlet />
    </div>
  );
}
