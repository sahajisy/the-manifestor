'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, provider } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let unsubscribe = () => {};
    
    // Fallback timeout in case Firebase completely hangs
    const fallbackTimeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    try {
      unsubscribe = onAuthStateChanged(auth, (user) => {
        clearTimeout(fallbackTimeout);
        setUser(user);
        setLoading(false);
      }, (error) => {
        clearTimeout(fallbackTimeout);
        console.error("Firebase Auth Error:", error);
        setLoading(false); // Stop loading if it fails
      });
    } catch (err) {
      clearTimeout(fallbackTimeout);
      console.error("Firebase Auth Init Error:", err);
      setLoading(false);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.error('Service Worker registration failed', err));
    }

    return () => {
      clearTimeout(fallbackTimeout);
      unsubscribe();
    };
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
