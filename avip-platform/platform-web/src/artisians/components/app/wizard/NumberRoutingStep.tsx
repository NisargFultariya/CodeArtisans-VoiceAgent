import React from 'react';
import { Switch } from '../../ui/Switch';
import { useApp } from '../../../context/AppContext';

export const NumberRoutingStep: React.FC = () => {
  const { wizard, updateWizardData } = useApp();
  const { data } = wizard;

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Assign a number &amp; set routing</h3>
      
      <div className="field">
        <label className="field-label" htmlFor="wArea">Phone number</label>
        <select className="input select-field" id="wArea" value={data.number || ''} onChange={e => updateWizardData('number', e.target.value)}>
          <option>+1 (415) 555-0132 — San Francisco, CA</option>
          <option>+1 (212) 555-0187 — New York, NY</option>
          <option>+44 20 7946 0192 — London, UK</option>
        </select>
        <span className="wiz-help-text">A new number is provisioned instantly from our pool.</span>
      </div>

      <div className="wiz-field-grid" style={{ gridTemplateColumns: '0.8fr 0.8fr 1.4fr', marginTop: 14 }}>
        <div className="field">
          <label className="field-label" htmlFor="wBHStart">Business hours start</label>
          <input className="input" type="time" id="wBHStart" value={data.businessStart} onChange={e => updateWizardData('businessStart', e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="wBHEnd">Business hours end</label>
          <input className="input" type="time" id="wBHEnd" value={data.businessEnd} onChange={e => updateWizardData('businessEnd', e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="wTz2">Timezone</label>
          <select className="input select-field" id="wTz2" value={data.timezone} onChange={e => updateWizardData('timezone', e.target.value)}>
            <option>America/New_York</option>
            <option>America/Los_Angeles</option>
            <option>Asia/Kolkata</option>
            <option>Europe/London</option>
          </select>
        </div>
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginTop: 24, background: 'var(--bg)' }}>
        <div>
          <b style={{ display: 'block', fontSize: 13.5, color: 'var(--text)' }}>Hand off to a human when needed</b>
          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>If the agent can't resolve the call, transfer to your support queue.</span>
        </div>
        <Switch checked={data.fallbackHuman} onChange={() => updateWizardData('fallbackHuman', !data.fallbackHuman)} label="Hand off to a human when needed" />
      </div>
    </div>
  );
};
