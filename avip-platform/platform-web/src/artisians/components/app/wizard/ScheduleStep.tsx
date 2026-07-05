import React from 'react';
import { useApp } from '../../../context/AppContext';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];



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


    </div>
  );
};
