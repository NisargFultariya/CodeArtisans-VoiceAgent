import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopNav } from '../components/app/layout/TopNav';

/**
 * AppLayout: Authenticated layout shell.
 * Renders the persistent TopNav and an <Outlet> for nested route content.
 */
export const AppLayout: React.FC = () => (
  <div style={{ display: 'flex', minHeight: '100vh' }}>
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <TopNav />
      <main style={{ flex: 1 }} id="main-content">
        <Outlet />
      </main>
    </div>
  </div>
);
