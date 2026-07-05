import React from 'react';
import { Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CtaSection: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="land-cta">
      <h2>Your first agent can be live in the next ten minutes</h2>
      <p>No credit card required. Bring your own contact list or start with a template.</p>
      <div className="land-hero-actions">
        <button className="btn btn-accent btn-lg" onClick={() => navigate('/signup')}><Rocket size={16} /> Start free</button>
        <button className="btn btn-glass btn-lg" onClick={() => navigate('/login')}>I already have an account</button>
      </div>
    </div>
  );
};
