import React from 'react';
import { useApp } from '../../../context/AppContext';
import type { WizardData } from '../../../types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface TriggerOption {
  val: WizardData['triggerType'];
  label: string;
  desc: string;
}

const triggerOptions: TriggerOption[] = [
  { val: 'immediate', label: 'Start immediately', desc: 'Calling begins as soon as you launch the campaign.' },
  { val: 'scheduled', label: 'Schedule for a date & time', desc: 'Pick an exact date and time to begin calling.' },
  { val: 'recurring', label: 'Recurring', desc: 'Repeat the campaign automatically on the days you selected above.' },
  { val: 'event', label: 'Event-based', desc: 'Start when a condition is met — e.g. a field from your CSV, or a webhook.' },
];

export const ScheduleStep: React.FC = () => {
  const { wizard, updateWizardData } = useApp();
  const { data } = wizard;

  const toggleDay = (day: string) => {
    const days = data.days.includes(day) ? data.days.filter(d => d !== day) : [...data.days, day];
    updateWizardData('days', days);
  };

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Calling window</h3>
      <div className="wiz-field-grid" style={{ gridTemplateColumns: '0.8fr 0.8fr 1.4fr' }}>
        <div className="field">
          <label className="field-label" htmlFor="wStart">Start time</label>
          <input className="input" type="time" id="wStart" value={data.windowStart} onChange={e => updateWizardData('windowStart', e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="wEnd">End time</label>
          <input className="input" type="time" id="wEnd" value={data.windowEnd} onChange={e => updateWizardData('windowEnd', e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="wTz">Timezone</label>
          <select className="input select-field" id="wTz" value={data.timezone} onChange={e => updateWizardData('timezone', e.target.value)}>
            <option>America/New_York</option>
            <option>America/Los_Angeles</option>
            <option>Asia/Kolkata</option>
            <option>Europe/London</option>
          </select>
        </div>
      </div>

      <div className="wiz-field-grid" style={{ gridTemplateColumns: '1.8fr 0.8fr', marginTop: 14 }}>
        <div className="field">
          <span className="field-label">Days active</span>
          <div className="flex gap-2 flex-wrap" role="group" aria-label="Days active">
            {DAYS.map(day => (
              <button key={day} type="button" className={`wiz-day-chip ${data.days.includes(day) ? 'active' : ''}`}
                aria-pressed={data.days.includes(day)} onClick={() => toggleDay(day)}>{day}</button>
            ))}
          </div>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="wRetries">Retry attempts</label>
          <input className="input" type="number" id="wRetries" min={0} max={6} value={data.retries} onChange={e => updateWizardData('retries', Number(e.target.value))} />
        </div>
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 700, margin: '24px 0 16px' }}>Trigger logic</h3>
      <div role="radiogroup" aria-label="Trigger logic">
        {triggerOptions.map(opt => (
          <label key={opt.val} className={`wiz-trigger-option ${data.triggerType === opt.val ? 'selected' : ''}`} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <input type="radio" name="trig" checked={data.triggerType === opt.val} onChange={() => updateWizardData('triggerType', opt.val)} style={{ marginTop: 4, accentColor: 'var(--accent)' }} />
            <div style={{ flex: 1 }}>
              <b style={{ fontSize: 13.5, display: 'block', marginBottom: 3, color: 'var(--text)' }}>{opt.label}</b>
              <span style={{ fontSize: 12, color: 'var(--text-soft)', lineHeight: 1.4, display: 'block' }}>{opt.desc}</span>
            </div>
          </label>
        ))}
      </div>

      {data.triggerType === 'scheduled' && (
        <div className="field" style={{ marginTop: 16 }}>
          <label className="field-label" htmlFor="wSchedDate">Launch date & time</label>
          <input className="input" type="datetime-local" id="wSchedDate" style={{ maxWidth: 280 }} onChange={e => updateWizardData('triggerDate', e.target.value)} />
        </div>
      )}
      {data.triggerType === 'event' && (
        <div className="field" style={{ marginTop: 16 }}>
          <label className="field-label" htmlFor="wEventRule">Event rule</label>
          <select className="input select-field" id="wEventRule" style={{ maxWidth: 400 }} onChange={e => updateWizardData('eventRule', e.target.value)}>
            <option>3 days before due_date (from CSV)</option>
            <option>On new row added to CSV</option>
            <option>On webhook received</option>
          </select>
        </div>
      )}
    </div>
  );
};
