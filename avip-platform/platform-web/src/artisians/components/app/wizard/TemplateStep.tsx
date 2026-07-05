import React from 'react';
import { Check, Plus } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { outboundTemplates, inboundTemplates } from '../../../data/templates';

type IconComponent = React.FC<LucideProps>;

export const TemplateStep: React.FC = () => {
  const { wizard, updateWizardData } = useApp();
  const { type, data } = wizard;
  const list = type === 'outbound' ? outboundTemplates : inboundTemplates;

  const selectTemplate = (id: string, name: string) => {
    updateWizardData('templateId', id);
    updateWizardData('templateName', name);
    if (!data.agentName) updateWizardData('agentName', name);

    let prompt = '';
    let fields = [
      { key: 'name', label: 'Full name', placeholder: 'John Doe' },
      { key: 'phone', label: 'Phone number', placeholder: '+1 (555) 019-2831' }
    ];
    if (id === 'custom_agent') {
      prompt = '';
    } else {
      const match = list.find(t => t.id === id);
      prompt = match ? match.prompt : '';
      fields = match && match.fields ? match.fields : fields;
    }
    updateWizardData('script', prompt);
    updateWizardData('contactFields', fields);
  };

  const customSelected = data.templateId === 'custom_agent';

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Choose a template to get started</h3>
      <div className="wiz-template-grid" role="list">
        {list.map(t => {
          const IconComp = ((LucideIcons as unknown) as Record<string, IconComponent>)[t.icon] || LucideIcons.Bot;
          const selected = data.templateId === t.id;
          return (
            <div key={t.id} className={`wiz-template-card ${selected ? 'selected' : ''}`}
              role="listitem" tabIndex={0}
              onClick={() => selectTemplate(t.id, t.name)}
              onKeyDown={e => e.key === 'Enter' && selectTemplate(t.id, t.name)}>
              {selected && (
                <div style={{ position: 'absolute', top: 14, right: 14, width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                  <Check size={12} />
                </div>
              )}
              <div className="icon-box">
                <IconComp size={20} />
              </div>
              <h4 style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>{t.name}</h4>
              <p style={{ fontSize: 12.5, color: 'var(--text-soft)', lineHeight: 1.5 }}>{t.desc}</p>
            </div>
          );
        })}

        <div className={`wiz-template-card ${customSelected ? 'selected' : ''}`}
          style={{ borderStyle: 'dashed', borderWidth: '2px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}
          role="listitem" tabIndex={0}
          onClick={() => selectTemplate('custom_agent', 'Custom Agent')}
          onKeyDown={e => e.key === 'Enter' && selectTemplate('custom_agent', 'Custom Agent')}>
          {customSelected && (
            <div style={{ position: 'absolute', top: 14, right: 14, width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <Check size={12} />
            </div>
          )}
          <div className="icon-box" style={{ background: 'var(--border)', color: 'var(--text-soft)' }}>
            <Plus size={20} />
          </div>
          <h4 style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>Build Custom Agent</h4>
          <p style={{ fontSize: 12.5, color: 'var(--text-soft)', lineHeight: 1.5 }}>Start from scratch with a completely blank canvas and empty prompts.</p>
        </div>
      </div>
    </div>
  );
};
