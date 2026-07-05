import React, {
  createContext, useContext, useState, useCallback, useRef, useEffect
} from 'react';
import type {
  Agent, User, WizardState, WizardData, CallTask
} from '../types';
import { initialAgents } from '../data/agents';
import { outboundTemplates, inboundTemplates } from '../data/templates';

// ─── Toast ─────────────────────────────────────────────────────────────────
interface Toast {
  id: number;
  msg: string;
  icon: string;
}

// ─── Context shape ─────────────────────────────────────────────────────────
interface AppContextType {
  // Auth
  user: User | null;
  setUser: (u: User | null) => void;

  // Agents
  agents: Agent[];
  addAgent: (a: Agent) => void;
  pauseResumeAgent: (id: string) => void;
  startCampaign: (id: string, name: string, tasks: CallTask[]) => void;

  // Wizard
  wizard: WizardState;
  startCreate: (type: 'outbound' | 'inbound') => void;
  startEdit: (agent: Agent) => void;
  cancelWizard: () => void;
  setWizardStep: (s: number) => void;
  updateWizardData: (key: keyof WizardData, val: unknown) => void;
  launchAgent: (navigate: (path: string) => void) => void;

  // Toast
  toasts: Toast[];
  toast: (msg: string, icon?: string) => void;
}

const AppContext = createContext<AppContextType>(null!);

// ─── Defaults ──────────────────────────────────────────────────────────────
const defaultWizardData = (): WizardData => ({
  connectors: {},
  connectorsConfig: {},
  kbFiles: [],
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  triggerType: 'immediate',
  windowStart: '09:00',
  windowEnd: '18:00',
  timezone: 'America/New_York',
  retries: 3,
  businessStart: '08:00',
  businessEnd: '20:00',
  fallbackHuman: true,
  contactFields: [
    { key: 'name', label: 'Full name', placeholder: 'John Doe' },
    { key: 'phone', label: 'Phone number', placeholder: '+1 (555) 019-2831' }
  ],
});

let seqRef = 100;
const randColor = () => ['#5C2D91', '#FF5C73', '#3E136B', '#2ECC71', '#F5A623'][Math.floor(Math.random() * 5)];

// ─── Provider ──────────────────────────────────────────────────────────────
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [wizard, setWizard] = useState<WizardState>({ open: false, type: null, step: 0, data: defaultWizardData() });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prevAgents => {
        let updated = false;
        const nextAgents = prevAgents.map(agent => {
          if (agent.type !== 'outbound' || !agent.callTasks || agent.status === 'Paused') return agent;
          
          const firstQueueIndex = agent.callTasks.findIndex(t => t.status === 'In Queue');
          if (firstQueueIndex === -1) return agent;
          
          updated = true;
          const task = agent.callTasks[firstQueueIndex];
          
          const templateMatch = outboundTemplates.find(t => t.name === agent.template);
          const templateId = templateMatch ? templateMatch.id : 'custom_agent';
          
          let transcript: { role: 'agent' | 'user'; text: string }[] = [];
          let summary = '';
          let actionItem = '';
          let escalationRequired = false;
          
          const name = task.contactName || 'Customer';
          const phone = task.contactPhone || 'Unknown number';
          const service = task.customData?.service || 'Order Delivery';
          const company = task.customData?.company || 'Acme Corp';
          const role = task.customData?.role || 'Sales Associate';
          const date = task.customData?.date || 'tomorrow at 10:00 AM';
          const provider = task.customData?.provider || 'Dr. Jones';
          const orderId = task.customData?.orderId || 'ORD-9932';
          const address = task.customData?.address || '123 Main St';
          const subId = task.customData?.subId || 'Premium Plan';
          const renewalDate = task.customData?.renewalDate || 'next Friday';
          const amount = task.customData?.amount || '$99.00';
          
          if (templateId === 'ob_recruit') {
            transcript = [
              { role: 'agent', text: `Hi ${name}, I am calling from Simform regarding your application for the ${role} position. Do you have a few minutes for a quick pre-screen call?` },
              { role: 'user', text: `Hi! Yes, I do. Thanks for reaching out.` },
              { role: 'agent', text: `Great. Could you confirm your notice period and location details?` },
              { role: 'user', text: `I have a 1-month notice period and live locally in the city.` },
              { role: 'agent', text: `Perfect. And what are your salary expectations?` },
              { role: 'user', text: `I am looking for around $95,000 per year.` }
            ];
            summary = `Candidate confirmed local residency and a 30-day notice period. Stated compensation expectation is $95k/yr.`;
            actionItem = `Move candidate to next round; coordinate technical assessment.`;
            escalationRequired = false;
          } else if (templateId === 'ob_nps') {
            transcript = [
              { role: 'agent', text: `Hello ${name}, this is Aria calling on behalf of Simform. We're conducting a quick follow-up about your recent ${service}. Do you have a minute?` },
              { role: 'user', text: `Yes, I can speak.` },
              { role: 'agent', text: `On a scale of 0 to 10, how likely are you to recommend us to a friend or colleague?` },
              { role: 'user', text: `I'd say a 9. The experience was really smooth, though the follow-up email took a bit long.` }
            ];
            summary = `Customer rated service 9/10. Highlighted minor delay in system follow-up dispatch email.`;
            actionItem = `Log NPS score in CRM and verify email trigger queue latency.`;
            escalationRequired = false;
          } else if (templateId === 'ob_lead_qual') {
            transcript = [
              { role: 'agent', text: `Hi ${name}, following up on your demo request for Simform Voice OS on behalf of ${company}. Is now a good time?` },
              { role: 'user', text: `Yes, it is. We are looking to deploy a voice agent system next quarter.` },
              { role: 'agent', text: `What is the target size of your project and budget?` },
              { role: 'user', text: `We need to support 15 concurrent channels, and have about $15,000 allocated.` }
            ];
            summary = `Lead qualified. Stated need for 15 channels next quarter. Confirmed BANT budget of $15k.`;
            actionItem = `High-value SQL. Route directly to AE for booking calendar meeting.`;
            escalationRequired = true;
          } else if (templateId === 'ob_reminder') {
            transcript = [
              { role: 'agent', text: `Hi ${name}, confirming your upcoming appointment with ${provider} on ${date}. Will you be able to attend?` },
              { role: 'user', text: `Oh, actually I have a conflict at that time. Can I reschedule to next week?` },
              { role: 'agent', text: `Sure. I'll flag this for our front desk to contact you and reschedule.` }
            ];
            summary = `Client reported scheduling conflict for ${date} and requested callback to reschedule.`;
            actionItem = `Front desk clerk needs to place callback and book new slot.`;
            escalationRequired = true;
          } else if (templateId === 'ob_delivery') {
            transcript = [
              { role: 'agent', text: `Hi ${name}, calling from Simform about your order ${orderId} scheduled for delivery to ${address}.` },
              { role: 'user', text: `Hi! Will it be left at the front door?` },
              { role: 'agent', text: `Yes, standard instructions are front door. Are there any gate codes or entry instructions?` },
              { role: 'user', text: `Yes, gate code is #4821. Please place it in the delivery locker inside.` }
            ];
            summary = `Customer confirmed delivery address. Provided gate code #4821 and locker drop instructions.`;
            actionItem = `Save gate code #4821 and locker instructions in delivery driver manifest.`;
            escalationRequired = false;
          } else if (templateId === 'ob_renewal') {
            transcript = [
              { role: 'agent', text: `Hi ${name}, courtesy reminder that your subscription ${subId} is renewing on ${renewalDate}.` },
              { role: 'user', text: `Actually, I want to cancel my renewal. The pricing has gone up too much.` },
              { role: 'agent', text: `I understand. I'll note your cancellation request and direct this to our client care team.` }
            ];
            summary = `Customer requested subscription cancellation due to price concerns.`;
            actionItem = `Escalate to customer success retention specialist for win-back outreach.`;
            escalationRequired = true;
          } else if (templateId === 'ob_emi') {
            transcript = [
              { role: 'agent', text: `Hi ${name}, courtesy payment reminder that your bill of ${amount} is due on ${renewalDate}.` },
              { role: 'user', text: `I already paid that yesterday online. Can you verify?` },
              { role: 'agent', text: `Got it. I will flag it for our accounting team to reconcile the ledger.` }
            ];
            summary = `Customer claimed payment was made online yesterday. Requested ledger reconciliation.`;
            actionItem = `Billing accountant to match transaction receipts and clear invoice.`;
            escalationRequired = false;
          } else if (templateId === 'ob_event') {
            transcript = [
              { role: 'agent', text: `Hi ${name}, confirming your attendance RSVP for the webinar on ${date}.` },
              { role: 'user', text: `Yes, I will be attending. Can you resend the join link?` },
              { role: 'agent', text: `Absolutely, I will send the registration details and webinar link by SMS.` }
            ];
            summary = `Registrant confirmed RSVP and requested link resend.`;
            actionItem = `Automated trigger to email and SMS connection link to ${phone}.`;
            escalationRequired = false;
          } else {
            transcript = [
              { role: 'agent', text: `Hi ${name}, calling from Simform. Do you have a minute to chat?` },
              { role: 'user', text: `Sure. What is this about?` },
              { role: 'agent', text: `I wanted to follow up on our previous contact. How are things going?` },
              { role: 'user', text: `Everything is fine, thank you.` }
            ];
            summary = `General follow-up call completed. Contact answered positively.`;
            actionItem = `Update contact log status in master sheet.`;
            escalationRequired = false;
          }
          
          const completedTasks = agent.callTasks.map((t, idx) => {
            if (idx === firstQueueIndex) {
              return {
                ...t,
                status: 'Completed' as const,
                transcript,
                summary,
                actionItem,
                escalationRequired
              };
            }
            return t;
          });
          
          const completedCount = completedTasks.filter(t => t.status === 'Completed').length;
          const convCount = completedTasks.filter(t => t.status === 'Completed' && !t.escalationRequired).length;
          const isFinished = completedTasks.every(t => t.status === 'Completed');
          
          return {
            ...agent,
            calls: completedCount,
            conv: convCount,
            status: isFinished ? ('Completed' as const) : ('Active' as const),
            callTasks: completedTasks
          };
        });
        
        return updated ? nextAgents : prevAgents;
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const toast = useCallback((msg: string, icon = 'check-circle-2') => {
    if (icon !== 'alert-triangle') return;
    const id = ++toastId.current;
    setToasts(ts => [...ts, { id, msg, icon }]);
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 3800);
  }, []);

  const addAgent = useCallback((a: Agent) => {
    setAgents(prev => [a, ...prev]);
  }, []);

  const pauseResumeAgent = useCallback((id: string) => {
    setAgents(prev => prev.map(a => {
      if (a.id !== id) return a;
      const newStatus = a.status === 'Active' ? 'Paused' : 'Active';
      toast(`${a.name} is now ${newStatus.toLowerCase()}.`, newStatus === 'Active' ? 'play' : 'pause');
      return { ...a, status: newStatus };
    }));
  }, [toast]);

  const startCreate = useCallback((type: 'outbound' | 'inbound') => {
    setWizard({ open: true, type, step: 0, data: defaultWizardData() });
  }, []);

  const startEdit = useCallback((agent: Agent) => {
    const templateMatch = [...outboundTemplates, ...inboundTemplates].find(t => t.name === agent.template);
    const templateId = templateMatch ? templateMatch.id : 'custom_agent';
    const fields = agent.contactFields || (templateMatch ? templateMatch.fields : [
      { key: 'name', label: 'Full name', placeholder: 'John Doe' },
      { key: 'phone', label: 'Phone number', placeholder: '+1 (555) 019-2831' }
    ]);

    const mappedWizardData: WizardData = {
      templateId,
      templateName: agent.template,
      agentName: agent.name,
      voice: agent.voice || 'Aria (Warm, Female)',
      language: agent.language || 'English (US)',
      script: agent.script || (templateMatch ? templateMatch.prompt : ''),
      contactFields: fields,
      connectors: {},
      connectorsConfig: {},
      kbFiles: [],
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      triggerType: 'immediate',
      windowStart: '09:00',
      windowEnd: '18:00',
      timezone: 'America/New_York',
      retries: 3,
      businessStart: '08:00',
      businessEnd: '20:00',
      fallbackHuman: true,
    };

    setWizard({
      open: true,
      type: agent.type,
      step: 1,
      data: mappedWizardData,
      editingAgentId: agent.id
    });
  }, []);

  const cancelWizard = useCallback(() => {
    setWizard(w => ({ ...w, open: false, editingAgentId: undefined }));
  }, []);

  const setWizardStep = useCallback((s: number) => {
    setWizard(w => ({ ...w, step: s }));
  }, []);

  const updateWizardData = useCallback((key: keyof WizardData, val: unknown) => {
    setWizard(w => ({ ...w, data: { ...w.data, [key]: val } }));
  }, []);

  const launchAgent = useCallback((navigate: (path: string) => void) => {
    const { data, type, editingAgentId } = wizard;
    if (!type) return;

    // Send agent configuration to the backend API
    const configPayload = {
      agentName: data.agentName || data.templateName || 'Untitled agent',
      voice: data.voice || 'Aria (Warm, Female)',
      language: data.language || 'English (US)',
      script: data.script || '',
    };

    fetch('http://localhost:8000/api/configure-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(configPayload),
    })
      .then(response => {
        if (!response.ok) {
          console.error('Failed to sync agent configuration to the backend');
        } else {
          console.log('Successfully synced agent configuration to the backend');
        }
      })
      .catch(err => {
        console.error('Error syncing agent configuration to backend:', err);
      });

    if (editingAgentId) {
      setAgents(prev => prev.map(a => {
        if (a.id !== editingAgentId) return a;
        return {
          ...a,
          name: data.agentName || data.templateName || 'Untitled agent',
          template: data.templateName || '—',
          contactFields: data.contactFields,
          script: data.script,
          voice: data.voice,
          language: data.language,
        };
      }));
      setWizard(w => ({ ...w, open: false, editingAgentId: undefined }));
      toast('Agent settings updated successfully.', 'check-circle-2');
      navigate('/app/agents');
    } else {
      const newAgent: Agent = {
        id: `agt_${++seqRef}`,
        name: data.agentName || data.templateName || 'Untitled agent',
        type,
        template: data.templateName || '—',
        status: 'Draft',
        calls: 0,
        conv: 0,
        created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        color: randColor(),
        contactFields: data.contactFields,
        script: data.script,
        voice: data.voice,
        language: data.language,
      };
      setAgents(prev => [newAgent, ...prev]);
      setWizard(w => ({ ...w, open: false }));
      if (type === 'outbound') {
        navigate(`/app/campaign/${newAgent.id}`);
      } else {
        toast('Agent deployed and live.', 'rocket');
        navigate('/app/agents');
      }
    }
  }, [wizard, toast]);

  const startCampaign = useCallback((id: string, name: string, tasks: CallTask[]) => {
    setAgents(prev => prev.map(a => {
      if (a.id !== id) return a;
      return {
        ...a,
        name,
        status: 'Active' as const,
        calls: 0,
        conv: 0,
        callTasks: tasks
      };
    }));
    toast(`Campaign "${name}" has started!`, 'rocket');
  }, [toast]);

  return (
    <AppContext.Provider value={{
      user, setUser,
      agents, addAgent, pauseResumeAgent, startCampaign,
      wizard, startCreate, startEdit, cancelWizard, setWizardStep, updateWizardData, launchAgent,
      toasts, toast,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
