'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function WelcomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="full-screen-center text-muted">Checking destiny...</div>;
  }

  return (
    <main className="full-screen-center">
      <div className="bg-blob-1" />
      <div className="bg-blob-2" />

      <div className="text-center animate-fade-in z-10 max-w-2xl px-6">
        <h1 className="title-xl text-gradient mb-6">
          The Manifestor
        </h1>
        <p className="text-xl text-slate-300 mb-8 leading-relaxed">
          Stop pretending. Start executing. <br/>
          Your ultimate aim requires brutal accountability. We are here to ask the hard questions.
        </p>

        <button 
          onClick={() => router.push('/login')} 
          className="btn-primary w-full max-w-md py-4 text-lg"
        >
          Start The Journey
        </button>
      </div>
    </main>
  );
}
