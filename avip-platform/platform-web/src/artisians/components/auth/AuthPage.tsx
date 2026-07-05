import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Brand } from '../ui/Brand';
import { useApp } from '../../context/AppContext';
import type { User } from '../../types';

interface Props {
  mode?: 'login' | 'signup';
}

export const AuthPage: React.FC<Props> = ({ mode: initialMode = 'login' }) => {
  const { setUser, toast } = useApp();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(initialMode);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [suName, setSuName] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPass, setSuPass] = useState('');
  const [signupErr, setSignupErr] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || loginPass.length < 6) {
      setLoginErr('Enter a valid email and a password of at least 6 characters.');
      return;
    }
    setLoginErr('');
    const user: User = { name: 'Priya Sharma', initials: 'PS', email: loginEmail };
    setUser(user);
    setTimeout(() => toast('Welcome back!', 'check-circle-2'), 100);
    navigate('/app/overview');
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suName || !suEmail || suPass.length < 6) {
      setSignupErr('Please fill every field. Password needs at least 6 characters.');
      return;
    }
    setSignupErr('');
    const initials = suName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
    setUser({ name: suName, initials, email: suEmail });
    setTimeout(() => toast(`Account created. Let's deploy your first agent!`, 'sparkles'), 100);
    navigate('/app/overview');
  };

  return (
    <div className="auth-wrap">
      <Link to="/" className="back-to-site"
        style={{ position: 'absolute', top: 24, left: 28, zIndex: 3, color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
        <ArrowLeft size={15} /> Back to site
      </Link>

      <main className="auth-card" id="main-content-auth">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
          <Brand />
        </div>

        {/* Tabs */}
        <div className="auth-tabs-wrap" role="tablist" aria-label="Authentication mode">
          {(['login', 'signup'] as const).map(tab => (
            <button key={tab} className={`auth-tab ${authMode === tab ? 'active' : ''}`}
              role="tab" aria-selected={authMode === tab}
              onClick={() => setAuthMode(tab)}>
              {tab === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        {/* Login Form */}
        {authMode === 'login' && (
          <div role="tabpanel">
            <h1 style={{ fontSize: 19, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>Welcome back</h1>
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-faint)', marginBottom: 22 }}>Log in to your account</p>
            {loginErr && <div className="auth-error" role="alert">{loginErr}</div>}
            <form onSubmit={handleLogin}>
              <div className="field">
                <label className="field-label" htmlFor="loginEmail">Work email</label>
                <input className="input" type="email" id="loginEmail" required placeholder="you@company.com" autoComplete="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="loginPass">Password</label>
                <input className="input" type="password" id="loginPass" required placeholder="••••••••" autoComplete="current-password" value={loginPass} onChange={e => setLoginPass(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary btn-block btn-lg">Log in</button>
            </form>
            <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--text-faint)', marginTop: 16 }}>
              Demo tip: any email + password (6+ chars) works. Don't have an account?{' '}
              <button style={{ color: 'var(--primary-light)', fontWeight: 600 }} onClick={() => setAuthMode('signup')}>Sign up</button>
            </p>
          </div>
        )}

        {/* Signup Form */}
        {authMode === 'signup' && (
          <div role="tabpanel">
            <h1 style={{ fontSize: 19, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>Create your account</h1>
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-faint)', marginBottom: 22 }}>Set up your account in under a minute</p>
            {signupErr && <div className="auth-error" role="alert">{signupErr}</div>}
            <form onSubmit={handleSignup}>
              <div className="field">
                <label className="field-label" htmlFor="suName">Full name</label>
                <input className="input" type="text" id="suName" required placeholder="Priya Sharma" autoComplete="name" value={suName} onChange={e => setSuName(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="suEmail">Work email</label>
                <input className="input" type="email" id="suEmail" required placeholder="you@company.com" autoComplete="email" value={suEmail} onChange={e => setSuEmail(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="suPass">Password</label>
                <input className="input" type="password" id="suPass" required placeholder="At least 6 characters" autoComplete="new-password" value={suPass} onChange={e => setSuPass(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary btn-block btn-lg">Create account</button>
            </form>
            <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--text-faint)', marginTop: 16 }}>
              Already have an account?{' '}
              <button style={{ color: 'var(--primary-light)', fontWeight: 600 }} onClick={() => setAuthMode('login')}>Log in</button>
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
