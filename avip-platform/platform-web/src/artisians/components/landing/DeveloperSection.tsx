import React from 'react';
import { KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DeveloperSection: React.FC = () => {
  const navigate = useNavigate();
  return (
    <section className="land-section" id="sdk-preview" style={{ paddingTop: 0 }}>
      <div className="land-section-inner grid-2" style={{ alignItems: 'center' }}>
        <div>
          <span className="eyebrow">For developers</span>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.6px', marginBottom: 12 }}>Bring voice agents into your own stack</h2>
          <p style={{ color: 'var(--text-soft)', fontSize: 14.5, lineHeight: 1.6, marginBottom: 20 }}>Use the REST API or SDK to trigger outbound calls, register webhooks for call events, and manage agents from your own systems.</p>
          <button className="btn btn-primary" onClick={() => navigate('/signup')}><KeyRound size={15} /> Get API access</button>
        </div>
        <div className="code-block" aria-label="Example API request">
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            <span className="tok-com"># Trigger an outbound call</span>{'\n'}
            curl -X POST https://api.simform.ai/v1/calls \{'\n'}
            {'  '}-H <span className="tok-str">"Authorization: Bearer sk_live_***"</span> \{'\n'}
            {'  '}-d agent_id=<span className="tok-str">"agt_outbound_42"</span> \{'\n'}
            {'  '}-d to=<span className="tok-str">"+1 555 010 2938"</span>
          </pre>
        </div>
      </div>
    </section>
  );
};
