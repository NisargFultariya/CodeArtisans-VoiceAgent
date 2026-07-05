import { Navigate, Route, Routes, Outlet } from "react-router-dom";
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
import { CompliancePage } from "@/pages/marketing/CompliancePage";
import { DemoPage } from "@/pages/marketing/DemoPage";
import { PrivacyPage } from "@/pages/marketing/PrivacyPage";
import { RequestDemoPage } from "@/pages/marketing/RequestDemoPage";
import { TermsPage } from "@/pages/marketing/TermsPage";

// Artisians UI components
import { AppProvider } from "@/artisians/context/AppContext";
import { LandingPage as NewLandingPage } from "@/artisians/components/landing/LandingPage";
import { AuthPage } from "@/artisians/components/auth/AuthPage";
import { AppLayout } from "@/artisians/routes/AppLayout";
import { ProtectedRoute } from "@/artisians/routes/ProtectedRoute";
import { OverviewScreen } from "@/artisians/components/app/screens/OverviewScreen";
import { CreateAgentScreen } from "@/artisians/components/app/screens/CreateAgentScreen";
import { MyAgentsScreen } from "@/artisians/components/app/screens/MyAgentsScreen";
import { AnalyticsScreen } from "@/artisians/components/app/screens/AnalyticsScreen";
import { CampaignLaunchScreen } from "@/artisians/components/app/screens/CampaignLaunchScreen";
import { CampaignAnalyticsScreen } from "@/artisians/components/app/screens/CampaignAnalyticsScreen";

import "@/artisians/index.css";

export default function App() {
  return (
    <AppProvider>
      <Routes>
        {/* Artisians routes */}
        <Route element={<div className="artisians-theme"><Outlet /></div>}>
          <Route index element={<NewLandingPage />} />
          <Route path="login" element={<AuthPage mode="login" />} />
          <Route path="signup" element={<AuthPage mode="signup" />} />
          <Route element={<ProtectedRoute />}>
            <Route path="app" element={<AppLayout />}>
              <Route index element={<Navigate to="/app/overview" replace />} />
              <Route path="overview" element={<OverviewScreen />} />
              <Route path="create" element={<CreateAgentScreen />} />
              <Route path="agents" element={<MyAgentsScreen />} />
              <Route path="analytics" element={<AnalyticsScreen />} />
              <Route path="campaign/:agentId" element={<CampaignLaunchScreen />} />
              <Route path="campaign-analytics/:agentId" element={<CampaignAnalyticsScreen />} />
            </Route>
          </Route>
        </Route>

        {/* Existing platform-web routes */}
        <Route element={<MarketingLayout />}>
          <Route path="compliance" element={<CompliancePage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="request-demo" element={<RequestDemoPage />} />
          <Route path="try-demo" element={<Navigate to="/request-demo" replace />} />
          <Route path="book-demo" element={<Navigate to="/request-demo" replace />} />
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
    </AppProvider>
  );
}
