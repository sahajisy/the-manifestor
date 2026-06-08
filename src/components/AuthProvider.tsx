'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut, deleteUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, provider, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  settings: any;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  deleteAccount: async () => {},
  settings: {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>({});
  const router = useRouter();

  useEffect(() => {
    let unsubscribeAuth = () => {};
    let unsubscribeDoc = () => {};
    
    const fallbackTimeout = setTimeout(() => setLoading(false), 3000);

    try {
      unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        clearTimeout(fallbackTimeout);
        setUser(user);
        
        if (user) {
          unsubscribeDoc = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
            if (docSnap.exists()) {
              setSettings(docSnap.data());
            }
          });
        } else {
          setSettings({});
        }
        
        setLoading(false);
      }, (error) => {
        clearTimeout(fallbackTimeout);
        console.error("Firebase Auth Error:", error);
        setLoading(false);
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
      unsubscribeAuth();
      unsubscribeDoc();
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

  const deleteAccount = async () => {
    if (!auth.currentUser) return;
    try {
      await deleteUser(auth.currentUser);
      router.push('/');
    } catch (error: any) {
      console.error('Delete account failed', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, deleteAccount, settings }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
