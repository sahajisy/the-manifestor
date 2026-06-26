'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { NoQuitModal } from '@/components/NoQuitModal';

function Toggle({ label, sub, defaultOn, on, onChange }: { label: string, sub?: string, defaultOn?: boolean, on?: boolean, onChange?: (val: boolean) => void }) {
  const [internalOn, setInternalOn] = useState(defaultOn ?? false);
  const isControlled = on !== undefined;
  const isChecked = isControlled ? on : internalOn;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setInternalOn(e.target.checked);
    }
    if (onChange) {
      onChange(e.target.checked);
    }
  };

  const id = `toggle-${label.replace(/\s/g, "")}`;
  return (
    <div className="toggle-wrap" style={{ padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 500, color: "#E8EDF5", marginBottom: 2 }}>{label}</p>
        {sub && <p style={{ fontSize: 12, color: "#8B949E" }}>{sub}</p>}
      </div>
      <label className="toggle" htmlFor={id}>
        <input id={id} type="checkbox" checked={isChecked} onChange={handleChange} />
        <div className="toggle-track">
          <div className="toggle-thumb" />
        </div>
      </label>
    </div>
  );
}

export default function SettingsPage() {
  const { user, loading, logout, deleteAccount, settings } = useAuth();
  const router = useRouter();
  
  const [aim, setAim] = useState("");
  const [saving, setSaving] = useState(false);
  const [quitAction, setQuitAction] = useState<'logout' | 'delete' | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user && settings && settings.aim && !aim) {
      setAim(settings.aim);
    }
  }, [user, loading, router, settings, aim]);

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

  const handleCompleteGoal = async () => {
    if (!user || !aim.trim()) return;
    const confirmed = window.confirm("Mark this goal as completed? Your records will be exported as a ZIP and then permanently deleted.");
    if (!confirmed) return;
    
    setSaving(true);
    try {
      const JSZip = (await import('jszip')).default;
      const { saveAs } = await import('file-saver');
      const { collection, query, getDocs } = await import('firebase/firestore');

      const checksSnap = await getDocs(query(collection(db, 'users', user.uid, 'checks')));
      const reportsSnap = await getDocs(query(collection(db, 'users', user.uid, 'reports')));
      
      const zip = new JSZip();
      const audioFolder = zip.folder("Audio Recordings");
      
      let textLog = `# Archive: ${aim}\n\n`;
      
      textLog += `## WEEKLY INSIGHTS\n\n`;
      reportsSnap.docs.forEach((d) => {
        const data = d.data();
        const dateStr = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleDateString() : 'Unknown Date';
        textLog += `--- Report: ${dateStr} ---\n${data.summary}\n\n`;
      });
      
      textLog += `## REALITY CHECKS\n\n`;
      let i = 0;
      for (const d of checksSnap.docs) {
        const data = d.data();
        const dateObj = data.timestamp ? data.timestamp.toDate() : new Date();
        const dateStr = dateObj.toLocaleString().replace(/[\/\:, ]/g, '_');
        
        textLog += `--- Session: ${dateObj.toLocaleString()} ---\n`;
        textLog += `Question: ${data.question}\n`;
        if (data.transcript) {
          textLog += `Transcript: ${data.transcript}\n`;
        }
        textLog += `\n`;
        
        if (data.audioUrl && audioFolder) {
          if (data.audioUrl.startsWith('data:')) {
            const base64Data = data.audioUrl.split(',')[1];
            if (base64Data) {
              audioFolder.file(`session_${dateStr}_${i}.webm`, base64Data, { base64: true });
            }
          } else if (data.audioUrl.startsWith('http')) {
            try {
              const res = await fetch(data.audioUrl);
              const blob = await res.blob();
              audioFolder.file(`session_${dateStr}_${i}.webm`, blob);
            } catch (err) {
              console.error("Failed to fetch audio for export", err);
            }
          }
        }
        i++;
      }
      
      zip.file("Journey_Log.txt", textLog);
      
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `${aim.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_archive.zip`);
      
      await Promise.all(checksSnap.docs.map(d => deleteDoc(doc(db, 'users', user.uid, 'checks', d.id))));
      await Promise.all(reportsSnap.docs.map(d => deleteDoc(doc(db, 'users', user.uid, 'reports', d.id))));

      await updateDoc(doc(db, 'users', user.uid), {
        completedGoals: arrayUnion(aim.trim()),
        aim: ""
      });
      setAim("");
      alert("Goal completed, exported, and cleanly wiped!");
    } catch (e) {
      console.error(e);
      alert("Failed to complete goal and export archive.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (key: string, val: boolean) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { [key]: val });
    } catch (e) {
      console.error(`Failed to update ${key}`, e);
    }
  };

  const executeQuitAction = async () => {
    if (quitAction === 'logout') {
      await logout();
    } else if (quitAction === 'delete') {
      try {
        await deleteDoc(doc(db, 'users', user.uid));
        await deleteAccount();
      } catch (error: any) {
        if (error?.code === 'auth/requires-recent-login') {
          alert("Please sign out and sign in again before deleting your account.");
        } else {
          alert("Failed to delete account. " + (error?.message || ""));
        }
      }
    }
    setQuitAction(null);
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
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <button 
            onClick={handleUpdateAim} 
            disabled={saving || !aim.trim()}
            style={{ flex: 1, padding: "12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#E8EDF5", cursor: saving || !aim.trim() ? "not-allowed" : "pointer" }}
          >
            {saving ? "Saving..." : "Update Aim"}
          </button>
          <button 
            onClick={handleCompleteGoal} 
            disabled={saving || !aim.trim()}
            style={{ flex: 1, padding: "12px", borderRadius: 8, background: "rgba(0,245,255,0.1)", border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff", cursor: saving || !aim.trim() ? "not-allowed" : "pointer" }}
          >
            Mark Completed
          </button>
        </div>
      </div>

      <div className="glass" style={{ padding: "20px", marginBottom: 16 }}>
        <p className="label-tag" style={{ marginBottom: 2 }}>NOTIFICATIONS</p>
        <Toggle label="Daily Reminder" sub="Push notification at your chosen time" on={settings?.dailyReminder ?? true} onChange={(v) => handleToggle('dailyReminder', v)} />
        <Toggle label="Streak Alerts" sub="Know when your streak is at risk" on={settings?.streakAlerts ?? true} onChange={(v) => handleToggle('streakAlerts', v)} />
        <Toggle label="Weekly Report" sub="Summary every Sunday morning" on={settings?.weeklyReport ?? false} onChange={(v) => handleToggle('weeklyReport', v)} />
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
        <Toggle label="Haptic Feedback" sub="Vibration on button presses" on={settings?.hapticFeedback ?? true} onChange={(v) => handleToggle('hapticFeedback', v)} />
        <Toggle label="Ambient Animations" sub="Aurora background effects" on={settings?.ambientAnimations ?? true} onChange={(v) => handleToggle('ambientAnimations', v)} />
        <Toggle label="Auto-Transcribe" sub="Convert recordings to text via AI" on={settings?.autoTranscribe ?? true} onChange={(v) => handleToggle('autoTranscribe', v)} />
      </div>

      <button onClick={() => router.push('/developer')} className="glass" style={{ width: "100%", padding: "16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#E8EDF5", border: "1px solid rgba(255, 255, 255, 0.1)", cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.032)"}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span style={{ fontSize: 15, fontWeight: 500 }}>About Developer</span>
      </button>

      <button onClick={() => setQuitAction('logout')} className="glass" style={{ width: "100%", padding: "16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#FF6B6B", border: "1px solid rgba(255, 107, 107, 0.2)", cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255, 107, 107, 0.1)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.032)"}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <span style={{ fontSize: 15, fontWeight: 500 }}>Sign Out</span>
      </button>

      <button onClick={() => setQuitAction('delete')} className="glass" style={{ width: "100%", padding: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#FF4444", border: "1px solid rgba(255, 68, 68, 0.3)", cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255, 68, 68, 0.15)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.032)"}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18"></path>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
        <span style={{ fontSize: 15, fontWeight: 500 }}>Delete Account</span>
      </button>

      {quitAction && (
        <NoQuitModal 
          action={quitAction} 
          onProceed={executeQuitAction} 
          onCancel={() => setQuitAction(null)} 
        />
      )}
    </div>
  );
}
