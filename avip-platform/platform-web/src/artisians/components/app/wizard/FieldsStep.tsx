import React, { useState } from 'react';
import { Plus, Trash2, KeyRound } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export const FieldsStep: React.FC = () => {
  const { wizard, updateWizardData } = useApp();
  const { data } = wizard;
  const fields = data.contactFields || [
    { key: 'name', label: 'Full name', placeholder: 'John Doe' },
    { key: 'phone', label: 'Phone number', placeholder: '+1 (555) 019-2831' }
  ];

  const [newLabel, setNewLabel] = useState('');
  const [newPlaceholder, setNewPlaceholder] = useState('');
  const [error, setError] = useState('');

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) {
      setError('Field label is required.');
      return;
    }

    const key = newLabel.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (!key) {
      setError('Invalid label. Use letters and numbers.');
      return;
    }

    if (fields.some(f => f.key === key)) {
      setError('A field with this name already exists.');
      return;
    }

    setError('');
    const newField = {
      key,
      label: newLabel.trim(),
      placeholder: newPlaceholder.trim() || `e.g. Enter ${newLabel.trim().toLowerCase()}`
    };

    updateWizardData('contactFields', [...fields, newField]);
    setNewLabel('');
    setNewPlaceholder('');
  };

  const handleRemoveField = (key: string) => {
    if (key === 'name' || key === 'phone') return; // Cannot delete mandatory fields
    updateWizardData('contactFields', fields.filter(f => f.key !== key));
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Call recipient data fields</h3>
        <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.5 }}>
          Define the columns of candidate/contact details you will provide. The AI agent can reference these variables in its script using double brackets (e.g. <code>{"[[due_date]]"}</code>).
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 28, alignItems: 'start' }}>
        {/* Current Schema Fields list */}
        <div>
          <h4 style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--text-faint)', marginBottom: 12 }}>
            Active contact schema
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fields.map(f => {
              const isMandatory = f.key === 'name' || f.key === 'phone';
              return (
                <div key={f.key} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                  background: isMandatory ? 'var(--bg)' : 'var(--card)',
                  border: '1px solid var(--border)', borderRadius: 10,
                  transition: 'var(--transition)'
                }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', flexShrink: 0 }}>
                    <KeyRound size={13} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <b style={{ fontSize: 13.5, color: 'var(--text)' }}>{f.label}</b>
                      {isMandatory && <span className="badge" style={{ background: 'var(--border)', color: 'var(--text-faint)', fontSize: 9.5, padding: '2px 6px' }}>System</span>}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-faint)', display: 'block', fontFamily: 'var(--font-mono, monospace)' }}>
                      Variable: [[{f.key}]] · Placeholder: {f.placeholder}
                    </span>
                  </div>
                  {!isMandatory && (
                    <button className="icon-btn" style={{ color: 'var(--danger)' }} onClick={() => handleRemoveField(f.key)} aria-label={`Remove field ${f.label}`}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add custom field form */}
        <div className="card card-pad" style={{ border: '1px solid var(--border)', background: 'var(--bg)', borderRadius: 14 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Add a custom field</h4>
          <form onSubmit={handleAddField}>
            {error && <div className="auth-error" role="alert" style={{ marginBottom: 12, padding: '6px 12px', fontSize: 12 }}>{error}</div>}
            <div className="field">
              <label className="field-label" htmlFor="newFieldLabel">Field label</label>
              <input className="input" id="newFieldLabel" placeholder="e.g. Due Date, Order ID, Company" value={newLabel} onChange={e => setNewLabel(e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="newFieldPlaceholder">Input placeholder / example</label>
              <input className="input" id="newFieldPlaceholder" placeholder="e.g. Oct 12, ORD-9824, Acme Corp" value={newPlaceholder} onChange={e => setNewPlaceholder(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-sm" style={{ marginTop: 12 }}>
              <Plus size={14} /> Add to contact list
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
