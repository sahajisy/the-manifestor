'use client';

import { useRouter } from 'next/navigation';

export default function DeveloperPage() {
  const router = useRouter();

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "40px 20px" }} className="animate-fade-in relative z-10">
      <div className="glass" style={{ padding: "48px 32px", width: "100%", maxWidth: 600, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h1 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 48, lineHeight: 1, letterSpacing: "-0.01em", marginBottom: 16 }}>
          <span className="iridescent">Sahaj Balgunde</span>
        </h1>
        
        <p className="label-tag" style={{ marginBottom: 24 }}>Developer · Tester · Creator · Connector</p>
        
        <p style={{ color: "#8B949E", fontSize: 16, lineHeight: 1.6, marginBottom: 40 }}>
          I am a passionate developer and tester dedicated to building robust and innovative web solutions. 
          With a strong foundation in modern web technologies, I strive to create seamless and engaging user experiences.
        </p>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
          <button 
            onClick={() => window.open('https://sahajbalgunde.com/', '_blank')}
            style={{ 
              padding: "16px 24px", borderRadius: 16,
              background: "linear-gradient(135deg, #00C9CC, #7B2FFF 50%, #A855F7)",
              backgroundSize: "200% 200%",
              color: "white", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 15, fontWeight: 600, letterSpacing: "0.02em",
              border: "none", cursor: "pointer",
              boxShadow: "0 4px 28px rgba(123,47,255,0.4)",
              animation: "lsShimmer 4s ease-in-out infinite",
              transition: "transform 0.15s, opacity 0.15s"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0px)"}
          >
            Visit Website
          </button>
          
          <button 
            onClick={() => router.back()}
            style={{ 
              padding: "16px 24px", borderRadius: 16,
              background: "rgba(255, 255, 255, 0.05)",
              color: "white", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 15, fontWeight: 600, letterSpacing: "0.02em",
              border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
              transition: "transform 0.15s, background 0.15s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0px)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
