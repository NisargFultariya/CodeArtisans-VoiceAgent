import React from 'react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Drawer: React.FC<Props> = ({ open, onClose, title, children }) => (
  <>
    <div className={`drawer-overlay ${open ? 'show' : ''}`} onClick={onClose} />
    <div className={`drawer ${open ? 'show' : ''}`} role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <div className="drawer-head">
        <h3 id="drawer-title">{title}</h3>
        <button className="icon-btn" onClick={onClose} aria-label="Close panel"><X size={18} /></button>
      </div>
      <div className="drawer-body">{children}</div>
    </div>
  </>
);
