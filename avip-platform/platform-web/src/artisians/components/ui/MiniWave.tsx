import React, { useEffect, useRef } from 'react';

interface Props {
  count?: number;
  color?: string;
}

export const MiniWave: React.FC<Props> = ({ count = 28, color = '#fff' }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const span = document.createElement('span');
      span.style.animationDelay = `${Math.random()}s`;
      el.appendChild(span);
    }
  }, [count]);

  return (
    <div
      ref={ref}
      className="mini-wave"
      aria-hidden="true"
      style={{ '--wave-color': color } as React.CSSProperties}
    />
  );
};
