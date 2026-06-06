'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const LogoMark = () => (
  <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
    <path d="M20 5L32 13V27L20 35L8 27V13L20 5Z" stroke="url(#lgl)" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
    <path d="M20 12L26 17V23L20 28L14 23V17L20 12Z" fill="url(#lgl2)" opacity=".55"/>
    <circle cx="20" cy="20" r="3" fill="white" opacity=".9"/>
    <defs>
      <linearGradient id="lgl" x1="8" y1="5" x2="32" y2="35" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00F5FF"/><stop offset=".5" stopColor="#A855F7"/><stop offset="1" stopColor="#FF003C"/>
      </linearGradient>
      <linearGradient id="lgl2" x1="14" y1="12" x2="26" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00F5FF" stopOpacity=".7"/><stop offset="1" stopColor="#A855F7" stopOpacity=".7"/>
      </linearGradient>
    </defs>
  </svg>
);

export default function WelcomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="full-screen-center">
        <span className="ls-spinner" style={{ width: 32, height: 32, borderWidth: 3 }}/>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "40px 20px" }} className="animate-fade-in relative z-10">
      <div className="glass" style={{ padding: "48px 32px", width: "100%", maxWidth: 460, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        
        {/* Logo */}
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: "radial-gradient(circle at 40% 35%, rgba(0,245,255,.15), rgba(168,85,247,.1))",
          position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 32
        }}>
          <LogoMark />
        </div>

        <p className="label-tag" style={{ marginBottom: 8 }}>WELCOME TO REALITY</p>
        <h1 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 48, lineHeight: 1, letterSpacing: "-0.01em", marginBottom: 16 }}>
          The <span className="iridescent">Manifestor</span>
        </h1>
        
        <p style={{ color: "#8B949E", fontSize: 15, lineHeight: 1.6, marginBottom: 40 }}>
          Stop pretending. Start executing. Your ultimate aim requires brutal accountability. We are here to ask the hard questions.
        </p>

        <button 
          onClick={() => router.push('/login')} 
          style={{ 
            width: "100%", padding: "18px", borderRadius: 16,
            background: "linear-gradient(135deg, #00C9CC, #7B2FFF 50%, #A855F7)",
            backgroundSize: "200% 200%",
            color: "white", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 16, fontWeight: 600, letterSpacing: "0.02em",
            border: "none", cursor: "pointer",
            boxShadow: "0 4px 28px rgba(123,47,255,0.4)",
            animation: "lsShimmer 4s ease-in-out infinite",
            transition: "transform 0.15s, opacity 0.15s"
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "translateY(0px)"}
          onMouseDown={e => e.currentTarget.style.transform = "scale(0.98)"}
          onMouseUp={e => e.currentTarget.style.transform = "translateY(-1px)"}
        >
          Start The Journey →
        </button>
      </div>

      <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,.15)", marginTop: 40, letterSpacing: ".06em", fontFamily: "var(--font-dm-mono),monospace", textTransform: "uppercase" }}>
        The Manifestor · Build Your Best Self
      </p>
    </div>
  );
}
