import React, { useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Line, Doughnut, Bar, Pie } from 'react-chartjs-2';
import { TrendingUp, PhoneCall, Timer, Target, DollarSign, Bot } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Title, Tooltip, Legend);

const randInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

const PURPLE = '#5C2D91', ACCENT = '#FF5C73', SUCCESS = '#2ECC71', WARNING = '#F5A623', DANGER = '#E74C3C', PRIMARY = '#3E136B';

const statIcons = [PhoneCall, PhoneCall, Timer, Target, DollarSign, Bot];

const activity = [
  ['Campaign "Q3 Renewal Outreach" launched', '2 min ago'],
  ['Agent "Support Line — Tier 1" answered 142 calls today', '18 min ago'],
  ['Knowledge source "Salesforce CRM" synced', '1 hr ago'],
  ['14 meetings booked today — new high', '3 hrs ago'],
  ['Campaign "Collections Recovery Q3" scheduled for Jul 6', 'Yesterday'],
];

export const AnalyticsScreen: React.FC = () => {
  const { agents } = useApp();
  const [range, setRange] = useState('Last 14 days');

  const days = range.includes('7') ? 7 : range.includes('30') ? 30 : 14;
  const labels = Array.from({ length: days }, (_, i) => `Day ${i + 1}`);

  const stats = [
    { label: 'Total calls (14d)', val: '18,204', color: PURPLE, trend: '+9.8%' },
    { label: 'Answer rate', val: '71.3%', color: SUCCESS, trend: '+2.4%' },
    { label: 'Avg. call duration', val: '4m 12s', color: WARNING, trend: '-0.6%' },
    { label: 'Conversion rate', val: '24.6%', color: ACCENT, trend: '+3.1%' },
    { label: 'Cost per call', val: '$0.38', color: PURPLE, trend: '-4.2%' },
    { label: 'Active agents', val: agents.filter(a => a.status === 'Active').length, color: SUCCESS, trend: '+1' },
  ];

  const outbound = agents.filter(a => a.type === 'outbound').slice(0, 6);

  return (
    <div className="screen-anim" style={{ padding: '30px 34px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 20 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.5px', marginBottom: 4 }}>Analytics &amp; KPIs</h2>
          <p style={{ color: 'var(--text-soft)', fontSize: 13.5 }}>Performance across every agent and campaign.</p>
        </div>
        <select className="input select-field" aria-label="Date range" style={{ width: 'auto', minWidth: 150 }} value={range} onChange={e => setRange(e.target.value)}>
          <option>Last 7 days</option><option>Last 14 days</option><option>Last 30 days</option>
        </select>
      </div>

      {/* STAT GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 28 }}>
        {stats.map((s, i) => {
          const Icon = statIcons[i];
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

      {/* CHARTS ROW 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="chart-card">
          <h3 style={{ margin: '0 0 4px', fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>Calls per day</h3>
          <span style={{ fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 12, display: 'block' }}>Volume across all agents</span>
          <div style={{ height: 220 }}>
            <Line key={days} data={{ labels, datasets: [{ label: 'Calls', data: labels.map(() => randInt(800, 1700)), borderColor: PURPLE, backgroundColor: 'rgba(92,45,145,0.12)', fill: true, tension: .4 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
          </div>
        </div>
        <div className="chart-card">
          <h3 style={{ margin: '0 0 4px', fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>Call disposition</h3>
          <span style={{ fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 12, display: 'block' }}>Outcome breakdown</span>
          <div style={{ height: 220 }}>
            <Doughnut data={{ labels: ['Meeting Booked', 'Resolved', 'Voicemail', 'No Answer', 'Follow-up'], datasets: [{ data: [28, 22, 18, 17, 15], backgroundColor: [PRIMARY, SUCCESS, WARNING, DANGER, ACCENT] }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } } }} />
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 24 }}>
        <div className="chart-card">
          <h3 style={{ margin: '0 0 4px', fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>Top campaigns</h3>
          <span style={{ fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 12, display: 'block' }}>By conversions</span>
          <div style={{ height: 220 }}>
            <Bar data={{ labels: outbound.map(c => c.name.split(' ').slice(0, 2).join(' ')), datasets: [{ label: 'Conversions', data: outbound.map(c => c.conv || randInt(20, 90)), backgroundColor: ACCENT, borderRadius: 6 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
          </div>
        </div>
        <div className="chart-card">
          <h3 style={{ margin: '0 0 4px', fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>Sentiment</h3>
          <span style={{ fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 12, display: 'block' }}>Across all calls</span>
          <div style={{ height: 220 }}>
            <Pie data={{ labels: ['Positive', 'Neutral', 'Negative'], datasets: [{ data: [64, 27, 9], backgroundColor: [SUCCESS, WARNING, DANGER] }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } } }} />
          </div>
        </div>
        <div className="chart-card">
          <h3 style={{ margin: '0 0 4px', fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>Avg. duration by use case</h3>
          <span style={{ fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 12, display: 'block' }}>Minutes per call</span>
          <div style={{ height: 220 }}>
            <Bar data={{ labels: ['Sales', 'Support', 'Collections', 'Booking', 'Survey'], datasets: [{ label: 'Avg mins', data: [4.2, 3.1, 5.4, 3.6, 2.3], backgroundColor: PURPLE, borderRadius: 6 }] }} options={{ indexAxis: 'y' as const, responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>
      </div>

      {/* BOTTOM GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '17px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>Top performing agents</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[...agents].sort((a, b) => b.calls - a.calls).slice(0, 5).map(a => (
              <div key={a.id} className="ov-recent-agent-row">
                <div className="row-avatar" style={{ background: `linear-gradient(135deg, ${a.color} 0%, var(--primary-light) 100%)` }}>
                  {a.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 13.5, display: 'block', color: 'var(--text)' }}>{a.name}</b>
                  <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{a.calls.toLocaleString()} calls</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <b style={{ fontSize: 13, display: 'block', color: 'var(--text)' }}>{a.type === 'outbound' ? a.conv : '—'}</b>
                  <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>conversions</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '17px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>Recent activity</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {activity.map(([t, when], i) => (
              <div key={i} className="ov-recent-agent-row">
                <div className="row-avatar" style={{ background: 'var(--grad)' }}>⚡</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 13.5, display: 'block', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t}</b>
                  <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{when}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
