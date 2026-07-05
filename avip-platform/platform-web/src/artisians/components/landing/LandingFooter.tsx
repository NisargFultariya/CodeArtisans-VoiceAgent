import React from 'react';
import { useNavigate } from 'react-router-dom';

export const LandingFooter: React.FC = () => {
  const navigate = useNavigate();
  return (
    <footer className="land-footer">
      <span>© 2026 Simform Voice OS. All rights reserved.</span>
      <div className="land-footer-links">
        <a href="#features">Product</a>
        <a href="#sdk-preview">Developers</a>
        <a href="#" onClick={e => { e.preventDefault(); navigate('/login'); }}>Log in</a>
        <a href="#" onClick={e => { e.preventDefault(); navigate('/signup'); }}>Sign up</a>
      </div>
    </footer>
  );
};
