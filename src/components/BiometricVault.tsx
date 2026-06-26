'use client';

import { useEffect, useState } from 'react';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { useAuth } from './AuthProvider';

export function BiometricVault({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [locked, setLocked] = useState(true);
  const [supported, setSupported] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // If auth is still loading, wait
    if (authLoading) return;
    
    // If not logged in, no need to biometric lock
    if (!user) {
      setLocked(false);
      setChecking(false);
      return;
    }

    async function checkBiometrics() {
      try {
        const info = await BiometricAuth.checkBiometry();
        if (info.isAvailable) {
          setSupported(true);
          authenticate();
        } else {
          setLocked(false);
          setChecking(false);
        }
      } catch (e) {
        // Fallback for web
        setLocked(false);
        setChecking(false);
      }
    }
    checkBiometrics();
  }, [user, authLoading]);

  const authenticate = async () => {
    try {
      await BiometricAuth.authenticate({
        reason: 'Unlock The Manifestor',
        cancelTitle: 'Cancel',
        allowDeviceCredential: true,
        resumeTimeout: 1, // Require auth immediately upon resume
      });
      setLocked(false);
    } catch (e) {
      console.warn('Biometric authentication failed or canceled', e);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return <div style={{ height: '100dvh', width: '100%', background: '#02040A' }} />;
  }

  if (locked) {
    return (
      <div style={{ height: '100dvh', width: '100%', background: '#02040A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ fontFamily: "var(--font-bebas-neue), sans-serif", fontSize: 48, color: "#FF003C", marginBottom: 16 }}>
          VAULT LOCKED
        </h2>
        <p style={{ color: "#8B949E", marginBottom: 32, fontFamily: "var(--font-dm-sans), sans-serif" }}>
          Verify your identity to face reality.
        </p>
        <button 
          onClick={authenticate}
          style={{
            padding: "16px 32px",
            borderRadius: 12,
            background: "linear-gradient(135deg, #00F5FF, #7B2FFF)",
            color: "white",
            border: "none",
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 0 20px rgba(0, 245, 255, 0.4)"
          }}
        >
          Authenticate
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
