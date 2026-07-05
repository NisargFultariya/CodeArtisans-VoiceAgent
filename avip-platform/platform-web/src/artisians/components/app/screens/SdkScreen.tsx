import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Plus, Webhook } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { codeSnippets } from '../../../data/codeSnippets';
import { webhookEvents } from '../../../data/webhookEvents';

type Lang = 'curl' | 'node' | 'python';

const PROD_KEY = 'sk_live_9f82ac74e6b13f2a';
const SAND_KEY = 'sk_test_44ac0192ee019b10';

export const SdkScreen: React.FC = () => {
  const { toast } = useApp();
  const [prodVisible, setProdVisible] = useState(false);
  const [sandVisible, setSandVisible] = useState(false);
  const [lang, setLang] = useState<Lang>('curl');

  const copyText = (text: string) => {
    navigator.clipboard?.writeText(text)
      .then(() => toast('Copied to clipboard.', 'copy'))
      .catch(() => toast('Copy failed — select text manually.', 'alert-triangle'));
  };

  return (
    <div className="screen-anim" style={{ padding: '30px 34px 60px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.5px', marginBottom: 4 }}>SDK &amp; API</h2>
        <p style={{ color: 'var(--text-soft)', fontSize: 13.5 }}>Trigger calls, manage agents, and receive events programmatically.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, marginBottom: 24 }}>
        {/* API Keys */}
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>API keys</h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>Keep production keys server-side. Sandbox keys are safe for testing.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Production key', key: PROD_KEY, masked: 'sk_live_••••••••••••3f2a', visible: prodVisible, toggle: () => setProdVisible(v => !v) },
              { label: 'Sandbox key', key: SAND_KEY, masked: 'sk_test_••••••••••••9b10', visible: sandVisible, toggle: () => setSandVisible(v => !v) },
            ].map(k => (
              <div key={k.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', border: '1.5px solid var(--border)', borderRadius: 12, background: 'rgba(92, 45, 145, 0.01)', transition: 'var(--transition)' }} className="row-item-hover">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ display: 'block', fontSize: 12.5, color: 'var(--text)' }}>{k.label}</b>
                  <span style={{ flex: 1, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, background: 'var(--bg)', padding: '6px 12px', borderRadius: 8, display: 'block', marginTop: 6, border: '1px solid var(--border)', color: 'var(--primary-light)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {k.visible ? k.key : k.masked}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="icon-btn" onClick={k.toggle} aria-label={k.visible ? 'Hide key' : 'Reveal key'} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: k.visible ? 'var(--primary-light)' : 'var(--text-soft)', background: 'var(--card)' }}>
                    {k.visible ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button className="icon-btn" onClick={() => copyText(k.key)} aria-label="Copy key" style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'var(--text-soft)', background: 'var(--card)' }}>
                    <Copy size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', marginTop: 4 }} onClick={() => toast('New sandbox key generated. Store it securely — it will only be shown once.', 'key-round')}>
            <Plus size={14} /> Generate new key
          </button>
        </div>

        {/* Install SDK */}
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Install the SDK</h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>Available for Node.js and Python packages.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, justifyContent: 'center' }}>
            {['npm install @simform/voice-sdk', 'pip install simform-voice'].map(cmd => (
              <div key={cmd} className="code-block" style={{ position: 'relative', background: '#0D091B', borderRadius: 12, padding: '16px 50px 16px 18px', border: '1.5px solid var(--border)', overflow: 'hidden' }}>
                <button style={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.06)', color: 'var(--text-soft)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '5px 9px', fontSize: 10.5, display: 'flex', alignItems: 'center', gap: 4, transition: 'var(--transition)' }} className="copy-btn-code" onClick={() => copyText(cmd)}>
                  <Copy size={12} /> Copy
                </button>
                <pre style={{ margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: '#A59EC2', overflowX: 'auto' }}>{cmd}</pre>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Code Example */}
      <div className="card card-pad" style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Trigger an outbound call</h3>
          <p style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>Send call events to any endpoint with a programmatic POST request.</p>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg)', padding: 4, borderRadius: 10, width: 'fit-content', border: '1px solid var(--border)' }} role="tablist" aria-label="Code language">
          {(['curl', 'node', 'python'] as Lang[]).map(l => (
            <button key={l} className={lang === l ? 'active' : ''} role="tab" aria-selected={lang === l}
              style={{ padding: '8px 16px', fontSize: 12.5, fontWeight: 600, borderRadius: 8, color: lang === l ? 'var(--primary-light)' : 'var(--text-soft)', background: lang === l ? 'var(--card)' : 'none', border: 'none', transition: 'var(--transition)', cursor: 'pointer' }}
              onClick={() => setLang(l)}>
              {l === 'curl' ? 'cURL' : l === 'node' ? 'Node.js' : 'Python'}
            </button>
          ))}
        </div>
        <div className="code-block" style={{ background: '#0D091B', borderRadius: 12, padding: 20, border: '1.5px solid var(--border)', position: 'relative' }}>
          <button style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.06)', color: 'var(--text-soft)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '5px 9px', fontSize: 10.5, display: 'flex', alignItems: 'center', gap: 4, transition: 'var(--transition)' }} className="copy-btn-code" onClick={() => copyText(codeSnippets[lang].replace(/<[^>]*>/g, ''))}>
            <Copy size={12} /> Copy code
          </button>
          <pre style={{ margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: '#A59EC2', overflowX: 'auto', whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: codeSnippets[lang] }} />
        </div>
      </div>

      {/* Webhooks */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1.5px solid var(--border)' }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Webhook events</h3>
            <span style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 2, display: 'block' }}>Sent to your registered endpoint as JSON payloads</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {webhookEvents.map(w => (
            <div key={w.name} className="ov-recent-agent-row">
              <span className="row-avatar" style={{ background: 'var(--grad)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Webhook size={15} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", display: 'block', color: 'var(--primary-light)' }}>{w.name}</b>
                <span style={{ fontSize: 12, color: 'var(--text-soft)' }}>{w.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
