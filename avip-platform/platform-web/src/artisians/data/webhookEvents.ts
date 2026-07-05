export interface WebhookEvent {
  name: string;
  desc: string;
}

export const webhookEvents: WebhookEvent[] = [
  { name: 'call.started', desc: 'Fired when a call connects' },
  { name: 'call.completed', desc: 'Fired when a call ends, includes transcript & disposition' },
  { name: 'campaign.launched', desc: 'Fired when an outbound campaign starts' },
  { name: 'agent.status_changed', desc: 'Fired when an agent is paused, resumed, or completed' },
  { name: 'lead.converted', desc: 'Fired when a call outcome is marked as a conversion' },
];
