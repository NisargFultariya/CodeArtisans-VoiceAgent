import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LandingPage }        from '../components/landing/LandingPage';
import { AuthPage }           from '../components/auth/AuthPage';
import { RootLayout }         from './RootLayout';
import { AppLayout }          from './AppLayout';
import { ProtectedRoute }     from './ProtectedRoute';
import { OverviewScreen }        from '../components/app/screens/OverviewScreen';
import { CreateAgentScreen }     from '../components/app/screens/CreateAgentScreen';
import { MyAgentsScreen }        from '../components/app/screens/MyAgentsScreen';
import { AnalyticsScreen }       from '../components/app/screens/AnalyticsScreen';
import { SdkScreen }             from '../components/app/screens/SdkScreen';
import { CampaignLaunchScreen }  from '../components/app/screens/CampaignLaunchScreen';
import { CampaignAnalyticsScreen } from '../components/app/screens/CampaignAnalyticsScreen';

export const router = createBrowserRouter([
  {
    // RootLayout wraps everything so toasts render on every page
    element: <RootLayout />,
    children: [
      // ─── Public routes ─────────────────────────────────────────────────────
      { path: '/',       element: <LandingPage /> },
      { path: '/login',  element: <AuthPage mode="login" /> },
      { path: '/signup', element: <AuthPage mode="signup" /> },

      // ─── Protected routes (require login) ──────────────────────────────────
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/app',
            element: <AppLayout />,
            children: [
              { index: true,             element: <Navigate to="/app/overview" replace /> },
              { path: 'overview',        element: <OverviewScreen /> },
              { path: 'create',          element: <CreateAgentScreen /> },
              { path: 'agents',          element: <MyAgentsScreen /> },
              { path: 'analytics',       element: <AnalyticsScreen /> },
              { path: 'sdk',             element: <SdkScreen /> },
              { path: 'campaign/:agentId', element: <CampaignLaunchScreen /> },
              { path: 'campaign-analytics/:agentId', element: <CampaignAnalyticsScreen /> },
            ],
          },
        ],
      },

      // ─── Fallback ──────────────────────────────────────────────────────────
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
