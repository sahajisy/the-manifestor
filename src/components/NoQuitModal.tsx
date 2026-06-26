'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';

interface NoQuitModalProps {
  action: 'logout' | 'delete';
  onProceed: () => void;
  onCancel: () => void;
}

export function NoQuitModal({ action, onProceed, onCancel }: NoQuitModalProps) {
  const { user, settings } = useAuth();
  const [reason, setReason] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [rejection, setRejection] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (reason.length < 50) {
      setRejection("Your excuse is too short. Type at least 50 characters explaining exactly why you're giving up.");
      return;
    }

    setEvaluating(true);
    setRejection(null);

    try {
      const res = await fetch('/api/no-quit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, aim: user?.aim })
      });
      
      const data = await res.json();
      
      if (data.accepted) {
        onProceed();
      } else {
        setRejection(data.message);
      }
    } catch (e) {
      console.error(e);
      // Fallback
      onProceed();
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(2, 4, 10, 0.95)',
      backdropFilter: 'blur(20px)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      padding: '40px 20px',
      overflowY: 'auto'
    }}>
      <div style={{ maxWidth: 460, margin: '0 auto', width: '100%' }}>
        <p className="label-tag" style={{ color: '#FF003C', borderColor: 'rgba(255, 0, 60, 0.2)', marginBottom: 12 }}>
          ABORT PROTOCOL INITIATED
        </p>
        <h2 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 42, lineHeight: 1, marginBottom: 16 }}>
          Giving Up So Soon?
        </h2>
        <p style={{ color: "#8B949E", fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>
          You are attempting to {action === 'logout' ? 'sign out' : 'delete your account'}. Before you are allowed to abandon your ultimate aim, you must explain exactly why you are quitting. The AI will evaluate your excuse.
        </p>

        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="I am quitting because..."
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: 16,
            color: "white",
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontSize: 15,
            minHeight: 160,
            resize: "vertical",
            marginBottom: 8
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, fontSize: 13, color: reason.length < 50 ? '#FF003C' : '#00FF88' }}>
          <span>{reason.length} / 50 characters minimum</span>
        </div>

        {rejection && (
          <div style={{
            background: "rgba(255, 0, 60, 0.1)",
            border: "1px solid rgba(255, 0, 60, 0.3)",
            borderRadius: 12,
            padding: 16,
            marginBottom: 24
          }}>
            <p style={{ color: "#FF003C", fontFamily: "var(--font-dm-mono), monospace", fontSize: 14, lineHeight: 1.6 }}>
              {rejection}
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: 12, flexDirection: 'column' }}>
          <button 
            onClick={handleSubmit} 
            disabled={evaluating}
            style={{ 
              width: "100%", 
              padding: "16px", 
              background: "#E11D48", 
              border: "none", 
              borderRadius: 12, 
              color: "white", 
              fontFamily: "var(--font-dm-sans), sans-serif", 
              fontSize: 15, 
              fontWeight: 600, 
              cursor: evaluating ? "not-allowed" : "pointer",
              opacity: evaluating ? 0.7 : 1
            }}
          >
            {evaluating ? "EVALUATING EXCUSE..." : "SUBMIT REASON"}
          </button>
          
          <button 
            onClick={onCancel}
            disabled={evaluating}
            style={{ 
              width: "100%", 
              padding: "16px", 
              background: "transparent", 
              border: "1px solid rgba(255,255,255,0.1)", 
              borderRadius: 12, 
              color: "#C8D0DC", 
              fontFamily: "var(--font-dm-sans), sans-serif", 
              fontSize: 15, 
              cursor: evaluating ? "not-allowed" : "pointer",
            }}
          >
            NEVERMIND, I'LL KEEP GOING
          </button>
        </div>
      </div>
    </div>
  );
}
