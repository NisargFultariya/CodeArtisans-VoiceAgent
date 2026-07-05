import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, Bot, BarChart3,
  User, LogOut
} from 'lucide-react';
import { Brand } from '../../ui/Brand';
import { useApp } from '../../../context/AppContext';

const navItems = [
  { to: '/app/overview',   label: 'Overview',    Icon: LayoutDashboard },
  { to: '/app/create',     label: 'Create Agent', Icon: PlusCircle },
  { to: '/app/agents',     label: 'My Agents',    Icon: Bot },
  { to: '/app/analytics',  label: 'Analytics',    Icon: BarChart3 },
];

export const TopNav: React.FC = () => {
  const { user, setUser, toast, cancelWizard } = useApp();
  const navigate = useNavigate();
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setUserOpen(false);
    setUser(null);
    toast('You have been logged out.', 'log-out');
    navigate('/');
  };

  return (
    <nav className="topnav" aria-label="Application">
      <Brand onClick={() => { cancelWizard(); navigate('/app/overview'); }} />

      {/* Nav Links */}
      <div className="flex items-center gap-0.5 flex-1 overflow-x-auto" role="navigation" aria-label="Sections">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => cancelWizard()}
          >
            <Icon size={16} aria-hidden />{label}
          </NavLink>
        ))}
      </div>

      {/* Nav Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* User Menu */}
        <div ref={userRef} style={{ position: 'relative' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--grad-accent)', color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            onClick={() => setUserOpen(o => !o)} role="button" tabIndex={0} aria-haspopup="true" aria-expanded={userOpen}
            onKeyDown={e => e.key === 'Enter' && setUserOpen(o => !o)}>
            {user?.initials || 'PS'}
          </div>
          {userOpen && (
            <div style={{ position: 'fixed', right: 24, top: 60, width: 200, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow-lg)', zIndex: 400, padding: 8 }} role="menu">
              {[
                { label: 'Profile & settings', Icon: User, action: () => { navigate('/app/settings'); setUserOpen(false); } },
                { label: 'Log out', Icon: LogOut, action: handleLogout },
              ].map(({ label, Icon, action }) => (
                <button key={label} role="menuitem" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 9, fontSize: 13 }}
                  onClick={action}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
