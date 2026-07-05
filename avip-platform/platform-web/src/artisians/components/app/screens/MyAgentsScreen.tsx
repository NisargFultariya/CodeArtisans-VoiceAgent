import React, { useState } from 'react';
import { Plus, LayoutGrid, List, PhoneOutgoing, PhoneIncoming, Pause, Play, Rocket, Lock, BarChart3, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../ui/Badge';
import { Drawer } from '../../ui/Drawer';
import { useApp } from '../../../context/AppContext';
import type { Agent } from '../../../types';

export const MyAgentsScreen: React.FC = () => {
  const { agents, pauseResumeAgent, deleteAgent, startEdit } = useApp();
  const navigate = useNavigate();
  const [agentView, setAgentView] = useState<'table' | 'grid'>('table');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [drawerAgent, setDrawerAgent] = useState<Agent | null>(null);

  const filtered = agents.filter(a =>
    (typeFilter === 'all' || a.type === typeFilter) &&
    (statusFilter === 'all' || a.status === statusFilter) &&
    (!search || a.name.toLowerCase().includes(search.toLowerCase()) || a.template.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="screen-anim" style={{ padding: '30px 34px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 20 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.5px', marginBottom: 4 }}>My agents</h2>
          <p style={{ color: 'var(--text-soft)', fontSize: 13.5 }}>All inbound and outbound agents deployed.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/app/create')}><Plus size={15} /> Create new agent</button>
      </div>

      {/* Toolbar */}
      <div className="agent-toolbar">
        <div className="flex gap-2.5 items-center flex-wrap" style={{ flex: 1 }}>
          <label className="visually-hidden" htmlFor="agentSearch">Search agents</label>
          <input className="input" id="agentSearch" type="search" placeholder="Search agents…" style={{ minWidth: 240, flex: '1 1 auto', maxWidth: 320 }} value={search} onChange={e => setSearch(e.target.value)} />
          <label className="visually-hidden" htmlFor="agentFilterType">Filter by type</label>
          <select className="input select-field" id="agentFilterType" style={{ width: 'auto', minWidth: 130 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="all">All types</option>
            <option value="outbound">Outbound</option>
            <option value="inbound">Inbound</option>
          </select>
          <label className="visually-hidden" htmlFor="agentFilterStatus">Filter by status</label>
          <select className="input select-field" id="agentFilterStatus" style={{ width: 'auto', minWidth: 140 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            {['Active', 'Scheduled', 'Paused', 'Draft', 'Completed'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setAgentView(v => v === 'table' ? 'grid' : 'table')} style={{ flexShrink: 0 }}>
          {agentView === 'table' ? <><LayoutGrid size={15} /> Card view</> : <><List size={15} /> Table view</>}
        </button>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="card card-pad" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h3 style={{ fontSize: 15, marginBottom: 6 }}>No agents match these filters</h3>
          <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>Try clearing search or filters, or create a new agent.</p>
        </div>
      )}

      {/* TABLE VIEW */}
      {agentView === 'table' && filtered.length > 0 && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th scope="col" style={{ textAlign: 'left', padding: '14px 20px', fontSize: 12.5, fontWeight: 700, color: 'var(--text-soft)' }}>Agent</th>
                <th scope="col" style={{ textAlign: 'left', padding: '14px 20px', fontSize: 12.5, fontWeight: 700, color: 'var(--text-soft)' }}>Type</th>
                <th scope="col" style={{ textAlign: 'left', padding: '14px 20px', fontSize: 12.5, fontWeight: 700, color: 'var(--text-soft)' }}>Status</th>
                <th scope="col" style={{ textAlign: 'left', padding: '14px 20px', fontSize: 12.5, fontWeight: 700, color: 'var(--text-soft)' }}>Calls</th>
                <th scope="col" style={{ textAlign: 'left', padding: '14px 20px', fontSize: 12.5, fontWeight: 700, color: 'var(--text-soft)' }}>Conversions</th>
                <th scope="col" style={{ textAlign: 'left', padding: '14px 20px', fontSize: 12.5, fontWeight: 700, color: 'var(--text-soft)' }}>Created</th>
                <th scope="col" style={{ textAlign: 'right', padding: '14px 20px' }}><span className="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, idx) => (
                <tr key={a.id} style={{ borderBottom: idx === filtered.length - 1 ? 'none' : '1px solid var(--border)', transition: 'var(--transition)' }} className="row-item-hover">
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className="row-avatar" style={{ background: `linear-gradient(135deg, ${a.color} 0%, var(--primary-light) 100%)` }}>
                        {a.type === 'outbound' ? <PhoneOutgoing size={16} /> : <PhoneIncoming size={16} />}
                      </span>
                      <div>
                        <b style={{ display: 'block', fontSize: 13.5, color: 'var(--text)' }}>{a.name}</b>
                        <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{a.template}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-soft)', textTransform: 'capitalize' }}>{a.type}</td>
                  <td style={{ padding: '14px 20px' }}><Badge status={a.status} /></td>
                  <td style={{ padding: '14px 20px', fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{a.calls.toLocaleString()}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{a.type === 'outbound' ? a.conv : '—'}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-faint)' }}>{a.created}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setDrawerAgent(a)}>View</button>
                    {a.status === 'Active' && <button className="btn btn-ghost btn-sm" onClick={() => pauseResumeAgent(a.id)} style={{ color: 'var(--warning-bg)' }}>Pause</button>}
                    {a.status === 'Paused' && <button className="btn btn-ghost btn-sm" onClick={() => pauseResumeAgent(a.id)} style={{ color: 'var(--success-bg)' }}>Resume</button>}
                    <button className="btn btn-ghost btn-sm" onClick={() => { if (confirm(`Are you sure you want to delete "${a.name}"?`)) deleteAgent(a.id); }} style={{ color: 'var(--danger)' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* GRID VIEW */}
      {agentView === 'grid' && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {filtered.map(a => (
            <div key={a.id} className="agent-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="agent-avatar" style={{ background: `linear-gradient(135deg, ${a.color} 0%, var(--primary-light) 100%)` }}>
                  {a.type === 'outbound' ? <PhoneOutgoing size={18} /> : <PhoneIncoming size={18} />}
                </span>
                <Badge status={a.status} />
              </div>
              <div>
                <h4 className="agent-card-title">{a.name}</h4>
                <div className="agent-card-meta">{a.type === 'outbound' ? 'Outbound' : 'Inbound'} · {a.template} · Created {a.created}</div>
              </div>
              <div className="agent-card-stats">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <b className="agent-card-stat-val">{a.calls.toLocaleString()}</b>
                  <span className="agent-card-stat-label">Total calls</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <b className="agent-card-stat-val">{a.type === 'outbound' ? a.conv : '—'}</b>
                  <span className="agent-card-stat-label">Conversions</span>
                </div>
              </div>
              <div className="flex gap-2" style={{ marginTop: 6 }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setDrawerAgent(a)}>View details</button>
                {a.status === 'Active' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => pauseResumeAgent(a.id)} aria-label={`Pause ${a.name}`} style={{ color: 'var(--warning-bg)' }}>
                    <Pause size={14} />
                  </button>
                )}
                {a.status === 'Paused' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => pauseResumeAgent(a.id)} aria-label={`Resume ${a.name}`} style={{ color: 'var(--success-bg)' }}>
                    <Play size={14} />
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => { if (confirm(`Are you sure you want to delete "${a.name}"?`)) deleteAgent(a.id); }} aria-label={`Delete ${a.name}`} style={{ color: 'var(--danger)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DRAWER */}
      <Drawer open={!!drawerAgent} onClose={() => setDrawerAgent(null)} title={drawerAgent?.name || 'Agent details'}>
        {drawerAgent && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, background: drawerAgent.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                {drawerAgent.type === 'outbound' ? <PhoneOutgoing size={20} /> : <PhoneIncoming size={20} />}
              </span>
              <div>
                <Badge status={drawerAgent.status} />
                <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>{drawerAgent.type === 'outbound' ? 'Outbound' : 'Inbound'} · {drawerAgent.template}</div>
              </div>
            </div>
            <div className="summary-block">
              <h4>Performance</h4>
              {[['Total calls', drawerAgent.calls.toLocaleString()], ['Conversions', drawerAgent.type === 'outbound' ? String(drawerAgent.conv) : '—'], ['Created', drawerAgent.created]].map(([l, v]) => (
                <div key={l} className="summary-row"><span style={{ color: 'var(--text-soft)' }}>{l}</span><span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span></div>
              ))}
            </div>
            <div className="summary-block">
              <h4>Configuration</h4>
              {[['Voice', 'Aria (Warm, Female)'], ['Knowledge sources', '2 connected'], ['Connectors', 'Salesforce, Google Calendar']].map(([l, v]) => (
                <div key={l} className="summary-row"><span style={{ color: 'var(--text-soft)' }}>{l}</span><span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span></div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { if (drawerAgent) { startEdit(drawerAgent); navigate('/app/create'); setDrawerAgent(null); } }}>
                  <Plus size={15} /> Edit
                </button>
                 {drawerAgent.calls > 0 ? (
                   <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => {
                     if (drawerAgent.type === 'outbound' && drawerAgent.callTasks && drawerAgent.callTasks.length > 0) {
                       navigate(`/app/campaign-analytics/${drawerAgent.id}`);
                     } else {
                       navigate('/app/analytics');
                     }
                     setDrawerAgent(null);
                   }}>
                     <BarChart3 size={15} /> Analytics
                   </button>
                 ) : (
                   <button className="btn btn-ghost" style={{ flex: 1, opacity: 0.5, cursor: 'not-allowed' }} disabled title="Analytics locked. Start a campaign first to collect call data.">
                     <Lock size={14} /> Analytics (Locked)
                   </button>
                 )}
              </div>
              {drawerAgent.type === 'outbound' && (
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { navigate(`/app/campaign/${drawerAgent.id}`); setDrawerAgent(null); }}>
                  <Rocket size={15} /> Campaign setup
                </button>
              )}
              <button className="btn btn-ghost" style={{ width: '100%', color: 'var(--danger)', marginTop: 8 }} onClick={() => { if (drawerAgent && confirm(`Are you sure you want to delete "${drawerAgent.name}"?`)) { deleteAgent(drawerAgent.id); setDrawerAgent(null); } }}>
                <Trash2 size={15} /> Delete Agent
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
