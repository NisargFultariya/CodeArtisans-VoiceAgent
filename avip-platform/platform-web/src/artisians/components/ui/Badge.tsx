import React from 'react';
import type { AgentStatus } from '../../types';

interface Props {
  status: AgentStatus | string;
  className?: string;
}

const variantMap: Record<string, string> = {
  Active: 'badge-success',
  Scheduled: 'badge-info',
  Paused: 'badge-warning',
  Draft: 'badge-muted',
  Completed: 'badge-muted',
  OUTBOUND: 'badge-muted',
  INBOUND: 'badge-info',
};

export const Badge: React.FC<Props> = ({ status, className = '' }) => {
  const variant = variantMap[status] || 'badge-muted';
  return (
    <span className={`badge ${variant} ${className}`}>{status}</span>
  );
};
