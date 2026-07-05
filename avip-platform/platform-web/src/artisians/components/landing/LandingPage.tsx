import React, { useState, useEffect } from 'react';
import { PhoneCall, Plus, Play, Sparkles, CheckCircle2, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Brand } from '../ui/Brand';
import { MiniWave } from '../ui/MiniWave';
import { FeaturesSection } from './FeaturesSection';
import { SolutionsSection } from './SolutionsSection';
import { HowItWorksSection } from './HowItWorksSection';
import { DeveloperSection } from './DeveloperSection';
import { CtaSection } from './CtaSection';
import { LandingFooter } from './LandingFooter';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [callTime, setCallTime] = useState(134);

  useEffect(() => {
    const timer = setInterval(() => setCallTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const fmtTime = (t: number) => {
    const m = String(Math.floor(t / 60)).padStart(2, '0');
    const s = String(t % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="landing">
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <header className="land-nav">
        <Brand onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
        <nav className="land-nav-links" aria-label="Primary">
          <a href="#features">Product</a>
          <a href="#solutions">Solutions</a>
          <a href="#how">How it works</a>
          <a href="#sdk-preview">Developers</a>
        </nav>
        <div className="land-nav-actions">

          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>Log in</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/signup')}>
            <Sparkles size={14} aria-hidden="true" />Get started
          </button>
        </div>
      </header>

      <main id="main-content">
        <section className="land-hero">
          <div className="land-hero-inner">
            <div>
              <span className="land-hero-badge">
                <PhoneCall size={13} aria-hidden="true" style={{ marginRight: 6 }} />Inbound + Outbound AI Voice Agents
              </span>
              <h1>Give every conversation a voice that <em>never clocks out</em></h1>
              <p>Launch AI voice agents that call your leads, answer your customers, and work every queue in between — configured in minutes, monitored in real time, built for teams managing many brands from one place.</p>
              <div className="land-hero-actions">
                <button className="btn btn-accent btn-lg test" onClick={() => navigate('/signup')}>
                  <Plus size={15} aria-hidden="true" />Create your first agent
                </button>
                <button className="btn btn-ghost btn-lg" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>
                  <Play size={15} aria-hidden="true" />See how it works
                </button>
              </div>
              <div className="land-hero-proof">
                <div><b>4.2M+</b><span>calls handled monthly</span></div>
                <div><b>118</b><span>tenants live today</span></div>
                <div><b>99.95%</b><span>platform uptime</span></div>
              </div>
            </div>
            <div className="land-hero-visual">
              <div className="float-card f1">
                <CheckCircle2 size={16} style={{ color: 'var(--success-bg)' }} aria-hidden="true" />
                <div><b>Meeting booked</b><span>Outbound · Sales agent</span></div>
              </div>
              <div className="phone-mock">
                <div className="phone-mock-top">
                  <span>● Live call</span>
                  <span id="landCallTimer">{fmtTime(callTime)}</span>
                </div>
                <MiniWave />
                <div className="phone-line"><span>Agent</span><b>Renewal Outreach — Priya</b></div>
                <div className="phone-line"><span>Sentiment</span><b style={{ color: '#7CF5A0' }}>Positive</b></div>
                <div className="phone-line"><span>Disposition</span><b>Meeting booked</b></div>
              </div>
              <div className="float-card f2">
                <Database size={16} style={{ color: 'var(--primary-light)' }} aria-hidden="true" />
                <div><b>Knowledge synced</b><span>Salesforce · 2 min ago</span></div>
              </div>
            </div>
          </div>
        </section>

        <FeaturesSection />
        <SolutionsSection />
        <HowItWorksSection />
        <DeveloperSection />
        <CtaSection />
      </main>

      <LandingFooter />
    </div>
  );
};
