import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, PhoneCall, Timer, AlertTriangle,
  MessageSquare, FileText, ChevronRight, X, Play, Pause, AlertCircle, CheckCircle2, User, Phone
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import type { CallTask } from '../../../types';

export const CampaignAnalyticsScreen: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { agents, pauseResumeAgent } = useApp();

  const agent = agents.find(a => a.id === agentId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<CallTask | null>(null);

  if (!agent) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Campaign not found</h2>
        <p style={{ color: 'var(--text-soft)', marginBottom: 20 }}>The campaign you are looking for does not exist or has been removed.</p>
        <button className="btn btn-primary" onClick={() => navigate('/app/agents')}>
          Go to My Agents
        </button>
      </div>
    );
  }

  const tasks = agent.callTasks || [];
  const completedTasks = tasks.filter(t => t.status === 'Completed');
  const queueTasks = tasks.filter(t => t.status === 'In Queue');

  const totalTasksCount = tasks.length;
  const completedCount = completedTasks.length;
  const queueCount = queueTasks.length;

  const escalationCount = completedTasks.filter(t => t.escalationRequired).length;
  const escalationRate = completedCount > 0 ? ((escalationCount / completedCount) * 100).toFixed(0) : '0';

  const filteredTasks = tasks.filter(t =>
    t.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.contactPhone.includes(searchQuery)
  );

  return (
    <div className="screen-anim" style={{ padding: '30px 34px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 4 }} onClick={() => navigate('/app/agents')}>
            <ArrowLeft size={15} /> Back
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="badge badge-info" style={{ textTransform: 'uppercase', letterSpacing: '.8px', fontSize: 10, fontWeight: 700 }}>
                Outbound Campaign
              </span>
              <span className={`badge ${agent.status === 'Active' ? 'bg-success' : agent.status === 'Paused' ? 'bg-warning' : 'bg-default'}`}>
                {agent.status}
              </span>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.5px', marginBottom: 2 }}>{agent.name}</h2>
            <p style={{ color: 'var(--text-soft)', fontSize: 13.5 }}>Template: {agent.template} · ID: {agent.id}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className={`btn ${agent.status === 'Active' ? 'btn-glass' : 'btn-primary'}`}
            onClick={() => pauseResumeAgent(agent.id)}
          >
            {agent.status === 'Active' ? <><Pause size={15} /> Pause campaign</> : <><Play size={15} /> Resume campaign</>}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 28 }}>
        <StatCard label="Total target list" val={totalTasksCount} sub="Recipients from CSV" icon={<User size={18} />} color="var(--primary-light)" />
        <StatCard label="In calling queue" val={queueCount} sub="Pulsing calls queue" icon={<Timer size={18} />} color="var(--warning-bg)" pulsing={queueCount > 0 && agent.status === 'Active'} />
        <StatCard label="Completed calls" val={completedCount} sub="Successfully screens" icon={<PhoneCall size={18} />} color="var(--success-bg)" />
        <StatCard label="Escalations rate" val={`${escalationRate}%`} sub={`${escalationCount} require attention`} icon={<AlertTriangle size={18} />} color="var(--accent)" />
      </div>

      {/* Main content table */}
      <div className="card">
        {/* Search & filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Recipient Call Tasks</h3>
          <div style={{ position: 'relative', width: 280 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', display: 'flex', alignItems: 'center' }}>
              <Search size={14} />
            </span>
            <input
              className="input"
              style={{ paddingLeft: 34, fontSize: 13, height: 36 }}
              placeholder="Search contact or phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Call tasks table list */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <th style={thStyle}>Contact info</th>
                <th style={thStyle}>Call status</th>
                <th style={thStyle}>Summary</th>
                <th style={thStyle}>Key Action Item</th>
                <th style={thStyle}>Escalation</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-soft)', fontSize: 13.5 }}>
                    No call tasks found.
                  </td>
                </tr>
              ) : (
                filteredTasks.map(t => (
                  <tr key={t.id} className="row-item-hover" style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setSelectedTask(t)}>
                    <td style={tdStyle}>
                      <div>
                        <b style={{ fontSize: 13.5, color: 'var(--text)', display: 'block' }}>{t.contactName}</b>
                        <span style={{ fontSize: 11.5, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={10} /> {t.contactPhone}
                        </span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span className={`badge ${t.status === 'Completed' ? 'bg-success' : t.status === 'In Queue' ? 'bg-warning' : 'bg-default'}`} style={{
                        animation: t.status === 'In Queue' && agent.status === 'Active' ? 'pulse 2s infinite' : 'none'
                      }}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ color: 'var(--text-soft)' }}>{t.summary || '—'}</span>
                    </td>
                    <td style={{ ...tdStyle, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ color: 'var(--text-soft)' }}>{t.actionItem || '—'}</span>
                    </td>
                    <td style={tdStyle}>
                      {t.status === 'Completed' ? (
                        t.escalationRequired ? (
                          <span className="badge bg-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <AlertCircle size={10} /> Yes
                          </span>
                        ) : (
                          <span className="badge" style={{ background: 'var(--border)', color: 'var(--text-soft)' }}>
                            No
                          </span>
                        )
                      ) : (
                        <span style={{ color: 'var(--text-faint)' }}>—</span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button className="btn btn-ghost btn-xs" style={{ padding: '4px 8px' }} onClick={e => { e.stopPropagation(); setSelectedTask(t); }}>
                        View details <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task detail modal dialog */}
      {selectedTask && (
        <div style={modalOverlayStyle} onClick={() => setSelectedTask(null)} role="dialog" aria-modal="true">
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800 }}>Recipient Call Details</h3>
                <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>Task ID: {selectedTask.id}</span>
              </div>
              <button className="icon-btn" onClick={() => setSelectedTask(null)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, padding: 24, maxHeight: 'calc(80vh - 80px)', overflowY: 'auto' }}>
              {/* Left Column: Transcript */}
              <div>
                <h4 style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MessageSquare size={14} /> Call Transcript
                </h4>
                {selectedTask.status !== 'Completed' ? (
                  <div style={{ padding: 40, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 12, color: 'var(--text-faint)', fontSize: 13 }}>
                    Call has not been made yet. Transcript will appear once calling is completed.
                  </div>
                ) : !selectedTask.transcript || selectedTask.transcript.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 12, color: 'var(--text-faint)', fontSize: 13 }}>
                    Transcript unavailable for this call.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg)', borderRadius: 14, padding: 18, border: '1px solid var(--border)' }}>
                    {selectedTask.transcript.map((line, idx) => {
                      const isAgent = line.role === 'agent';
                      return (
                        <div key={idx} style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignSelf: isAgent ? 'flex-start' : 'flex-end',
                          maxWidth: '85%'
                        }}>
                          <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 2, alignSelf: isAgent ? 'flex-start' : 'flex-end' }}>
                            {isAgent ? 'AI Agent' : selectedTask.contactName}
                          </span>
                          <div style={{
                            background: isAgent ? 'var(--card)' : 'var(--grad)',
                            color: isAgent ? 'var(--text)' : '#fff',
                            padding: '10px 14px',
                            borderRadius: 12,
                            fontSize: 13,
                            lineHeight: 1.5,
                            border: isAgent ? '1px solid var(--border)' : 'none',
                            boxShadow: 'var(--shadow-sm)'
                          }}>
                            {line.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: AI Summary & Flags */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Meta details */}
                <div className="card card-pad" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Contact details</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <MetaRow label="Name" value={selectedTask.contactName} />
                    <MetaRow label="Phone" value={selectedTask.contactPhone} />
                    <MetaRow label="Status" value={
                      <span className={`badge ${selectedTask.status === 'Completed' ? 'bg-success' : 'bg-warning'}`}>
                        {selectedTask.status}
                      </span>
                    } />
                    {selectedTask.customData && Object.entries(selectedTask.customData).map(([k, v]) => (
                      <MetaRow key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={v} />
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="card card-pad" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={14} /> AI Call Summary
                  </h4>
                  <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.6, margin: 0 }}>
                    {selectedTask.summary || 'Summary is queued and will generate after the call concludes.'}
                  </p>
                </div>

                {/* Follow up Action */}
                <div className="card card-pad" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Next Action / Remark</h4>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, marginTop: 2 }}>
                      <CheckCircle2 size={12} />
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.5, margin: 0 }}>
                      {selectedTask.actionItem || 'Action items will generate following the call.'}
                    </p>
                  </div>
                </div>

                {/* Escalation Flag indicator */}
                {selectedTask.status === 'Completed' && (
                  <div className="card card-pad" style={{
                    background: selectedTask.escalationRequired ? 'rgba(231, 76, 60, 0.06)' : 'var(--bg)',
                    border: selectedTask.escalationRequired ? '1px solid rgba(231, 76, 60, 0.25)' : '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: selectedTask.escalationRequired ? 'var(--danger-bg)' : 'var(--border)',
                        color: selectedTask.escalationRequired ? 'var(--danger)' : 'var(--text-soft)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <AlertTriangle size={15} />
                      </div>
                      <div>
                        <b style={{ fontSize: 13.5, color: selectedTask.escalationRequired ? 'var(--danger)' : 'var(--text)', display: 'block' }}>
                          {selectedTask.escalationRequired ? 'Human escalation required' : 'No escalation required'}
                        </b>
                        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                          {selectedTask.escalationRequired ? 'This customer asked a question requiring human staff review.' : 'The AI handled the screen script successfully.'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Subcomponents ─────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  val: string | number;
  sub: string;
  icon: React.ReactNode;
  color: string;
  pulsing?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, val, sub, icon, color, pulsing }) => (
  <div className="ov-stat-card" style={{
    position: 'relative',
    border: pulsing ? '1px solid var(--warning-bg)' : undefined,
    boxShadow: pulsing ? '0 0 12px 0 rgba(245, 166, 35, 0.15)' : undefined
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      {pulsing && (
        <span className="ov-stat-trend-badge up" style={{ background: 'var(--warning-bg)', color: '#fff', animation: 'pulse 1.8s infinite' }}>
          LIVE CALLS
        </span>
      )}
    </div>
    <div>
      <div className="ov-stat-val">{val}</div>
      <div className="stat-label" style={{ marginTop: 2, fontSize: 12.5, fontWeight: 700 }}>{label}</div>
      <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{sub}</span>
    </div>
  </div>
);

const MetaRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
    <span style={{ color: 'var(--text-soft)' }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text)', textAlign: 'right' }}>{value}</span>
  </div>
);

const thStyle: React.CSSProperties = {
  padding: '12px 20px',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '.8px',
  color: 'var(--text-faint)'
};

const tdStyle: React.CSSProperties = {
  padding: '14px 20px',
  verticalAlign: 'middle',
  fontSize: 13
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(15, 11, 26, 0.45)',
  backdropFilter: 'blur(8px)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20
};

const modalContentStyle: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  width: '100%',
  maxWidth: 960,
  maxHeight: '80vh',
  boxShadow: 'var(--shadow-lg)',
  display: 'flex',
  flexDirection: 'column',
  animation: 'fadeUp 0.3s ease-out'
};

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '18px 24px',
  borderBottom: '1px solid var(--border)'
};
