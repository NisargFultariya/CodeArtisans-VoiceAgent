import React from 'react';

interface Props {
  onClick?: () => void;
  className?: string;
}

const SimformLogo: React.FC = () => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <polygon points="50,8 88,32 50,56 12,32" fill="#FF5C73"/>
    <polygon points="12,32 50,56 50,92 12,68" fill="#FF8A8F"/>
    <polygon points="88,32 50,56 50,92 88,68" fill="#E8475C"/>
    <polygon points="38,32 62,32 50,46" fill="#3E136B"/>
  </svg>
);

export const Brand: React.FC<Props> = ({ onClick, className = '' }) => (
  <div
    className={`flex items-center gap-2.5 flex-shrink-0 cursor-pointer ${className}`}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    aria-label="Simform Voice OS home"
  >
    <div className="brand-mark" aria-hidden="true"><SimformLogo /></div>
    <div className="flex flex-col leading-tight">
      <b style={{ fontSize: '14.5px', fontWeight: 700, letterSpacing: '-.2px' }}>Simform</b>
      <span style={{ fontSize: '10.5px', color: 'var(--text-faint)', letterSpacing: '.5px', textTransform: 'uppercase' }}>Voice Agent OS</span>
    </div>
  </div>
);
