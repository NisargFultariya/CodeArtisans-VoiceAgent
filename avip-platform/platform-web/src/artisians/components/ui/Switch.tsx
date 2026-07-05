import React from 'react';

interface Props {
  checked: boolean;
  onChange: () => void;
  label?: string;
}

export const Switch: React.FC<Props> = ({ checked, onChange, label }) => (
  <div
    className={`switch-toggle ${checked ? 'on' : ''}`}
    role="switch"
    aria-checked={checked}
    tabIndex={0}
    aria-label={label}
    onClick={onChange}
    onKeyDown={(e) => { if (e.key === ' ') { e.preventDefault(); onChange(); } }}
  />
);
