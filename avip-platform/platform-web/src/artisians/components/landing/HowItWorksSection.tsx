import React from 'react';

const steps = [
  { num: '01', title: 'Choose a template', desc: 'Start from a predefined inbound or outbound agent built for your use case.' },
  { num: '02', title: 'Customize & connect', desc: 'Edit the script, add your knowledge base, and connect CRM or calendar tools.' },
  { num: '03', title: 'Set schedule & triggers', desc: 'Define calling windows, timezones, and what starts or repeats the campaign.' },
  { num: '04', title: 'Launch & monitor', desc: 'Go live and track every call, conversion, and KPI from your dashboard.' },
];

export const HowItWorksSection: React.FC = () => (
  <section className="land-section" id="how">
    <div className="land-section-inner">
      <div className="land-section-head">
        <span className="eyebrow">Process</span>
        <h2>From idea to live campaign in four steps</h2>
        <p>The builder walks you through each decision in order, so nothing gets missed before you go live.</p>
      </div>
      <div className="how-grid">
        {steps.map(({ num, title, desc }) => (
          <div key={num} className="card how-step">
            <div className="step-num">{num}</div>
            <h3>{title}</h3>
            <p>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
