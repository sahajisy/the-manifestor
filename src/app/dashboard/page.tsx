'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';

const MicIcon = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10a7 7 0 0014 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00FF88" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  
  const [aim, setAim] = useState('');
  const [fetchingData, setFetchingData] = useState(true);
  
  // Computed stats
  const [sessionsCount, setSessionsCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [accountability, setAccountability] = useState(0);
  const [weeklyStatus, setWeeklyStatus] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  
  // Session UI logic
  const [sessionDone, setSessionDone] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          // 1. Fetch Aim
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().aim) {
            setAim(docSnap.data().aim);
            
            // Calculate remaining days
            if (docSnap.data().targetDate) {
              const target = docSnap.data().targetDate.toDate();
              const now = new Date();
              const diffTime = target.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              setDaysRemaining(diffDays > 0 ? diffDays : 0);
            }
          } else {
            router.push('/onboarding');
            return;
          }

          // 2. Fetch all checks
          const q = query(collection(db, 'users', user.uid, 'checks'), orderBy('timestamp', 'desc'));
          const snap = await getDocs(q);
          const checks = snap.docs.map(d => d.data());

          setSessionsCount(checks.length);

          // Group by "logical day" (shifting by 4 hours so 2 AM counts as previous day)
          const getLogicalDateStr = (dateObj: Date) => {
            const d = new Date(dateObj.getTime() - 4 * 60 * 60 * 1000);
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          };

          const daysSet = new Set<string>();
          checks.forEach(c => {
            if (c.timestamp) {
              daysSet.add(getLogicalDateStr(c.timestamp.toDate()));
            }
          });

          // Calculate Accountability (Days Active / Days since creation)
          let creationDate = new Date();
          if (user.metadata && user.metadata.creationTime) {
            creationDate = new Date(user.metadata.creationTime);
          } else if (checks.length > 0 && checks[checks.length-1].timestamp) {
            creationDate = checks[checks.length-1].timestamp.toDate();
          }
          
          const now = new Date();
          const msPerDay = 1000 * 60 * 60 * 24;
          const daysSinceCreation = Math.max(1, Math.ceil((now.getTime() - creationDate.getTime()) / msPerDay));
          const accPct = Math.round((daysSet.size / daysSinceCreation) * 100);
          setAccountability(Math.min(100, accPct));

          // Calculate Streak
          let currentStreak = 0;
          const todayStr = getLogicalDateStr(now);
          const yesterday = new Date(now.getTime() - msPerDay);
          const yesterdayStr = getLogicalDateStr(yesterday);
          
          let checkDate = new Date(now.getTime());
          
          // Start counting from today, or yesterday if today is missing
          if (daysSet.has(todayStr)) {
            // Count backwards from today
          } else if (daysSet.has(yesterdayStr)) {
            checkDate = yesterday;
          } else {
            // No streak
          }

          if (daysSet.has(getLogicalDateStr(checkDate))) {
            while (true) {
              if (daysSet.has(getLogicalDateStr(checkDate))) {
                currentStreak++;
                checkDate = new Date(checkDate.getTime() - msPerDay);
              } else {
                break;
              }
            }
          }
          setStreak(currentStreak);

          // Calculate Weekly Progress (Mon - Sun)
          const currentLogicalNow = new Date(now.getTime() - 4 * 60 * 60 * 1000);
          // 0 is Sunday, 1 is Monday. We want Monday=0, Sunday=6
          const dayOfWeek = (currentLogicalNow.getDay() + 6) % 7; 
          const startOfWeek = new Date(currentLogicalNow.getTime() - (dayOfWeek * msPerDay));
          
          const weekMask = [false, false, false, false, false, false, false];
          for(let i=0; i<7; i++) {
            const d = new Date(startOfWeek.getTime() + (i * msPerDay));
            const dStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (daysSet.has(dStr)) {
              weekMask[i] = true;
            }
          }
          setWeeklyStatus(weekMask);

          // Evaluate session state
          // Did they complete a session during the current active block?
          // Morning: 4am - 12pm. Evening: 12pm - 18pm. Night: 18pm - 4am.
          const hour = now.getHours();
          let currentSlot = 'Night';
          if (hour >= 4 && hour < 12) currentSlot = 'Morning';
          else if (hour >= 12 && hour < 18) currentSlot = 'Evening';

          let isDue = true;
          if (checks.length > 0 && checks[0].timestamp) {
            const lastCheckDate = checks[0].timestamp.toDate();
            // Is last check the same logical day?
            if (getLogicalDateStr(lastCheckDate) === todayStr) {
              const lastHour = lastCheckDate.getHours();
              let lastSlot = 'Night';
              if (lastHour >= 4 && lastHour < 12) lastSlot = 'Morning';
              else if (lastHour >= 12 && lastHour < 18) lastSlot = 'Evening';
              
              if (lastSlot === currentSlot) {
                isDue = false;
              }
            }
          }
          
          setSessionDone(!isDue);

        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setFetchingData(false);
        }
      };
      fetchData();
    }
  }, [user, router]);

  if (loading || fetchingData) {
    return <div className="flex items-center justify-center min-h-[50vh] text-[#8B949E] text-sm">Synchronizing with reality...</div>;
  }

  if (!user || !aim) return null;

  const currentDayIndex = (new Date(new Date().getTime() - 4 * 60 * 60 * 1000).getDay() + 6) % 7;

  return (
    <div style={{ padding: "28px 20px 120px", maxWidth: 460, margin: "0 auto" }} className="animate-fade-in">

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p className="label-tag" style={{ marginBottom: 6 }}>YOUR ULTIMATE AIM</p>
        <h1 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 42, lineHeight: 1, letterSpacing: "-0.01em" }} className="iridescent">
          {aim || "Become The Best Version"}
        </h1>
      </div>

      {/* Countdown Card */}
      {daysRemaining !== null && (
        <div className="glass" style={{ padding: "20px", marginBottom: 24, textAlign: "center", border: "1px solid rgba(0, 245, 255, 0.2)", background: "rgba(0, 245, 255, 0.02)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #00F5FF, transparent)", opacity: 0.5 }} />
          <p className="label-tag" style={{ marginBottom: 4, color: "#00F5FF" }}>DEADLINE COUNTDOWN</p>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 48, lineHeight: 1, color: "#E8EDF5" }}>{daysRemaining}</span>
            <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 14, color: "#8B949E", letterSpacing: "0.1em" }}>DAYS REMAINING</span>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { label: "STREAK", value: streak.toString(), unit: "days", color: "#FF6B35" },
          { label: "SESSIONS", value: sessionsCount.toString(), unit: "total", color: "#00F5FF" },
          { label: "ACCOUNTABILITY", value: `${accountability}%`, unit: "active", color: "#A855F7" },
        ].map((s) => (
          <div key={s.label} className="glass-sm" style={{ padding: "14px 12px", textAlign: "center" }}>
            <p className="label-tag" style={{ marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 28, color: s.color, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: "#8B949E", marginTop: 2 }}>{s.unit}</p>
          </div>
        ))}
      </div>

      {/* Face Reality button */}
      <div className="glass" style={{ padding: "28px", marginBottom: 16, textAlign: "center" }}>
        <p className="label-tag" style={{ marginBottom: 16 }}>DAILY REALITY CHECK</p>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <button className="sonar-btn" onClick={() => router.push('/question')}>
            <MicIcon size={28} color="white" />
          </button>
        </div>
        <p style={{ fontSize: 13, color: "#8B949E" }}>
          {sessionDone ? "Session recorded ✓" : "Tap to begin your session"}
        </p>
      </div>

      {/* Session Complete card */}
      {sessionDone && (
        <div className="glass emerald-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(0,255,136,0.12)", border: "1px solid rgba(0,255,136,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CheckIcon />
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, color: "#00FF88", marginBottom: 2 }}>Session Complete</p>
            <p style={{ fontSize: 12, color: "#8B949E" }}>Today's check-in is locked in. Keep the momentum.</p>
          </div>
        </div>
      )}

      {/* Weekly Progress */}
      <div className="glass" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p className="label-tag">WEEKLY PROGRESS</p>
          <span style={{ fontSize: 12, color: "#00F5FF" }}>{weeklyStatus.filter(Boolean).length} / 7 days</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: "100%",
                height: 40,
                borderRadius: 8,
                background: weeklyStatus[i] ? "rgba(0,255,136,0.25)" : (i === currentDayIndex && !sessionDone ? "rgba(0,245,255,0.15)" : "rgba(255,255,255,0.04)"),
                border: `1px solid ${weeklyStatus[i] ? "rgba(0,255,136,0.4)" : (i === currentDayIndex && !sessionDone ? "rgba(0,245,255,0.25)" : "rgba(255,255,255,0.06)")}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {weeklyStatus[i] && <CheckIcon />}
              </div>
              <span style={{ fontSize: 10, color: "#8B949E", letterSpacing: "0.05em" }}>{d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
