'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const css = `
  .ls-root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    position: relative;
    z-index: 2;
  }

  /* ── Scanline ── */
  .ls-root::before {
    content:''; position:fixed; inset:0;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
    pointer-events:none; z-index:1;
  }

  /* ── Glass card ── */
  .ls-card {
    background: rgba(255,255,255,.032);
    backdrop-filter: blur(32px);
    -webkit-backdrop-filter: blur(32px);
    border: 1px solid rgba(255,255,255,.07);
    border-top-color: rgba(255,255,255,.14);
    border-left-color: rgba(255,255,255,.09);
    box-shadow: 0 2px 4px rgba(0,0,0,.6), 0 16px 40px rgba(0,0,0,.5), 0 50px 120px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.05);
    border-radius: 28px;
    padding: 36px 32px;
    width: 100%; max-width: 420px;
    position: relative;
    z-index: 2;
    animation: lsCardIn .7s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes lsCardIn { from { opacity:0; transform:translateY(28px) scale(.98); } }

  /* ── Iridescent ── */
  .ls-iri {
    background: linear-gradient(130deg, #00F5FF 0%, #A855F7 30%, #FF003C 60%, #FF9500 80%, #00F5FF 100%);
    background-size: 300% 300%;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: lsShimmer 6s ease-in-out infinite;
  }
  @keyframes lsShimmer { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }

  /* ── Logo ── */
  .ls-logo {
    width: 52px; height: 52px; border-radius: 15px;
    background: radial-gradient(circle at 40% 35%, rgba(0,245,255,.15), rgba(168,85,247,.1));
    position: relative; display: flex; align-items: center; justify-content: center;
    margin-bottom: 24px;
  }
  .ls-logo::before {
    content:''; position:absolute; inset:-1.5px; border-radius:17px;
    background: conic-gradient(from 0deg, #00F5FF, #A855F7, #FF003C, #00F5FF);
    -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 1.5px), white calc(100% - 1.5px));
    mask: radial-gradient(farthest-side, transparent calc(100% - 1.5px), white calc(100% - 1.5px));
    animation: lsLogoSpin 8s linear infinite; opacity:.65;
  }
  @keyframes lsLogoSpin { to { transform:rotate(360deg); } }

  /* ── Social buttons ── */
  .ls-soc-btn {
    width: 100%;
    padding:16px 12px;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.08);
    border-top-color: rgba(255,255,255,.13);
    border-radius: 16px; cursor:pointer;
    display:flex; align-items:center; justify-content:center; gap:12px;
    color:#C8D0DC; font-family:var(--font-dm-sans),sans-serif; font-size:15px; font-weight:500;
    transition: background .2s, border-color .2s, transform .15s;
  }
  .ls-soc-btn:hover { background:rgba(255,255,255,.07); border-color:rgba(255,255,255,.15); transform:translateY(-1px); }
  .ls-soc-btn:active { transform:scale(.99); }

  /* ── Success state ── */
  .ls-success {
    display:flex; flex-direction:column; align-items:center;
    text-align:center; padding:8px 0;
    animation: lsCardIn .5s cubic-bezier(.22,1,.36,1) both;
  }
  .ls-success-ring {
    width:80px;height:80px;border-radius:50%;
    background:rgba(0,255,136,.07);
    border:1px solid rgba(0,255,136,.35);
    display:flex;align-items:center;justify-content:center;
    margin-bottom:20px;
    animation:lsGreenPulse 2.5s ease-in-out infinite;
  }
  @keyframes lsGreenPulse {
    0%,100%{box-shadow:0 0 24px rgba(0,255,136,.2),0 0 60px rgba(0,255,136,.06)}
    50%{box-shadow:0 0 48px rgba(0,255,136,.35),0 0 120px rgba(0,255,136,.12)}
  }

  /* ── Spinner ── */
  .ls-spinner {
    width:18px; height:18px; border-radius:50%;
    border: 2px solid rgba(255,255,255,.2);
    border-top-color: white;
    animation: lsSpin .7s linear infinite;
  }
  @keyframes lsSpin { to{transform:rotate(360deg)} }

  /* ── Tag ── */
  .ls-tag {
    font-family:var(--font-dm-mono),monospace;font-size:10px;font-weight:500;
    letter-spacing:.15em;text-transform:uppercase;color:#8B949E;
  }
`;

// ── SVG ICONS ──────────────────────────────────────────────────────────
const LogoMark = () => (
  <svg width="26" height="26" viewBox="0 0 40 40" fill="none">
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

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// ── SUCCESS STATE ──────────────────────────────────────────────────────
function SuccessState() {
  return (
    <div className="ls-success">
      <div className="ls-success-ring">
        <svg width="36" height="36" viewBox="0 0 44 44" fill="none">
          <path d="M12 22L19 29L32 15" stroke="#00FF88" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p className="ls-tag" style={{ marginBottom:8 }}>
        WELCOME BACK
      </p>
      <h3 style={{ fontFamily:"var(--font-bebas-neue),sans-serif", fontSize:42, lineHeight:1, marginBottom:10 }}>
        You're <span className="ls-iri">In</span>
      </h3>
      <p style={{ fontSize:14, color:"#8B949E", lineHeight:1.6 }}>
        Redirecting you to your dashboard…
      </p>
      <div style={{ marginTop:20, width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <span className="ls-spinner" style={{ width:24, height:24 }}/>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const router = useRouter();
  
  const [success, setSuccess] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      setSuccess(true);
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    try {
      setLoggingIn(true);
      await login();
    } catch (err) {
      console.error(err);
      setLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="full-screen-center">
        <span className="ls-spinner" style={{ width:32, height:32, borderWidth: 3 }}/>
      </div>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="ls-root">
        <div className="ls-card">
          {success ? (
            <SuccessState />
          ) : (
            <>
              {/* Logo + heading */}
              <div className="ls-logo">
                <LogoMark />
              </div>
              <p className="ls-tag" style={{ marginBottom:6 }}>THE MANIFESTOR</p>
              <h1 style={{ fontFamily:"var(--font-bebas-neue),sans-serif", fontSize:42, lineHeight:1, marginBottom:8 }}>
                <span className="ls-iri">Welcome</span> Back
              </h1>
              <p style={{ fontSize:14, color:"#8B949E", marginBottom:32, lineHeight:1.6, fontWeight:400 }}>
                Sign in with Google to continue your journey.
              </p>

              {/* Social auth */}
              <button 
                className="ls-soc-btn" 
                onClick={handleGoogleLogin} 
                disabled={loggingIn}
              >
                {loggingIn ? <span className="ls-spinner" style={{ width: 20, height: 20 }}/> : <GoogleIcon />}
                <span>{loggingIn ? "Connecting..." : "Continue with Google"}</span>
              </button>

              {/* Footer */}
              <p style={{ marginTop:24, textAlign:"center", fontSize:12, color:"rgba(255,255,255,.2)", lineHeight:1.7 }}>
                Protected by end-to-end encryption · No spam, ever
              </p>
            </>
          )}
        </div>

        {/* Bottom attribution */}
        <p style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,.15)", marginTop: 40, letterSpacing:".06em", fontFamily:"var(--font-dm-mono),monospace", textTransform:"uppercase" }}>
          The Manifestor · All rights reserved
        </p>
      </div>
    </>
  );
}
