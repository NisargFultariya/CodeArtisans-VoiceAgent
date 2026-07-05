import React from 'react';
import { useApp } from '../../../context/AppContext';

const triggerLabels: Record<string, string> = {
  immediate: 'Immediate', scheduled: 'Scheduled', recurring: 'Recurring', event: 'Event-based',
};

export const ReviewStep: React.FC = () => {
  const { wizard } = useApp();
  const { data, type } = wizard;
  const isOutbound = type === 'outbound';
  const kbCount = data.kbFiles.length;
  const connCount = Object.values(data.connectors).filter(Boolean).length;

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="summary-row">
      <span style={{ color: 'var(--text-soft)' }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  );

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Review &amp; {isOutbound ? 'launch' : 'deploy'}</h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
        <div className="summary-block" style={{ margin: 0 }}>
          <h4>Agent</h4>
          <Row label="Name" value={data.agentName || data.templateName || 'Untitled agent'} />
          <Row label="Template" value={data.templateName || '—'} />
          <Row label="Voice" value={data.voice || 'Aria (Warm, Female)'} />
        </div>

        {isOutbound ? (
          <div className="summary-block" style={{ margin: 0 }}>
            <h4>Schedule</h4>
            <Row label="Calling window" value={`${data.windowStart} – ${data.windowEnd} (${data.timezone})`} />
            <Row label="Active days" value={data.days.join(', ')} />
            <Row label="Trigger" value={triggerLabels[data.triggerType]} />
          </div>
        ) : (
          <div className="summary-block" style={{ margin: 0 }}>
            <h4>Routing</h4>
            <Row label="Number" value={data.number || '+1 (415) 555-0132'} />
            <Row label="Business hours" value={`${data.businessStart} – ${data.businessEnd}`} />
            <Row label="Human hand-off" value={data.fallbackHuman ? 'Enabled' : 'Disabled'} />
          </div>
        )}

        <div className="summary-block" style={{ margin: 0 }}>
          <h4>Knowledge &amp; connectors</h4>
          <Row label="Knowledge files" value={String(kbCount)} />
          <Row label="Connectors enabled" value={String(connCount)} />
        </div>
      </div>
    </div>
  );
};
