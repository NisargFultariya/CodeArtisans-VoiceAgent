import React from 'react';
import { useApp } from '../../../context/AppContext';

const defaultScript = (name?: string) =>
  `Hi {{first_name}}, this is the AI assistant calling on behalf of ${name || 'our team'}. I wanted to follow up regarding your account — do you have a couple of minutes to talk?`;

export const CustomizeStep: React.FC = () => {
  const { wizard, updateWizardData } = useApp();
  const { data } = wizard;

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Customize your agent</h3>
      <div className="wiz-field-grid" style={{ gridTemplateColumns: '1.2fr 0.9fr 0.9fr' }}>
        <div className="field">
          <label className="field-label" htmlFor="wAgentName">Agent name</label>
          <input className="input" id="wAgentName" value={data.agentName || data.templateName || ''} onChange={e => updateWizardData('agentName', e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="wVoice">Voice</label>
          <select className="input select-field" id="wVoice" value={data.voice || 'Aria (Warm, Female)'} onChange={e => updateWizardData('voice', e.target.value)}>
            <option>Aria (Warm, Female)</option>
            <option>Rohan (Confident, Male)</option>
            <option>Sage (Neutral, Calm)</option>
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="wLang">Language</label>
          <select className="input select-field" id="wLang" value={data.language || 'English (US)'} onChange={e => updateWizardData('language', e.target.value)}>
            <option>English (US)</option>
            <option>English (UK)</option>
            <option>Hindi</option>
            <option>Spanish</option>
          </select>
        </div>
      </div>
      <div className="field" style={{ marginTop: 8 }}>
        <label className="field-label" htmlFor="wScript">Call script / prompt</label>
        <textarea className="input wiz-textarea" id="wScript" rows={6} value={data.script !== undefined ? data.script : defaultScript(data.templateName)} onChange={e => updateWizardData('script', e.target.value)} style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12.5, lineHeight: 1.6 }} />
        <span className="wiz-help-text">Use variables like {"{{first_name}}"}, {"{{company}}"}, {"{{due_date}}"} — filled in per contact from your uploaded data.</span>
      </div>
    </div>
  );
};
