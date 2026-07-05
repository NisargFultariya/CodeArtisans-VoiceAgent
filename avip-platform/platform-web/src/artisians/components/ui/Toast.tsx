import React from 'react';
import { CheckCircle2, AlertTriangle, Copy, Rocket, Pause, Play, LogOut, Sparkles, MailCheck, KeyRound, Pencil } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface ToastItem {
  id: number;
  msg: string;
  icon: string;
}

type IconComponent = React.FC<LucideProps>;

const icons: Record<string, IconComponent> = {
  'check-circle-2': CheckCircle2 as IconComponent,
  'alert-triangle': AlertTriangle as IconComponent,
  'copy': Copy as IconComponent,
  'rocket': Rocket as IconComponent,
  'pause': Pause as IconComponent,
  'play': Play as IconComponent,
  'log-out': LogOut as IconComponent,
  'sparkles': Sparkles as IconComponent,
  'mail-check': MailCheck as IconComponent,
  'key-round': KeyRound as IconComponent,
  'pencil': Pencil as IconComponent,
};

export const ToastStack: React.FC<{ toasts: ToastItem[] }> = ({ toasts }) => {
  if (!toasts.length) return null;
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map(t => {
        const Icon = icons[t.icon] || CheckCircle2;
        return (
          <div key={t.id} className="toast-item" role="status">
            <span style={{ color: 'var(--success-bg)', flexShrink: 0, display: 'flex' }}>
              <Icon size={17} />
            </span>
            <span>{t.msg}</span>
          </div>
        );
      })}
    </div>
  );
};
