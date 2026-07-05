import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, Bot, BarChart3, Code2,
  Bell, User, LogOut
} from 'lucide-react';
import { Brand } from '../../ui/Brand';
import { useApp } from '../../../context/AppContext';

const notifications = [
  { title: 'Campaign "Renewal Outreach" launched', time: '2 min ago' },
  { title: '14 meetings booked today — new high', time: '3 hrs ago' },
  { title: 'Knowledge source "Salesforce CRM" synced', time: '1 hr ago' },
];

const navItems = [
  { to: '/app/overview',   label: 'Overview',    Icon: LayoutDashboard },
  { to: '/app/create',     label: 'Create Agent', Icon: PlusCircle },
  { to: '/app/agents',     label: 'My Agents',    Icon: Bot },
  { to: '/app/analytics',  label: 'Analytics',    Icon: BarChart3 },
  { to: '/app/sdk',        label: 'SDK & API',    Icon: Code2 },
];

export const TopNav: React.FC = () => {
  const { user, setUser, toast, cancelWizard } = useApp();
  const navigate = useNavigate();
  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
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
        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button className="icon-btn" onClick={() => setNotifOpen(o => !o)} aria-haspopup="true" aria-expanded={notifOpen} aria-label="Notifications, 3 unread" style={{ position: 'relative' }}>
            <Bell size={18} />
            <span style={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', border: '1.5px solid var(--card)' }} aria-hidden />
          </button>
          {notifOpen && (
            <div style={{ position: 'fixed', right: 70, top: 62, width: 320, maxHeight: 400, overflowY: 'auto', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow-lg)', zIndex: 400, padding: 0 }} role="region" aria-label="Notifications">
              <div style={{ padding: '14px 16px', fontWeight: 700, fontSize: 13, borderBottom: '1px solid var(--border)' }}>Notifications</div>
              {notifications.map((n, i) => (
                <div key={i} style={{ padding: '12px 16px', borderBottom: i < notifications.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 12.5 }}>
                  <b style={{ display: 'block' }}>{n.title}</b>
                  <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>{n.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

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
