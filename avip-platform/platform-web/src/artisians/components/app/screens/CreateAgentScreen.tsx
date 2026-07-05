import React from 'react';
import { ArrowLeft, ArrowRight, Check, Rocket, PhoneOutgoing, PhoneIncoming } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';

import { TemplateStep } from '../wizard/TemplateStep';
import { CustomizeStep } from '../wizard/CustomizeStep';
import { FieldsStep } from '../wizard/FieldsStep';
import { NumberRoutingStep } from '../wizard/NumberRoutingStep';
import { KnowledgeStep } from '../wizard/KnowledgeStep';
import { ScheduleStep } from '../wizard/ScheduleStep';
import { ReviewStep } from '../wizard/ReviewStep';

const stepsFor = (type: 'outbound' | 'inbound') =>
  type === 'outbound'
    ? ['Template', 'Customize', 'Recipient Fields', 'Knowledge', 'Schedule', 'Review']
    : ['Template', 'Customize', 'Number & Routing', 'Knowledge', 'Review'];

const stepKindFor = (type: 'outbound' | 'inbound', step: number) =>
  type === 'outbound'
    ? ['template', 'customize', 'fields', 'knowledge', 'schedule', 'review'][step]
    : ['template', 'customize', 'number', 'knowledge', 'review'][step];

export const CreateAgentScreen: React.FC = () => {
  const { wizard, startCreate, cancelWizard, setWizardStep, launchAgent, toast } = useApp();
  const navigate = useNavigate();

  if (!wizard.open) {
    return (
      <div className="screen-anim" style={{ padding: '40px 34px 60px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 38 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--border)', padding: '6px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, color: 'var(--primary-light)', marginBottom: 12 }}>
            GETTING STARTED
          </span>
          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.6px', marginBottom: 8 }}>Create a new agent</h2>
          <p style={{ color: 'var(--text-soft)', fontSize: 14, maxWidth: 500, margin: '0 auto' }}>Choose the type of conversation workflow you would like to automate.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, justifyContent: 'center' }}>
          {[
            { type: 'outbound' as const, Icon: PhoneOutgoing, title: 'Outbound agent', desc: 'Calls out to a list of contacts — sales, reminders, collections, surveys, and more.', tags: ['Campaign-based', 'CSV upload'], color: 'var(--grad)' },
            { type: 'inbound' as const, Icon: PhoneIncoming, title: 'Inbound agent', desc: 'Answers incoming calls — support, booking, FAQs, and order status, 24/7.', tags: ['Always-on', 'Number provisioning'], color: 'var(--grad-accent)' },
          ].map(({ type, Icon, title, desc, tags, color }) => (
            <button key={type}
              style={{
                padding: '36px 30px', textAlign: 'left', border: '2px solid var(--border)', borderRadius: 20,
                background: 'var(--card)', transition: 'var(--transition)', display: 'flex', flexDirection: 'column',
                alignItems: 'flex-start', width: '100%', cursor: 'pointer', outline: 'none'
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary-light)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
              onClick={() => startCreate(type)}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: 20 }}><Icon size={22} /></div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: 'var(--text)' }}>{title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.6, marginBottom: 20 }}>{desc}</p>
              <div className="flex gap-1.5 flex-wrap" style={{ marginTop: 'auto' }}>
                {tags.map(t => <span key={t} className="badge bg-info">{t}</span>)}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const { type, step, data } = wizard;
  const steps = stepsFor(type!);
  const stepKind = stepKindFor(type!, step);
  const lastStep = steps.length - 1;
  const isOutbound = type === 'outbound';

  const handleNext = () => {
    if (stepKind === 'template' && !data.templateId) { toast('Pick a template to continue.', 'alert-triangle'); return; }
    if (step === lastStep) { launchAgent(navigate); return; }
    setWizardStep(step + 1);
  };

  const handleBack = () => {
    const minStep = wizard.editingAgentId ? 1 : 0;
    if (step > minStep) setWizardStep(step - 1);
  };

  return (
    <div className="screen-anim" style={{ padding: '30px 34px 60px' }}>
      <div className="wiz-container">
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.5px', marginBottom: 4 }}>
              {wizard.editingAgentId ? 'Edit agent settings' : (isOutbound ? 'New outbound campaign' : 'New inbound agent')}
            </h2>
            <p style={{ color: 'var(--text-soft)', fontSize: 13.5 }}>
              {wizard.editingAgentId ? 'Update your agent parameters and save changes.' : 'Template to deployment — five quick steps.'}
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => { cancelWizard(); navigate('/app/agents'); }}><ArrowLeft size={15} /> Exit wizard</button>
        </div>

        {/* Steps Bar */}
        <div className="wiz-stepper" role="list" aria-label="Setup progress">
          {steps.map((s, i) => {
            const isActive = i === step;
            const isComplete = i < step;
            const stateClass = isActive ? 'active' : isComplete ? 'complete' : 'pending';
            return (
              <React.Fragment key={s}>
                <div className={`wiz-step-node ${stateClass}`} role="listitem" aria-current={isActive ? 'step' : 'false'}>
                  <div className="wiz-step-circle">
                    {isComplete ? <Check size={13} /> : i + 1}
                  </div>
                  <span className="wiz-step-label">{s}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`wiz-connector-line ${isComplete ? 'complete' : ''}`} aria-hidden />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Wizard Panel */}
        <div className="card card-pad" style={{ minHeight: 340 }}>
          {stepKind === 'template' && <TemplateStep />}
          {stepKind === 'customize' && <CustomizeStep />}
          {stepKind === 'fields' && <FieldsStep />}
          {stepKind === 'number' && <NumberRoutingStep />}
          {stepKind === 'knowledge' && <KnowledgeStep />}
          {stepKind === 'schedule' && <ScheduleStep />}
          {stepKind === 'review' && <ReviewStep />}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
          <button className="btn btn-ghost" style={{ visibility: step <= (wizard.editingAgentId ? 1 : 0) ? 'hidden' : 'visible' }} onClick={handleBack}><ArrowLeft size={15} /> Previous</button>
          <button className="btn btn-primary animate-pulse" onClick={handleNext}>
            {step === lastStep ? <><Rocket size={15} /> {wizard.editingAgentId ? 'Save changes' : (isOutbound ? 'Start campaign' : 'Deploy agent')}</> : <>Continue <ArrowRight size={15} /></>}
          </button>
        </div>
      </div>
    </div>
  );
};
