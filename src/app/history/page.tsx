'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checks, setChecks] = useState<any[]>([]);
  const [fetchingData, setFetchingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const fetchHistory = async () => {
        try {
          const q = query(collection(db, 'users', user.uid, 'checks'), orderBy('timestamp', 'desc'));
          const snap = await getDocs(q);
          const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setChecks(docs);
        } catch (error) {
          console.error("Error fetching history:", error);
        } finally {
          setFetchingData(false);
        }
      };
      fetchHistory();
    }
  }, [user]);

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
