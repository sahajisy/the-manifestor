'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checks, setChecks] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [fetchingData, setFetchingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          const qChecks = query(collection(db, 'users', user.uid, 'checks'), orderBy('timestamp', 'desc'));
          const snapChecks = await getDocs(qChecks);
          setChecks(snapChecks.docs.map(doc => ({ id: doc.id, ...doc.data() })));

          const qReports = query(collection(db, 'users', user.uid, 'reports'), orderBy('timestamp', 'desc'));
          const snapReports = await getDocs(qReports);
          setReports(snapReports.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
          console.error("Error fetching history:", error);
        } finally {
          setFetchingData(false);
        }
      };
      fetchData();
    }
  }, [user]);

  const generateSampleReport = async () => {
    if (!user) return;
    setFetchingData(true);
    try {
      // Get aim
      let aim = "Unknown";
      const userDocSnap = await getDoc(doc(db, 'users', user.uid));
      if (userDocSnap.exists()) {
        aim = userDocSnap.data().aim || "Unknown";
      }
      
      const res = await fetch('/api/debug/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aim, checks })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.summary) {
          import('firebase/firestore').then(async ({ addDoc, serverTimestamp, collection }) => {
            await addDoc(collection(db, 'users', user.uid, 'reports'), {
              summary: data.summary,
              timestamp: serverTimestamp(),
              checksCount: checks.length
            });
            window.location.reload();
          });
        } else {
          alert("Failed to generate report. Empty summary.");
        }
      } else {
        alert("Failed to generate report using backend API.");
      }
    } catch (e) {
      console.error(e);
      alert("Error generating report.");
    } finally {
      setFetchingData(false);
    }
  };

  if (loading || fetchingData) {
    return <div className="flex items-center justify-center min-h-[50vh] text-[#8B949E] text-sm">Loading logs...</div>;
  }

  if (!user) return null;

  return (
    <div style={{ padding: "28px 20px 120px", maxWidth: 460, margin: "0 auto" }} className="animate-fade-in">
      <p className="label-tag" style={{ marginBottom: 8 }}>SESSION LOG</p>
      <h2 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 36, lineHeight: 1.1, marginBottom: 24 }}>
        Your <span className="iridescent">Journey</span>
      </h2>

      <button 
        onClick={generateSampleReport} 
        style={{ width: "100%", padding: "12px", marginBottom: 24, borderRadius: 8, background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", color: "#A855F7", cursor: "pointer", fontSize: 14, fontWeight: 500 }}
      >
        Generate Weekly Report (Debug)
      </button>

      {reports.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <p className="label-tag" style={{ marginBottom: 12, color: "#00F5FF" }}>WEEKLY INSIGHTS</p>
          {reports.map((report) => {
            const date = report.timestamp ? new Date(report.timestamp.toDate()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown Date';
            return (
              <div key={report.id} className="glass" style={{ padding: "20px", marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: "#A855F7", fontWeight: 600, marginBottom: 12, letterSpacing: "0.05em" }}>REPORT: {date}</p>
                <div style={{ fontSize: 15, color: "#E8EDF5", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {report.summary}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="label-tag" style={{ marginBottom: 8 }}>SESSION LOG</p>
      {checks.length === 0 ? (
        <div className="glass-sm history-card text-center" style={{ padding: "32px 18px", marginBottom: 10 }}>
          <p style={{ color: "#8B949E", fontSize: 14 }}>No reality checks recorded yet.</p>
        </div>
      ) : (
        checks.map((h, i) => {
          const formattedDate = h.timestamp 
            ? new Date(h.timestamp.toDate()).toLocaleString(undefined, {
                weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
              }) 
            : 'Unknown Date';
            
          return (
            <div key={h.id} className="glass-sm history-card flex flex-col" style={{ padding: "16px 18px", marginBottom: 16, animationDelay: `${Math.min(i, 10) * 80}ms` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "#00F5FF", fontWeight: 500 }}>{formattedDate}</span>
                </div>
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <p className="label-tag" style={{ marginBottom: 4, color: "#8B949E" }}>INQUIRY</p>
                <p style={{ fontSize: 14, color: "#E8EDF5", lineHeight: 1.55 }}>&quot;{h.question}&quot;</p>
              </div>

              {h.audioUrl && (
                <div style={{ marginTop: 8 }}>
                  <p className="label-tag" style={{ marginBottom: 8, color: "#8B949E" }}>RECORDING</p>
                  <audio controls src={h.audioUrl} style={{ width: '100%', height: '36px', borderRadius: '12px', outline: 'none' }} className="invert brightness-110 saturate-0 opacity-80" />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
