import React, { useState } from 'react';
import {
  ArrowLeft, UploadCloud, FileText, Trash2, User, Plus,
  Briefcase, ChevronRight, Rocket, CheckCircle2, X, Calendar
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';

// ─── Candidate row ─────────────────────────────────────────────────────────
interface Candidate {
  id: string;
  name: string;
  phone: string;
  [key: string]: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 8);
const blankCandidate = (fields: { key: string }[]): Candidate => {
  const c: any = { id: uid() };
  fields.forEach(f => {
    c[f.key] = '';
  });
  return c;
};

const PHONE_POOL = [
  '+1 (415) 555-0132',
  '+1 (650) 555-0198',
  '+1 (212) 555-0167',
  '+1 (312) 555-0143',
];

const isValidPhone = (phone: string) => {
  const clean = phone.replace(/[\s\-\(\)\+]/g, '');
  return /^\d{7,15}$/.test(clean);
};

const FIELDS_MAP: Record<string, { key: string; label: string; placeholder: string }[]> = {
  ob_recruit: [
    { key: 'name', label: 'Full name', placeholder: 'Priya Sharma' },
    { key: 'phone', label: 'Phone number', placeholder: '+1 (415) 555-0001' },
    { key: 'email', label: 'Email', placeholder: 'priya@email.com' },
    { key: 'experience', label: 'Experience', placeholder: '3 yrs' }
  ],
  ob_nps: [
    { key: 'name', label: 'Customer name', placeholder: 'Aisha Patel' },
    { key: 'phone', label: 'Phone number', placeholder: '+1 (650) 555-0198' },
    { key: 'email', label: 'Email', placeholder: 'aisha@email.com' },
    { key: 'service', label: 'Recent service', placeholder: 'Order Delivery' }
  ],
  ob_lead_qual: [
    { key: 'name', label: 'Lead name', placeholder: 'Marcus Johnson' },
    { key: 'phone', label: 'Phone number', placeholder: '+1 (212) 555-0167' },
    { key: 'company', label: 'Company name', placeholder: 'Acme Corp' },
    { key: 'role', label: 'Job role', placeholder: 'Product Manager' }
  ],
  ob_reminder: [
    { key: 'name', label: 'Client name', placeholder: 'Divya Sharma' },
    { key: 'phone', label: 'Phone number', placeholder: '+1 (312) 555-0143' },
    { key: 'date', label: 'Appt Date/Time', placeholder: 'Oct 12, 10:00 AM' },
    { key: 'provider', label: 'Provider Name', placeholder: 'Dr. Smith' }
  ],
  ob_delivery: [
    { key: 'name', label: 'Customer name', placeholder: 'Lucas Weber' },
    { key: 'phone', label: 'Phone number', placeholder: '+1 (415) 555-0211' },
    { key: 'orderId', label: 'Order ID', placeholder: 'ORD-98421' },
    { key: 'address', label: 'Delivery Address', placeholder: '123 Main St, SF' }
  ],
  ob_renewal: [
    { key: 'name', label: 'Policyholder', placeholder: 'Rohan Gupta' },
    { key: 'phone', label: 'Phone number', placeholder: '+1 (650) 555-0342' },
    { key: 'subId', label: 'Policy/Sub ID', placeholder: 'POL-33291' },
    { key: 'renewalDate', label: 'Renewal Date', placeholder: 'Nov 1, 2026' }
  ],
  ob_emi: [
    { key: 'name', label: 'Account name', placeholder: 'Sage Patel' },
    { key: 'phone', label: 'Phone number', placeholder: '+1 (212) 555-0183' },
    { key: 'accountId', label: 'Account ID', placeholder: 'ACC-88329' },
    { key: 'amount', label: 'Amount due', placeholder: '$149.00' }
  ],
  ob_event: [
    { key: 'name', label: 'Registrant name', placeholder: 'Aarav Mehta' },
    { key: 'phone', label: 'Phone number', placeholder: '+1 (312) 555-0499' },
    { key: 'regId', label: 'Registration ID', placeholder: 'REG-10948' },
    { key: 'format', label: 'Format (Virtual/In-person)', placeholder: 'In-person' }
  ],
  custom_agent: [
    { key: 'name', label: 'Contact name', placeholder: 'John Doe' },
    { key: 'phone', label: 'Phone number', placeholder: '+1 (555) 019-2831' },
    { key: 'email', label: 'Email', placeholder: 'john@example.com' },
    { key: 'notes', label: 'Custom note', placeholder: 'VIP Client' }
  ]
};

const DOC_CONFIG: Record<string, { label: string; desc: string }> = {
  ob_recruit: { label: 'Job description', desc: 'Upload the JD — the AI uses it to brief candidates and qualify responses.' },
  ob_nps: { label: 'Interaction context / script', desc: 'Upload recent service transaction FAQs or script rules for survey contexts.' },
  ob_lead_qual: { label: 'Product specification / sales sheet', desc: 'Upload product/service spec docs to help the AI answer lead inquiries.' },
  ob_reminder: { label: 'Clinic cancellation / reschedule FAQ', desc: 'Upload cancellation window policy and rescheduling rules for guidance.' },
  ob_delivery: { label: 'Shipping / delivery guide', desc: 'Upload safe drop location rules, gate code guidelines, and delivery FAQs.' },
  ob_renewal: { label: 'Retention policy / plan guide', desc: 'Upload plan tiers, grace period details, and policy renewal guidelines.' },
  ob_emi: { label: 'Billing / payment terms FAQ', desc: 'Upload payment methods, billing support channels, and grace periods.' },
  ob_event: { label: 'Event agenda / guide', desc: 'Upload event schedules, speaker bios, dress code, and join instructions.' },
  custom_agent: { label: 'Knowledge base context document', desc: 'Upload any background context document to help guide the AI agent.' }
};

const LABEL_CONFIG: Record<string, { primary: string; primaryPlaceholder: string; primaryLabel: string }> = {
  ob_recruit: { primary: 'Job position / role *', primaryPlaceholder: 'e.g. Senior Frontend Engineer', primaryLabel: 'Job position' },
  ob_nps: { primary: 'Feedback topic / interaction *', primaryPlaceholder: 'e.g. Delivery Call Survey', primaryLabel: 'Feedback topic' },
  ob_lead_qual: { primary: 'Product / service of interest *', primaryPlaceholder: 'e.g. Cloud ERP Software', primaryLabel: 'Product/service' },
  ob_reminder: { primary: 'Clinic / provider name *', primaryPlaceholder: 'e.g. Acme Dental Clinic', primaryLabel: 'Clinic/provider' },
  ob_delivery: { primary: 'Business name / store *', primaryPlaceholder: 'e.g. Acme Retail Store', primaryLabel: 'Business name' },
  ob_renewal: { primary: 'Subscription / policy provider *', primaryPlaceholder: 'e.g. Acme Car Insurance', primaryLabel: 'Policy/sub provider' },
  ob_emi: { primary: 'Service name *', primaryPlaceholder: 'e.g. Gym Membership Dues', primaryLabel: 'Service name' },
  ob_event: { primary: 'Event name *', primaryPlaceholder: 'e.g. SaaS Annual Webinar', primaryLabel: 'Event name' },
  custom_agent: { primary: 'Campaign purpose / goal *', primaryPlaceholder: 'e.g. React Outreach campaign', primaryLabel: 'Campaign purpose' }
};

// ─── Component ─────────────────────────────────────────────────────────────
export const CampaignLaunchScreen: React.FC = () => {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId: string }>();
  const { agents, startCampaign, toast, outboundTemplates } = useApp();

  const agent = agents.find(a => a.id === agentId) || agents[0];

  // Find template by name
  const templateMatch = outboundTemplates.find(t => t.name === agent?.template);
  const templateId = templateMatch ? templateMatch.id : 'custom_agent';

  const activeFields = agent?.contactFields || FIELDS_MAP[templateId] || FIELDS_MAP.custom_agent;
  const activeDoc = DOC_CONFIG[templateId] || DOC_CONFIG.custom_agent;
  const activeLabel = LABEL_CONFIG[templateId] || LABEL_CONFIG.custom_agent;

  // JD state
  const [jdFile, setJdFile] = useState<string | null>(null);
  const [jdDragOver, setJdDragOver] = useState(false);

  // Scheduling state
  const [scheduleType, setScheduleType] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledTime, setScheduledTime] = useState<string>('');

  // Candidates state
  const [candidates, setCandidates] = useState<Candidate[]>(() => [blankCandidate(activeFields)]);
  const [csvName, setCsvName] = useState<string | null>(null);

  // Phone number
  const [selectedPhone, setSelectedPhone] = useState(PHONE_POOL[0]);

  // Campaign details
  const [campaignName, setCampaignName] = useState(agent?.name || '');
  const [position, setPosition] = useState('');
  const [maxConcurrent, setMaxConcurrent] = useState('5');

  // Step-based section expand state
  const [launched, setLaunched] = useState(false);

  const handleJdDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setJdDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setJdFile(file.name);
  };

  const addCandidate = () => setCandidates(c => [...c, blankCandidate(activeFields)]);
  const removeCandidate = (id: string) => setCandidates(c => c.filter(x => x.id !== id));
  const updateCandidate = (id: string, field: string, val: string) =>
    setCandidates(c => c.map(x => x.id === id ? { ...x, [field]: val } : x));

  const handleCsvUpload = (file: File | null) => {
    if (!file) return;
    setCsvName(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      
      const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
      
      if (lines.length >= 2 && lines[0].includes(',')) {
        const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
        const parsed = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
          const row: any = { id: uid() };
          activeFields.forEach(f => {
            const colIdx = headers.findIndex(h => h === f.key.toLowerCase() || h === f.label.toLowerCase() || h.includes(f.key.toLowerCase()));
            if (colIdx !== -1 && colIdx < values.length) {
              row[f.key] = values[colIdx];
            } else {
              row[f.key] = '';
            }
          });
          return row;
        });

        const valid = parsed.filter(c => c.name || c.phone);
        if (valid.length > 0) {
          setCandidates(valid);
          return;
        }
      }

      // Fallback mock datasets of size 5
      const mockDataMap: Record<string, any[]> = {
        ob_recruit: [
          { name: 'Aisha Patel', phone: '+1 (415) 555-0211', email: 'aisha@email.com', experience: '3 yrs' },
          { name: 'Marcus Johnson', phone: '+1 (650) 555-0342', email: 'marcus@email.com', experience: '5 yrs' },
          { name: 'Divya Sharma', phone: '+1 (212) 555-0183', email: 'divya@email.com', experience: '2 yrs' },
          { name: 'Lucas Weber', phone: '+1 (312) 555-0499', email: 'lucas@email.com', experience: '4 yrs' },
          { name: 'Sage Patel', phone: '+1 (212) 555-0984', email: 'sage@email.com', experience: '6 yrs' }
        ],
        ob_nps: [
          { name: 'Aisha Patel', phone: '+1 (415) 555-0211', email: 'aisha@email.com', service: 'Delivery Call' },
          { name: 'Marcus Johnson', phone: '+1 (650) 555-0342', email: 'marcus@email.com', service: 'Support Ticket' },
          { name: 'Divya Sharma', phone: '+1 (212) 555-0183', email: 'divya@email.com', service: 'App Setup' },
          { name: 'Rohan Gupta', phone: '+1 (312) 555-0812', email: 'rohan@email.com', service: 'Onboarding Call' },
          { name: 'Sage Patel', phone: '+1 (650) 555-0999', email: 'sage@email.com', service: 'Renewal Setup' }
        ],
        ob_lead_qual: [
          { name: 'Marcus Johnson', phone: '+1 (650) 555-0342', company: 'Acme Corp', role: 'CTO' },
          { name: 'Divya Sharma', phone: '+1 (212) 555-0183', company: 'Initech', role: 'HR Manager' },
          { name: 'Lucas Weber', phone: '+1 (312) 555-0499', company: 'Hooli Inc', role: 'Director' },
          { name: 'Sage Patel', phone: '+1 (212) 555-0984', company: 'Stark Industries', role: 'VP Operations' },
          { name: 'Rohan Gupta', phone: '+1 (650) 555-0991', company: 'Pied Piper', role: 'Lead Developer' }
        ],
        ob_reminder: [
          { name: 'Divya Sharma', phone: '+1 (212) 555-0183', date: 'Oct 12, 10:00 AM', provider: 'Dr. Jones' },
          { name: 'Lucas Weber', phone: '+1 (312) 555-0499', date: 'Oct 12, 11:30 AM', provider: 'Dr. Jones' },
          { name: 'Aisha Patel', phone: '+1 (415) 555-0211', date: 'Oct 12, 2:00 PM', provider: 'Dr. Smith' },
          { name: 'Marcus Johnson', phone: '+1 (650) 555-0342', date: 'Oct 12, 3:30 PM', provider: 'Dr. Jones' },
          { name: 'Sage Patel', phone: '+1 (212) 555-0984', date: 'Oct 13, 9:00 AM', provider: 'Dr. Smith' }
        ],
        ob_delivery: [
          { name: 'Lucas Weber', phone: '+1 (312) 555-0499', orderId: 'ORD-10932', address: '456 Oak St, Chicago' },
          { name: 'Aisha Patel', phone: '+1 (415) 555-0211', orderId: 'ORD-88321', address: '123 Main St, SF' },
          { name: 'Marcus Johnson', phone: '+1 (650) 555-0342', orderId: 'ORD-44910', address: '789 Pine St, Palo Alto' },
          { name: 'Divya Sharma', phone: '+1 (212) 555-0183', orderId: 'ORD-11029', address: '12 Varick St, NYC' },
          { name: 'Sage Patel', phone: '+1 (212) 555-0984', orderId: 'ORD-55421', address: '789 Beach Blvd, Miami' }
        ],
        ob_renewal: [
          { name: 'Rohan Gupta', phone: '+1 (650) 555-0342', subId: 'SUB-98421', renewalDate: 'Nov 1, 2026' },
          { name: 'Sage Patel', phone: '+1 (212) 555-0183', subId: 'SUB-22910', renewalDate: 'Nov 15, 2026' },
          { name: 'Aarav Mehta', phone: '+1 (312) 555-0499', subId: 'SUB-33049', renewalDate: 'Dec 1, 2026' },
          { name: 'Aisha Patel', phone: '+1 (415) 555-0211', subId: 'SUB-44021', renewalDate: 'Dec 15, 2026' },
          { name: 'Marcus Johnson', phone: '+1 (650) 555-0342', subId: 'SUB-55912', renewalDate: 'Jan 5, 2027' }
        ],
        ob_emi: [
          { name: 'Sage Patel', phone: '+1 (212) 555-0183', accountId: 'ACC-88329', amount: '$149.00' },
          { name: 'Aarav Mehta', phone: '+1 (312) 555-0499', accountId: 'ACC-11029', amount: '$89.50' },
          { name: 'John Doe', phone: '+1 (555) 019-2831', accountId: 'ACC-33491', amount: '$199.99' },
          { name: 'Aisha Patel', phone: '+1 (415) 555-0211', accountId: 'ACC-44912', amount: '$120.00' },
          { name: 'Marcus Johnson', phone: '+1 (650) 555-0342', accountId: 'ACC-55219', amount: '$249.50' }
        ],
        ob_event: [
          { name: 'Aarav Mehta', phone: '+1 (312) 555-0499', regId: 'REG-10948', format: 'In-person' },
          { name: 'John Doe', phone: '+1 (555) 019-2831', regId: 'REG-88432', format: 'Virtual' },
          { name: 'Priya Sharma', phone: '+1 (415) 555-0001', regId: 'REG-33492', format: 'In-person' },
          { name: 'Aisha Patel', phone: '+1 (415) 555-0211', regId: 'REG-44910', format: 'Virtual' },
          { name: 'Marcus Johnson', phone: '+1 (650) 555-0342', regId: 'REG-55291', format: 'Virtual' }
        ],
        custom_agent: [
          { name: 'John Doe', phone: '+1 (555) 019-2831', email: 'john@example.com', notes: 'VIP Client' },
          { name: 'Jane Smith', phone: '+1 (555) 019-4829', email: 'jane@example.com', notes: 'Partner' },
          { name: 'Bob Johnson', phone: '+1 (555) 019-1122', email: 'bob@example.com', notes: 'Lead' },
          { name: 'Alice Williams', phone: '+1 (555) 019-3344', email: 'alice@example.com', notes: 'Referral' },
          { name: 'Charlie Brown', phone: '+1 (555) 019-5566', email: 'charlie@example.com', notes: 'VIP Client' }
        ]
      };
      
      const items = mockDataMap[templateId] || mockDataMap.custom_agent;
      const candidatesList = items.map((item) => {
        const row: any = { id: uid() };
        activeFields.forEach(f => {
          row[f.key] = item[f.key] || '';
        });
        return row;
      });
      
      setCandidates(candidatesList);
    };
    reader.readAsText(file);
  };

  const handleLaunch = () => {
    if (!position) { toast(`Enter the ${activeLabel.primaryLabel.toLowerCase()}.`, 'alert-triangle'); return; }
    if (!jdFile) { toast(`Upload a ${activeDoc.label.toLowerCase()} first.`, 'alert-triangle'); return; }
    const filledCandidates = candidates.filter(c => c.name && c.phone);
    if (filledCandidates.length === 0) { toast('Add at least one contact with name and phone.', 'alert-triangle'); return; }
    
    const hasInvalidPhone = filledCandidates.some(c => !isValidPhone(c.phone));
    if (hasInvalidPhone) {
      toast('Please correct the invalid phone formats highlighted in red.', 'alert-triangle');
      return;
    }

    let epochMs: number | null = null;
    if (scheduleType === 'scheduled') {
      if (!scheduledTime) {
        toast('Please pick a start time for your scheduled campaign.', 'alert-triangle');
        return;
      }
      epochMs = new Date(scheduledTime).getTime();
      if (isNaN(epochMs)) {
        toast('Please enter a valid scheduled date and time.', 'alert-triangle');
        return;
      }
      if (epochMs < Date.now()) {
        toast('Scheduled time must be in the future.', 'alert-triangle');
        return;
      }
    }

    const callTasks = filledCandidates.map((c, idx) => {
      const customData: Record<string, string> = {};
      activeFields.forEach(f => {
        if (f.key !== 'name' && f.key !== 'phone') {
          customData[f.key] = c[f.key] || '';
        }
      });
      return {
        id: `task_${agent?.id || 'new'}_${idx}_${uid()}`,
        contactName: c.name,
        contactPhone: c.phone,
        status: epochMs ? 'Scheduled' as const : 'In Queue' as const,
        escalationRequired: false,
        customData
      };
    });

    if (agent) {
      startCampaign(agent.id, campaignName || agent.name, callTasks, epochMs);
    }

    setLaunched(true);
    setTimeout(() => navigate(`/app/campaign-analytics/${agent?.id || 'new'}`), 2200);
  };

  if (launched) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, animation: 'fadeUp .4s ease' }}>
          <CheckCircle2 size={40} color="#fff" />
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.6px', marginBottom: 10 }}>Campaign launched! 🎉</h2>
        <p style={{ fontSize: 15, color: 'var(--text-soft)', maxWidth: 420, lineHeight: 1.6 }}>
          Your outbound agent is dialing contacts. Redirecting to My Agents…
        </p>
      </div>
    );
  }

  return (
    <div className="screen-anim" style={{ padding: '30px 34px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 32 }}>
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 4 }} onClick={() => navigate('/app/agents')}>
          <ArrowLeft size={15} /> Back
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--border)', padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: 'var(--primary-light)', marginBottom: 8 }}>
            <Rocket size={12} /> CAMPAIGN SETUP
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.5px', marginBottom: 4 }}>{campaignName || 'New Campaign'}</h2>
          <p style={{ color: 'var(--text-soft)', fontSize: 13.5 }}>Configure your campaign details before the AI starts calling contacts.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28, alignItems: 'start' }}>
        {/* ─── LEFT COLUMN ──────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Section 1: Campaign Details */}
          <div className="card card-pad" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <SectionHead icon={<Briefcase size={16} />} title="Campaign details" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
              <div className="field">
                <label className="field-label" htmlFor="campaignName" style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--text-soft)' }}>Campaign name</label>
                <input className="input" id="campaignName" placeholder="e.g. Q3 Outreach Drive" value={campaignName} onChange={e => setCampaignName(e.target.value)} style={{ padding: '10px 14px', fontSize: 13.5 }} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="position" style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--text-soft)' }}>{activeLabel.primary}</label>
                <input className="input" id="position" placeholder={activeLabel.primaryPlaceholder} value={position} onChange={e => setPosition(e.target.value)} style={{ padding: '10px 14px', fontSize: 13.5 }} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="concurrent" style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--text-soft)' }}>Max concurrent calls</label>
                <select className="input select-field" id="concurrent" value={maxConcurrent} onChange={e => setMaxConcurrent(e.target.value)} style={{ padding: '10px 14px', fontSize: 13.5 }}>
                  {['1','2','5','10','20','50'].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="callPhone" style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--text-soft)' }}>Outbound number</label>
                <select className="input select-field" id="callPhone" value={selectedPhone} onChange={e => setSelectedPhone(e.target.value)} style={{ padding: '10px 14px', fontSize: 13.5 }}>
                  {PHONE_POOL.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section 1.5: Scheduling & Timing */}
          <div className="card card-pad" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <SectionHead icon={<Calendar size={16} />} title="Scheduling & Timing" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
              <div className="field">
                <label className="field-label" htmlFor="scheduleType" style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--text-soft)' }}>Timing trigger</label>
                <select className="input select-field" id="scheduleType" value={scheduleType} onChange={e => setScheduleType(e.target.value as 'immediate' | 'scheduled')} style={{ padding: '10px 14px', fontSize: 13.5 }}>
                  <option value="immediate">Immediate (Dial now)</option>
                  <option value="scheduled">Schedule for later</option>
                </select>
              </div>
              {scheduleType === 'scheduled' && (
                <div className="field">
                  <label className="field-label" htmlFor="scheduledTime" style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--text-soft)' }}>Preferred start time</label>
                  <input
                    type="datetime-local"
                    className="input"
                    id="scheduledTime"
                    value={scheduledTime}
                    onChange={e => setScheduledTime(e.target.value)}
                    style={{ padding: '10px 14px', fontSize: 13.5 }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 2: JD / Context Upload */}
          <div className="card card-pad" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <SectionHead icon={<FileText size={16} />} title={activeDoc.label} badge="Required" />
            <p style={{ fontSize: 12.5, color: 'var(--text-soft)', margin: '6px 0 18px' }}>
              {activeDoc.desc}
            </p>
            {jdFile ? (
              <div className="kb-item" style={{ marginBottom: 0, padding: '12px 16px', borderRadius: 12, border: '1.5px solid var(--border)' }}>
                <span style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(92, 45, 145, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-light)', flexShrink: 0 }}>
                  <FileText size={18} />
                </span>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 13.5, color: 'var(--text)', display: 'block' }}>{jdFile}</b>
                  <span style={{ fontSize: 11.5, color: 'var(--success)' }}>{activeDoc.label} uploaded successfully</span>
                </div>
                <button className="icon-btn" style={{ color: 'var(--danger)' }} onClick={() => setJdFile(null)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <div
                className={`upload-zone ${jdDragOver ? 'drag' : ''}`}
                style={{ padding: '34px 24px', transition: 'var(--transition)' }}
                onDragOver={e => { e.preventDefault(); setJdDragOver(true); }}
                onDragLeave={() => setJdDragOver(false)}
                onDrop={handleJdDrop}
                onClick={() => document.getElementById('jdInput')?.click()}
                role="button" tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && document.getElementById('jdInput')?.click()}
              >
                <UploadCloud size={32} style={{ color: 'var(--primary-light)', margin: '0 auto 12px', display: 'block' }} className="animate-bounce" />
                <b style={{ display: 'block', fontSize: 14.5, color: 'var(--text)', marginBottom: 4 }}>Drag & drop your file, or click to browse</b>
                <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>Supports PDF, DOCX, or TXT</span>
                <input type="file" id="jdInput" accept=".pdf,.docx,.txt" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && setJdFile(e.target.files[0].name)} />
              </div>
            )}
          </div>

          {/* Section 3: Contacts Table */}
          <div className="card card-pad" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <SectionHead icon={<User size={16} />} title="Contacts spreadsheet" />
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => document.getElementById('csvCandidate')?.click()} style={{ padding: '8px 12px' }}>
                  <UploadCloud size={14} /> Import CSV
                </button>
                <input type="file" id="csvCandidate" accept=".csv" style={{ display: 'none' }} onChange={e => handleCsvUpload(e.target.files?.[0] ?? null)} />
                <button className="btn btn-ghost btn-sm" onClick={addCandidate} style={{ padding: '8px 12px' }}>
                  <Plus size={14} /> Add row
                </button>
              </div>
            </div>
            {csvName && (
              <div style={{ background: 'var(--success-bg)', borderRadius: 10, padding: '9px 14px', fontSize: 12.5, fontWeight: 600, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={14} /> {csvName} — {candidates.length} contacts imported
              </div>
            )}
            <p style={{ fontSize: 12.5, color: 'var(--text-soft)', marginBottom: 18 }}>
              Add contact list details manually or import a CSV file containing active headers.
            </p>

            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${activeFields.length}, 1fr) 40px`,
              gap: 12,
              padding: '10px 14px',
              background: 'var(--bg)',
              borderBottom: '1px solid var(--border)',
              borderRadius: '8px',
              marginBottom: 12
            }}>
              {activeFields.map(f => (
                <span key={f.key} style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--text-faint)' }}>{f.label}</span>
              ))}
              <span></span>
            </div>

            {/* Table Rows list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {candidates.map(c => (
                <div key={c.id} style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${activeFields.length}, 1fr) 40px`,
                  gap: 12,
                  alignItems: 'center',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'var(--transition)'
                }}>
                  {activeFields.map(f => {
                    const isPhone = f.key === 'phone';
                    const val = c[f.key] || '';
                    const hasError = isPhone && val && !isValidPhone(val);
                    return (
                      <div key={f.key} style={{ position: 'relative' }}>
                        <input
                          className="input"
                          style={{
                            fontSize: 13,
                            padding: '10px 12px',
                            border: '1px solid transparent',
                            background: hasError ? 'rgba(231,76,60,0.04)' : 'var(--bg)',
                            borderRadius: 8,
                            width: '100%',
                            borderColor: hasError ? 'var(--danger)' : 'transparent',
                            boxShadow: hasError ? '0 0 0 2px rgba(231,76,60,0.15)' : 'none',
                            transition: 'var(--transition)'
                          }}
                          placeholder={f.placeholder}
                          value={val}
                          onChange={e => updateCandidate(c.id, f.key, e.target.value)}
                        />
                        {hasError && (
                          <span style={{ position: 'absolute', bottom: -10, left: 4, fontSize: 8.5, color: 'var(--danger)', fontWeight: 600 }}>
                            Invalid format
                          </span>
                        )}
                      </div>
                    );
                  })}
                  <button className="icon-btn" style={{ color: 'var(--danger)', justifySelf: 'center', transition: 'var(--transition)' }} onClick={() => removeCandidate(c.id)} disabled={candidates.length === 1}>
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN (summary + launch) ───────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 84 }}>
          {/* Agent Card */}
          <div className="card card-pad" style={{ background: 'var(--grad)', color: '#fff', border: 'none', boxShadow: 'var(--shadow-md)', borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={22} />
              </div>
              <div>
                <b style={{ fontSize: 14.5, display: 'block' }}>{agent?.template || 'Outbound Agent'}</b>
                <span style={{ fontSize: 12, opacity: .75 }}>Outbound agent</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SummaryRow label="Agent ID" value={agent?.id || '—'} light />
              <SummaryRow label="Voice" value="Aria (Warm, Female)" light />
              <SummaryRow label="Outbound number" value={selectedPhone} light />
              <SummaryRow label="Max concurrent" value={`${maxConcurrent} calls`} light />
            </div>
          </div>

          {/* Checklist progress */}
          {(() => {
            const stepsDoneCount = [
              !!position,
              !!jdFile,
              candidates.some(c => c.name && c.phone),
              !!selectedPhone
            ].filter(Boolean).length;
            return (
              <div className="card card-pad" style={{ boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700 }}>Pre-launch checklist</h4>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-light)' }}>{stepsDoneCount}/4 ready</span>
                </div>
                <div style={{ height: 5, background: 'var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
                  <div style={{ height: '100%', width: `${(stepsDoneCount / 4) * 100}%`, background: 'var(--grad)', borderRadius: 10, transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <CheckItem done={!!position} label={position ? `${activeLabel.primaryLabel}: ${position}` : activeLabel.primaryLabel} />
                  <CheckItem done={!!jdFile} label={jdFile || `${activeDoc.label} uploaded`} />
                  <CheckItem done={candidates.some(c => c.name && c.phone)} label={`${candidates.filter(c => c.name && c.phone).length} contact(s) ready`} />
                  <CheckItem done={!!selectedPhone} label="Outbound number selected" />
                </div>
              </div>
            );
          })()}

          {/* Launch button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              className="btn btn-accent btn-lg btn-block"
              style={{ fontSize: 15, fontWeight: 800, padding: '16px 24px', borderRadius: 14, boxShadow: '0 4px 14px rgba(255, 92, 115, 0.25)' }}
              onClick={handleLaunch}
            >
              <Rocket size={18} /> Start Campaign
            </button>
            <button className="btn btn-ghost btn-block" onClick={() => navigate('/app/agents')} style={{ padding: '10px 14px', fontSize: 13.5 }}>
              <ChevronRight size={15} /> Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Helper sub-components ─────────────────────────────────────────────────

const SectionHead: React.FC<{ icon: React.ReactNode; title: string; badge?: string }> = ({ icon, title, badge }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ color: 'var(--primary-light)' }}>{icon}</span>
    <span style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text)' }}>{title}</span>
    {badge && <span className="badge badge-info" style={{ fontSize: 10, padding: '2px 8px' }}>{badge}</span>}
  </div>
);

const SummaryRow: React.FC<{ label: string; value: string; light?: boolean }> = ({ label, value, light }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
    <span style={{ opacity: light ? .65 : 1, color: light ? '#fff' : 'var(--text-soft)' }}>{label}</span>
    <span style={{ fontWeight: 600, color: light ? '#fff' : 'var(--text)', textAlign: 'right', maxWidth: '55%', wordBreak: 'break-word' }}>{value}</span>
  </div>
);

const CheckItem: React.FC<{ done: boolean; label: string }> = ({ done, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12.5 }}>
    <div style={{ width: 18, height: 18, borderRadius: '50%', background: done ? 'var(--success-bg)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'var(--transition)' }}>
      <CheckCircle2 size={11} color={done ? '#fff' : 'var(--text-faint)'} />
    </div>
    <span style={{ color: done ? 'var(--text)' : 'var(--text-faint)', transition: 'var(--transition)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
  </div>
);
