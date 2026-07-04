import { Navigate, Route, Routes } from "react-router-dom";
import { RedirectIfAuthed, RequireAuth } from "@/components/auth/AuthGuard";
import { PortalRedirectIfAuthed, PortalRequireAuth } from "@/components/auth/PortalAuthGuard";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { DemoLayout } from "@/components/layout/DemoLayout";
import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { CallsPage } from "@/pages/CallsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { DemoInvitesPage } from "@/pages/DemoInvitesPage";
import { EscalationsPage } from "@/pages/EscalationsPage";
import { LoginPage } from "@/pages/LoginPage";
import { PortalDashboardPage } from "@/pages/portal/PortalDashboardPage";
import { PortalLoginPage } from "@/pages/portal/PortalLoginPage";
import { ShopsPage } from "@/pages/ShopsPage";
import { CompliancePage } from "@/pages/marketing/CompliancePage";
import { DemoPage } from "@/pages/marketing/DemoPage";
import { InstallPage } from "@/pages/marketing/InstallPage";
import { LandingPage } from "@/pages/marketing/LandingPage";
import { PrivacyPage } from "@/pages/marketing/PrivacyPage";
import { RequestDemoPage } from "@/pages/marketing/RequestDemoPage";
import { TermsPage } from "@/pages/marketing/TermsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="compliance" element={<CompliancePage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="request-demo" element={<RequestDemoPage />} />
        <Route path="try-demo" element={<Navigate to="/request-demo" replace />} />
        <Route path="book-demo" element={<Navigate to="/request-demo" replace />} />
        <Route path="install" element={<InstallPage />} />
      </Route>

      <Route element={<DemoLayout />}>
        <Route path="demo" element={<DemoPage />} />
      </Route>

      <Route path="admin">
        <Route element={<RedirectIfAuthed />}>
          <Route path="login" element={<LoginPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="shops" element={<ShopsPage />} />
            <Route path="calls" element={<CallsPage />} />
            <Route path="escalations" element={<EscalationsPage />} />
            <Route path="demo-invites" element={<DemoInvitesPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="portal">
        <Route element={<PortalRedirectIfAuthed />}>
          <Route path="login" element={<PortalLoginPage />} />
        </Route>

        <Route element={<PortalRequireAuth />}>
          <Route element={<PortalLayout />}>
            <Route index element={<PortalDashboardPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
