import React from 'react';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SolutionsSection: React.FC = () => {
  const navigate = useNavigate();
  return (
    <section className="land-section" id="solutions" style={{ paddingTop: 0 }}>
      <div className="land-section-inner">
        <div className="land-dual">
          {/* OUTBOUND */}
          <div className="card dual-card outbound">
            <span className="badge" style={{ background: 'rgba(255,255,255,0.16)', color: '#fff' }}>OUTBOUND</span>
            <h3 style={{ marginTop: 14 }}>Campaigns that dial for you</h3>
            <p>Start from a predefined template, then customize script, audience, and schedule before launch.</p>
            <ul className="dual-list">
              {['Sales, collections, reminders & win-back templates', 'CSV upload with column mapping', 'Calling-window & timezone-safe scheduling', 'Date, recurring, or event-based triggers'].map(item => (
                <li key={item}>
                  <Check size={15} aria-hidden="true" />{item}
                </li>
              ))}
            </ul>
            <button className="btn btn-glass" onClick={() => navigate('/signup')}>Build an outbound agent</button>
          </div>

          {/* INBOUND */}
          <div className="card dual-card inbound">
            <span className="badge bg-info">INBOUND</span>
            <h3 style={{ marginTop: 14 }}>Always-on agents that answer</h3>
            <p>Provision a number, connect your knowledge base, and let an agent handle the queue 24/7.</p>
            <ul className="dual-list">
              {['Support, booking, FAQ & order-status templates', 'Instant number provisioning', 'Business-hours & human hand-off rules', 'Connected knowledge base & CRM lookups'].map(item => (
                <li key={item}>
                  <Check size={15} style={{ color: 'var(--success-bg)' }} aria-hidden="true" />{item}
                </li>
              ))}
            </ul>
            <button className="btn btn-primary" onClick={() => navigate('/signup')}>Build an inbound agent</button>
          </div>
        </div>
      </div>
    </section>
  );
};
