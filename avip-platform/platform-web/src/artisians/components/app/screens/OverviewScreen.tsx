import React from 'react';
import { PhoneOutgoing, PhoneIncoming, BarChart3, KeyRound, Plus, Bot, TrendingUp, PhoneCall, Target, DollarSign, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MiniWave } from '../../ui/MiniWave';
import { Badge } from '../../ui/Badge';
import { useApp } from '../../../context/AppContext';

const statIcons: Record<string, React.FC<{ size?: number }>> = {
  bot: Bot, 'phone-call': PhoneCall, target: Target, 'dollar-sign': DollarSign,
};

export const OverviewScreen: React.FC = () => {
  const { agents } = useApp();
  const navigate = useNavigate();

  const stats = [
    { label: 'Active agents', val: agents.filter(a => a.status === 'Active').length, icon: 'bot', color: 'var(--primary-light)', trend: '+2 this week' },
    { label: 'Calls today', val: '1,284', icon: 'phone-call', color: 'var(--accent)', trend: '+11.4%' },
    { label: 'Conversion rate', val: '24.6%', icon: 'target', color: 'var(--success-bg)', trend: '+3.1%' },
    { label: 'Avg. cost / call', val: '$0.38', icon: 'dollar-sign', color: 'var(--warning-bg)', trend: '-4.2%' },
  ];

  const recent = [...agents].sort((a, b) => (a.status === 'Active' ? 0 : 1) - (b.status === 'Active' ? 0 : 1)).slice(0, 5);

  return (
    <div className="screen-anim" style={{ padding: '30px 34px 60px' }}>
      {/* HERO */}
      <div className="app-hero" style={{ marginBottom: 26 }}>
        <div style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32, alignItems: 'center' }}>
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.25)', padding: '6px 12px', borderRadius: 30, fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
              <Sparkles size={13} style={{ color: '#FFD700' }} /> Welcome back, Priya
            </span>
            <h1 id="overview-title" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 800, letterSpacing: '-.8px', margin: '0 0 12px', maxWidth: 520 }}>Deploy your next voice agent in minutes</h1>
            <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.82)', maxWidth: 480, lineHeight: 1.6, margin: '0 0 22px' }}>
              Choose inbound or outbound, connect your knowledge, and launch — everything is tracked in one dashboard.
            </p>
            <div className="flex gap-3 flex-wrap">
              <button className="btn btn-accent" onClick={() => navigate('/app/create')}><Plus size={15} /> Create new agent</button>
              <button className="btn btn-glass" onClick={() => navigate('/app/agents')}><Bot size={15} /> View my agents</button>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: 20, backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px 0 rgba(15, 11, 26, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.9)' }}>
                <span className="pulse-dot"></span> LIVE OPERATIONS MONITOR
              </span>
              <span style={{ fontSize: 11, background: 'rgba(46,204,113,0.2)', color: '#7CF5A0', padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>SYSTEM NOMINAL</span>
            </div>
            <MiniWave />
            <div style={{ marginTop: 14 }}>
              {[
                { label: 'Active calls now', val: '18', color: '#fff' },
                { label: 'Agents live', val: '6', color: '#fff' },
                { label: 'Today\'s conversions', val: '34', color: '#7CF5A0' }
              ].map(({ label, val, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'rgba(255,255,255,0.8)', padding: '9px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <span>{label}</span><b style={{ color }}>{val}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* STAT GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 28 }}>
        {stats.map(s => {
          const Icon = statIcons[s.icon] || Bot;
          const isDown = s.trend.startsWith('-');
          return (
            <div key={s.label} className="ov-stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${s.color}15`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} />
                </div>
                <span className={`ov-stat-trend-badge ${isDown ? 'down' : 'up'}`}>
                  <TrendingUp size={11} style={{ transform: isDown ? 'rotate(90deg)' : 'none' }} /> {s.trend}
                </span>
              </div>
              <div>
                <div className="ov-stat-val">{s.val}</div>
                <div className="stat-label" style={{ marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* GRID 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '17px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 14.5, fontWeight: 700 }}>Recent agents</h3>
            <a href="#" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--primary-light)' }} onClick={e => { e.preventDefault(); navigate('/app/agents'); }}>View all</a>
          </div>
          {recent.map(a => (
            <div key={a.id} className="ov-recent-agent-row">
              <div className="row-avatar" style={{ background: `linear-gradient(135deg, ${a.color} 0%, var(--primary-light) 100%)` }}>
                {a.type === 'outbound' ? <PhoneOutgoing size={16} /> : <PhoneIncoming size={16} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontSize: 13.5, display: 'block' }}>{a.name}</b>
                <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{a.type === 'outbound' ? 'Outbound' : 'Inbound'} · {a.template}</span>
              </div>
              <Badge status={a.status} />
            </div>
          ))}
        </div>

        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h3 style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 4 }}>Quick Actions</h3>
            <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>Deploy new agents or access developer keys instantly</p>
          </div>
          <div className="ov-actions-grid">
            {[
              { label: 'New Outbound', sub: 'Dial leads & lists', Icon: PhoneOutgoing, action: () => navigate('/app/create') },
              { label: 'New Inbound', sub: '24/7 support line', Icon: PhoneIncoming, action: () => navigate('/app/create') },
              { label: 'Analytics', sub: 'Review KPIs', Icon: BarChart3, action: () => navigate('/app/analytics') },
              { label: 'API Keys', sub: 'Get token pool', Icon: KeyRound, action: () => navigate('/app/sdk') },
            ].map(({ label, sub, Icon, action }) => (
              <button key={label} className="ov-action-card" onClick={action}>
                <div className="icon-wrap">
                  <Icon size={16} />
                </div>
                <div>
                  <h4>{label}</h4>
                  <p>{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
