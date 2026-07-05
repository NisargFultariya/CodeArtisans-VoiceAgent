export type AgentStatus = 'Active' | 'Scheduled' | 'Paused' | 'Draft' | 'Completed';
export type AgentType = 'outbound' | 'inbound';

export interface CallTask {
  id: string;
  contactName: string;
  contactPhone: string;
  status: 'Not Received' | 'In Queue' | 'Completed';
  transcript?: { role: 'agent' | 'user'; text: string }[];
  summary?: string;
  actionItem?: string;
  escalationRequired: boolean;
  customData?: Record<string, string>;
}

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  template: string;
  status: AgentStatus;
  calls: number;
  conv: number;
  created: string;
  color: string;
  contactFields?: { key: string; label: string; placeholder: string }[];
  script?: string;
  voice?: string;
  language?: string;
  callTasks?: CallTask[];
}

export interface User {
  name: string;
  initials: string;
  email: string;
}

export interface WizardData {
  templateId?: string;
  templateName?: string;
  agentName?: string;
  voice?: string;
  language?: string;
  script?: string;
  contactFields?: { key: string; label: string; placeholder: string }[];
  connectors: Record<string, boolean>;
  connectorsConfig?: Record<string, any>;
  kbFiles: { name: string; size: string }[];
  days: string[];
  triggerType: 'immediate' | 'scheduled' | 'recurring' | 'event';
  windowStart: string;
  windowEnd: string;
  timezone: string;
  retries: number;
  businessStart: string;
  businessEnd: string;
  fallbackHuman: boolean;
  number?: string;
  triggerDate?: string;
  eventRule?: string;
}

export interface WizardState {
  open: boolean;
  type: AgentType | null;
  step: number;
  data: WizardData;
  editingAgentId?: string;
}

export type RootView = 'landing' | 'auth' | 'app';
export type AppScreen = 'overview' | 'create' | 'agents' | 'analytics' | 'sdk' | 'settings';
export type AgentViewMode = 'table' | 'grid';
export type AuthMode = 'login' | 'signup';
export type SettingsTab = 'Branding' | 'Notifications' | 'API Keys';
