import React, { useState } from 'react';
import { FilePlus2, FileText, Trash2 } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Switch } from '../../ui/Switch';
import { useApp } from '../../../context/AppContext';
import { connectorDefs } from '../../../data/templates';
import type { ConnectorDef } from '../../../data/templates';

type IconComponent = React.FC<LucideProps>;

const kbNames = ['Product FAQ.pdf', 'Pricing Sheet.docx', 'Support Macros.txt', 'help.acme.com (crawled)'];

export const KnowledgeStep: React.FC = () => {
  const { wizard, updateWizardData } = useApp();
  const { data } = wizard;

  const [activeConnector, setActiveConnector] = useState<ConnectorDef | null>(null);
  const [configFields, setConfigFields] = useState<Record<string, string>>({});

  const addKbFile = () => {
    const name = kbNames[data.kbFiles.length % kbNames.length];
    const size = (Math.random() * 3 + 0.4).toFixed(1) + ' MB';
    updateWizardData('kbFiles', [...data.kbFiles, { name, size }]);
  };

  const removeKbFile = (i: number) => {
    updateWizardData('kbFiles', data.kbFiles.filter((_, idx) => idx !== i));
  };

  const handleCardClick = (c: ConnectorDef) => {
    setActiveConnector(c);
    const existingConfig = (data.connectorsConfig || {})[c.id] || {};
    setConfigFields(existingConfig);
  };

  const handleSwitchChange = (c: ConnectorDef, checked: boolean) => {
    if (!checked) {
      updateWizardData('connectors', { ...data.connectors, [c.id]: false });
    } else {
      handleCardClick(c);
    }
  };

  const handleSave = () => {
    if (!activeConnector) return;
    updateWizardData('connectors', { ...data.connectors, [activeConnector.id]: true });
    const newConfig = { ...(data.connectorsConfig || {}), [activeConnector.id]: configFields };
    updateWizardData('connectorsConfig', newConfig);
    setActiveConnector(null);
  };

  const handleCancel = () => {
    setActiveConnector(null);
  };

  const handleDisconnect = () => {
    if (!activeConnector) return;
    updateWizardData('connectors', { ...data.connectors, [activeConnector.id]: false });
    setActiveConnector(null);
  };

  const renderFields = () => {
    if (!activeConnector) return null;
    switch (activeConnector.id) {
      case 'salesforce':
      case 'hubspot':
        return (
          <>
            <div className="field">
              <label className="field-label" htmlFor="cClientId">Client ID / App Key</label>
              <input className="input" id="cClientId" placeholder="e.g. 3MVG9..." value={configFields.clientId || ''} onChange={e => setConfigFields(f => ({ ...f, clientId: e.target.value }))} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="cClientSecret">Client Secret</label>
              <input className="input" id="cClientSecret" type="password" placeholder="••••••••••••" value={configFields.clientSecret || ''} onChange={e => setConfigFields(f => ({ ...f, clientSecret: e.target.value }))} />
            </div>
          </>
        );
      case 'gcal':
        return (
          <>
            <div className="field">
              <label className="field-label" htmlFor="cCalendarId">Calendar ID / Owner Email</label>
              <input className="input" id="cCalendarId" placeholder="e.g. primary or Priya@acme.com" value={configFields.calendarId || ''} onChange={e => setConfigFields(f => ({ ...f, calendarId: e.target.value }))} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="cCreds">Service Account Credentials (JSON)</label>
              <textarea className="input" id="cCreds" rows={3} placeholder='{ "type": "service_account", ... }' value={configFields.creds || ''} onChange={e => setConfigFields(f => ({ ...f, creds: e.target.value }))} style={{ fontFamily: 'monospace', fontSize: 11 }} />
            </div>
          </>
        );
      case 'slack':
        return (
          <>
            <div className="field">
              <label className="field-label" htmlFor="cWebhookUrl">Incoming Webhook URL</label>
              <input className="input" id="cWebhookUrl" placeholder="https://hooks.slack.com/services/..." value={configFields.webhookUrl || ''} onChange={e => setConfigFields(f => ({ ...f, webhookUrl: e.target.value }))} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="cChannel">Post Channel</label>
              <input className="input" id="cChannel" placeholder="e.g. #sales-alerts" value={configFields.channel || ''} onChange={e => setConfigFields(f => ({ ...f, channel: e.target.value }))} />
            </div>
          </>
        );
      case 'webhook':
        return (
          <>
            <div className="field">
              <label className="field-label" htmlFor="cTargetUrl">Target Endpoint URL</label>
              <input className="input" id="cTargetUrl" placeholder="https://api.yourdomain.com/v1/voice" value={configFields.targetUrl || ''} onChange={e => setConfigFields(f => ({ ...f, targetUrl: e.target.value }))} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="cSecret">Auth Secret Token</label>
              <input className="input" id="cSecret" type="password" placeholder="e.g. whsec_..." value={configFields.secret || ''} onChange={e => setConfigFields(f => ({ ...f, secret: e.target.value }))} />
            </div>
          </>
        );
      case 'twilio':
        return (
          <>
            <div className="field">
              <label className="field-label" htmlFor="cPhone">Twilio Phone Number</label>
              <input className="input" id="cPhone" placeholder="e.g. +1 (415) 555-0132" value={configFields.phone || ''} onChange={e => setConfigFields(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="cSid">Account SID</label>
              <input className="input" id="cSid" placeholder="AC..." value={configFields.sid || ''} onChange={e => setConfigFields(f => ({ ...f, sid: e.target.value }))} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="cToken">Auth Token</label>
              <input className="input" id="cToken" type="password" placeholder="••••••••••••" value={configFields.token || ''} onChange={e => setConfigFields(f => ({ ...f, token: e.target.value }))} />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Knowledge base</h3>
      <p style={{ fontSize: 12.5, color: 'var(--text-soft)', marginBottom: 16 }}>Ground the agent in your docs so answers stay accurate.</p>

      <div className="upload-zone" style={{ padding: '26px 20px', marginBottom: 18, transition: 'var(--transition)' }} role="button" tabIndex={0}
        onClick={addKbFile} onKeyDown={e => e.key === 'Enter' && addKbFile()}>
        <FilePlus2 size={26} style={{ color: 'var(--primary-light)', margin: '0 auto 10px' }} className="animate-pulse" />
        <b style={{ display: 'block', fontSize: 14, color: 'var(--text)' }}>Add documents or a URL to crawl</b>
        <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>PDF, DOCX, TXT, or a help-center link</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 24 }}>
        {data.kbFiles.map((f, i) => (
          <div key={i} className="kb-item">
            <span style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-light)', flexShrink: 0 }}>
              <FileText size={16} />
            </span>
            <div style={{ flex: 1 }}>
              <b style={{ fontSize: 13, display: 'block', color: 'var(--text)' }}>{f.name}</b>
              <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{f.size}</span>
            </div>
            <button className="icon-btn" aria-label={`Remove ${f.name}`} onClick={() => removeKbFile(i)} style={{ color: 'var(--danger)' }}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Connectors</h3>
      <p style={{ fontSize: 12.5, color: 'var(--text-soft)', marginBottom: 16 }}>Connect tools this agent should read from or write to.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
        {connectorDefs.map(c => {
          const IconComp = ((LucideIcons as unknown) as Record<string, IconComponent>)[c.icon] || LucideIcons.Webhook;
          const isConnected = !!data.connectors[c.id];
          return (
            <div key={c.id} className="connector-card" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
              onClick={() => handleCardClick(c)}>
              <span style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--primary-light)' }}>
                <IconComp size={18} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontSize: 13, display: 'block', color: 'var(--text)' }}>{c.name}</b>
                <span style={{ fontSize: 11, color: 'var(--text-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{c.desc}</span>
              </span>
              <div onClick={e => { e.stopPropagation(); handleSwitchChange(c, !isConnected); }}>
                <Switch checked={isConnected} onChange={() => {}} label={`Connect ${c.name}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* CONFIGURATION POPUP MODAL */}
      {activeConnector && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card card-pad" style={{ width: '100%', maxWidth: 440, animation: 'fadeUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)', margin: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4, color: 'var(--text)' }}>Configure {activeConnector.name}</h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-soft)', marginBottom: 18 }}>Provide connection credentials to integrate with {activeConnector.name}.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 22 }}>
              {renderFields()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center' }}>
              {!!data.connectors[activeConnector.id] && (
                <button className="btn btn-ghost" style={{ color: 'var(--danger)', marginRight: 'auto', padding: '8px 12px', fontSize: 13 }} onClick={handleDisconnect}>
                  Disconnect
                </button>
              )}
              <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 13 }} onClick={handleCancel}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ padding: '8px 18px', fontSize: 13 }} onClick={handleSave}>
                Save connection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
