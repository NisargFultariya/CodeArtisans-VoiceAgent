import React from 'react';
import { PhoneOutgoing, PhoneIncoming, Database, BarChart3, Code2, Building2 } from 'lucide-react';

const features = [
  { Icon: PhoneOutgoing, title: 'Outbound campaigns', desc: 'Pick a proven template, upload your contact list, and launch calling campaigns with retry logic and quiet hours built in.' },
  { Icon: PhoneIncoming, title: 'Inbound agents', desc: 'Deploy always-on assistants for support, booking, and lead capture with instant number provisioning and business-hour routing.' },
  { Icon: Database, title: 'Knowledge & connectors', desc: 'Ground every agent in your docs, CRM, and calendars — Salesforce, HubSpot, Google Calendar, Slack, and webhooks.' },
  { Icon: BarChart3, title: 'Live analytics & KPIs', desc: 'Track answer rate, conversion, sentiment, and cost per call across every agent and campaign in one dashboard.' },
  { Icon: Code2, title: 'SDK & API', desc: 'Trigger calls, stream events, and manage agents programmatically with our REST API and client SDKs.' },
  { Icon: Building2, title: 'Built for enterprise teams', desc: 'Custom branding and role-based access control so teams can manage call agents safely.' },
];

export const FeaturesSection: React.FC = () => (
  <section className="land-section" id="features">
    <div className="land-section-inner">
      <div className="land-section-head">
        <span className="eyebrow">Platform</span>
        <h2>One control plane for every voice workflow</h2>
        <p>From first CSV upload to live analytics, Simform Voice OS covers the full lifecycle of an AI voice agent.</p>
      </div>
      <div className="feat-grid">
        {features.map(({ Icon, title, desc }) => (
          <div key={title} className="card feat-card">
            <div className="feat-icon">
              <Icon size={21} aria-hidden="true" />
            </div>
            <h3>{title}</h3>
            <p>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
