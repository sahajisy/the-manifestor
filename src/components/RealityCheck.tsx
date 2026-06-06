'use client';

import { useState, useRef, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface RealityCheckProps {
  userId: string;
  aim: string;
  intensity: string;
  onComplete: () => void;
}

const MicIcon = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10a7 7 0 0014 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/>
  </svg>
);

export function RealityCheck({ userId, aim, intensity, onComplete }: RealityCheckProps) {
  const [question, setQuestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Automatically fetch question when component mounts
  useEffect(() => {
    generateQuestion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateQuestion = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aim, intensity }),
      });
      const data = await res.json();
      setQuestion(data.question);
    } catch (e) {
      console.error(e);
      setQuestion("Are you genuinely working towards your aim, or just killing time?");
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    if (recorded) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      mediaRecorderRef.current.start();
      setPressing(true);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch (err) {
      console.error("Microphone permission denied or error", err);
      alert("Microphone permission is required.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && pressing) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setPressing(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (seconds > 0) setRecorded(true);
    }
  };

  const handleToggleRecording = () => {
    if (recorded || loading) return;
    if (pressing) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const submitAnswer = async () => {
    if (!audioBlob || !question) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        try {
          const base64Audio = reader.result;
          await addDoc(collection(db, 'users', userId, 'checks'), {
            question,
            audioUrl: base64Audio,
            timestamp: serverTimestamp(),
          });
          onComplete(); 
        } catch (error) {
          console.error("Error saving to Firestore:", error);
          alert("Failed to save answer to database.");
        } finally {
          setUploading(false);
        }
      };
    } catch (error) {
      console.error("Error preparing answer:", error);
      alert("Failed to process audio.");
      setUploading(false);
    }
  };

  const reset = () => {
    setRecorded(false);
    setSeconds(0);
    setAudioBlob(null);
  };

  return (
    <div style={{ padding: "28px 20px 120px", maxWidth: 460, margin: "0 auto" }}>
      <p className="label-tag" style={{ marginBottom: 8 }}>REALITY CHECK</p>
      <h2 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 36, lineHeight: 1.1, marginBottom: 6 }}>
        Face The <span className="iridescent">Truth</span>
      </h2>
      <p style={{ color: "#8B949E", fontSize: 14, marginBottom: 36, lineHeight: 1.6 }}>
        Tap the button and speak your truth. Be brutally honest.
      </p>

      {/* Big record button */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, marginBottom: 40 }}>
        <div style={{ position: "relative" }}>
          <button
            className={`record-btn ${pressing ? "pressing" : ""}`}
            onClick={handleToggleRecording}
            disabled={recorded || loading}
            style={{ opacity: (recorded || loading) ? 0.5 : 1, touchAction: 'manipulation' }}
          >
            <div className="ring3" />
            <MicIcon size={40} color="white" />
          </button>
        </div>

        <div style={{ textAlign: "center" }}>
          {pressing ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginBottom: 4 }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#FF003C", animation: "sonar 1s ease-out infinite" }} />
                <span style={{ color: "#FF003C", fontFamily: "var(--font-dm-mono), monospace", fontSize: 18, fontWeight: 500 }}>
                  {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
                </span>
              </div>
              <p style={{ color: "#8B949E", fontSize: 13 }}>Recording… tap to stop</p>
            </>
          ) : recorded ? (
            <p style={{ color: "#00FF88", fontSize: 14, fontWeight: 500 }}>Recording saved · {seconds}s</p>
          ) : (
            <p style={{ color: "#8B949E", fontSize: 13 }}>Tap to start recording</p>
          )}
        </div>
      </div>

      {/* AI Prompts replaced with the generated question */}
      <div className="glass animate-fade-in" style={{ padding: "20px" }}>
        <p className="label-tag" style={{ marginBottom: 14 }}>THE INQUIRY</p>
        
        {loading ? (
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-2 bg-white/20 rounded w-3/4"></div>
              <div className="h-2 bg-white/20 rounded w-1/2"></div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 12, color: "#A855F7", flexShrink: 0, marginTop: 1 }}>AI</span>
            <p style={{ fontSize: 15, color: "#C8D0DC", lineHeight: 1.5, fontWeight: 500 }}>{question}</p>
          </div>
        )}
      </div>

      {recorded && (
        <div style={{ marginTop: 16, display: 'flex', gap: '8px', flexDirection: 'column' }}>
          <button onClick={submitAnswer} disabled={uploading} style={{ width: "100%", padding: "14px", background: "#E11D48", border: "none", borderRadius: 12, color: "white", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            {uploading ? 'Locking in Reality...' : 'Submit Session'}
          </button>
          <button onClick={reset} disabled={uploading} style={{ width: "100%", padding: "14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#8B949E", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 14, cursor: "pointer" }}>
            Discard & Record Again
          </button>
        </div>
      )}
    </div>
  );
}
