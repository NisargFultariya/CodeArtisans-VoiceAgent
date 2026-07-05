import React from 'react';
import { Outlet } from 'react-router-dom';
import { ToastStack } from '../components/ui/Toast';
import { useApp } from '../context/AppContext';

/**
 * RootLayout: wraps every page with the global toast stack.
 * This is the outermost layout in the router tree.
 */
export const RootLayout: React.FC = () => {
  const { toasts } = useApp();
  return (
    <>
      <Outlet />
      <ToastStack toasts={toasts} />
    </>
  );
};
