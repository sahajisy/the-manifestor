'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

function Toggle({ label, sub, defaultOn }: { label: string, sub?: string, defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn ?? false);
  const id = `toggle-${label.replace(/\s/g, "")}`;
  return (
    <div className="toggle-wrap" style={{ padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 500, color: "#E8EDF5", marginBottom: 2 }}>{label}</p>
        {sub && <p style={{ fontSize: 12, color: "#8B949E" }}>{sub}</p>}
      </div>
      <label className="toggle" htmlFor={id}>
        <input id={id} type="checkbox" checked={on} onChange={() => setOn(!on)} />
        <div className="toggle-track">
          <div className="toggle-thumb" />
        </div>
      </label>
    </div>
  );
}

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  
  const [aim, setAim] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      const fetchAim = async () => {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists() && docSnap.data().aim) {
          setAim(docSnap.data().aim);
        }
      };
      fetchAim();
    }
  }, [user, loading, router]);

  const handleUpdateAim = async () => {
    if (!user || !aim.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { aim: aim.trim() });
      alert("Aim updated successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div style={{ padding: "28px 20px 120px", maxWidth: 460, margin: "0 auto" }} className="animate-fade-in">
      <p className="label-tag" style={{ marginBottom: 8 }}>CONFIGURATION</p>
      <h2 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 36, lineHeight: 1.1, marginBottom: 24 }}>
        <span className="iridescent">Settings</span>
      </h2>

      <div className="glass" style={{ padding: "20px", marginBottom: 16 }}>
        <p className="label-tag" style={{ marginBottom: 14 }}>ULTIMATE AIM</p>
        <textarea
          value={aim}
          onChange={e => setAim(e.target.value)}
          placeholder="E.g., Become the best version of myself..."
          style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px", color: "#E8EDF5", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 14, lineHeight: 1.6, resize: "none", outline: "none", minHeight: 80, transition: "border-color 0.2s" }}
          onFocus={e => e.target.style.borderColor = "rgba(0, 245, 255, 0.4)"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
        />
        <button 
          onClick={handleUpdateAim} 
          disabled={saving || !aim.trim()}
          style={{ marginTop: 12, width: "100%", padding: "12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#E8EDF5", cursor: saving ? "not-allowed" : "pointer" }}
        >
          {saving ? "Saving..." : "Update Aim"}
        </button>
      </div>

      <div className="glass" style={{ padding: "20px", marginBottom: 16 }}>
        <p className="label-tag" style={{ marginBottom: 2 }}>NOTIFICATIONS</p>
        <Toggle label="Daily Reminder" sub="Push notification at your chosen time" defaultOn={true} />
        <Toggle label="Streak Alerts" sub="Know when your streak is at risk" defaultOn={true} />
        <Toggle label="Weekly Report" sub="Summary every Sunday morning" />
      </div>

      <div className="glass" style={{ padding: "20px", marginBottom: 16 }}>
        <p className="label-tag" style={{ marginBottom: 14 }}>REMINDER TIME</p>
        <div style={{ position: "relative" }}>
          <select className="custom-select" defaultValue="20:00">
            {["06:00","07:00","08:00","09:00","20:00","21:00","22:00"].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#8B949E", pointerEvents: "none", fontSize: 12 }}>▼</span>
        </div>
      </div>

      <div className="glass" style={{ padding: "20px", marginBottom: 24 }}>
        <p className="label-tag" style={{ marginBottom: 2 }}>APPEARANCE</p>
        <Toggle label="Haptic Feedback" sub="Vibration on button presses" defaultOn={true} />
        <Toggle label="Ambient Animations" sub="Aurora background effects" defaultOn={true} />
        <Toggle label="Auto-Transcribe" sub="Convert recordings to text via AI" />
      </div>

      <button onClick={logout} className="glass" style={{ width: "100%", padding: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#FF6B6B", border: "1px solid rgba(255, 107, 107, 0.2)", cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255, 107, 107, 0.1)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.032)"}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <span style={{ fontSize: 15, fontWeight: 500 }}>Sign Out</span>
      </button>
    </div>
  );
}
