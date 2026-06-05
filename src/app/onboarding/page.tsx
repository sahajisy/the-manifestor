'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [aim, setAim] = useState("");
  const [durationMonths, setDurationMonths] = useState(6);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      // Check if they already have an aim
      const checkDoc = async () => {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists() && docSnap.data().aim) {
          router.push('/dashboard');
        } else {
          setChecking(false);
        }
      };
      checkDoc();
    }
  }, [user, router]);

  const handleSave = async () => {
    if (!user || !aim.trim()) return;
    setSaving(true);
    try {
      const now = new Date();
      // Calculate target date by adding months
      const targetDate = new Date(now.setMonth(now.getMonth() + durationMonths));
      
      await setDoc(doc(db, 'users', user.uid), {
        aim: aim.trim(),
        targetDate: targetDate,
        intensity: "Harsh",
        createdAt: new Date()
      }, { merge: true });
      
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      setSaving(false);
      alert("Failed to save. Try again.");
    }
  };

  if (loading || checking) {
    return <div className="full-screen-center"><span className="ls-spinner" style={{ width: 32, height: 32, borderWidth: 3 }}/></div>;
  }

  return (
    <div style={{ padding: "40px 20px", maxWidth: 460, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }} className="animate-fade-in relative z-10">
      
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <p className="label-tag" style={{ marginBottom: 6 }}>YOUR COMMITMENT</p>
        <h1 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 42, lineHeight: 1, letterSpacing: "-0.01em" }}>
          Define Your <span className="iridescent">Aim</span>
        </h1>
        <p style={{ marginTop: 12, color: "#8B949E", fontSize: 14, lineHeight: 1.6 }}>
          What is the single most important goal you want to manifest? Be specific.
        </p>
      </div>

      <div className="glass" style={{ padding: "24px", marginBottom: 20 }}>
        <p className="label-tag" style={{ marginBottom: 12 }}>THE AIM</p>
        <textarea
          value={aim}
          onChange={(e) => setAim(e.target.value)}
          placeholder="E.g., Build a $10k/mo business, run a sub-3 hour marathon..."
          style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px", color: "#E8EDF5", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 15, lineHeight: 1.6, resize: "none", outline: "none", minHeight: 100, transition: "border-color 0.2s" }}
          onFocus={e => e.target.style.borderColor = "rgba(0, 245, 255, 0.4)"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
        />
      </div>

      <div className="glass" style={{ padding: "24px", marginBottom: 32 }}>
        <p className="label-tag" style={{ marginBottom: 12 }}>TIMELINE</p>
        <p style={{ fontSize: 13, color: "#8B949E", marginBottom: 16 }}>Every dream needs a deadline. How long are you giving yourself?</p>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[3, 6, 12].map(months => (
            <button 
              key={months}
              onClick={() => setDurationMonths(months)}
              style={{
                padding: "14px 0",
                borderRadius: 12,
                background: durationMonths === months ? "rgba(0, 245, 255, 0.15)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${durationMonths === months ? "rgba(0, 245, 255, 0.4)" : "rgba(255,255,255,0.08)"}`,
                color: durationMonths === months ? "#00F5FF" : "#C8D0DC",
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {months} Months
            </button>
          ))}
        </div>
      </div>

      <button 
        onClick={handleSave} 
        disabled={!aim.trim() || saving}
        style={{ 
          width: "100%", padding: "18px", borderRadius: 16,
          background: "linear-gradient(135deg, #00C9CC, #7B2FFF 50%, #A855F7)",
          backgroundSize: "200% 200%",
          color: "white", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 16, fontWeight: 600, letterSpacing: "0.02em",
          border: "none", cursor: (!aim.trim() || saving) ? "not-allowed" : "pointer",
          opacity: (!aim.trim() || saving) ? 0.5 : 1,
          boxShadow: "0 4px 28px rgba(123,47,255,0.4)",
          animation: "lsShimmer 4s ease-in-out infinite"
        }}
      >
        {saving ? <span className="ls-spinner" style={{ display: "inline-block", verticalAlign: "middle" }}/> : "Lock It In →"}
      </button>

    </div>
  );
}
