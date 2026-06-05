'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { RealityCheck } from '@/components/RealityCheck';

export default function QuestionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [aim, setAim] = useState('');
  const [intensity, setIntensity] = useState('Harsh');
  const [fetchingData, setFetchingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const fetchAim = async () => {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().aim) {
            setAim(docSnap.data().aim);
            setIntensity(docSnap.data().intensity || 'Harsh');
          } else {
            router.push('/onboarding');
          }
        } catch (error) {
          console.error("Error fetching aim:", error);
        } finally {
          setFetchingData(false);
        }
      };
      fetchAim();
    }
  }, [user, router]);

  const handleComplete = () => {
    router.push('/dashboard');
  };

  if (loading || fetchingData) {
    return <div className="flex items-center justify-center min-h-[50vh] text-[#8B949E] text-sm">Preparing interrogation...</div>;
  }

  if (!user || !aim) return null;

  return (
    <div className="animate-fade-in w-full">
      <RealityCheck 
        userId={user.uid} 
        aim={aim} 
        intensity={intensity} 
        onComplete={handleComplete} 
      />
    </div>
  );
}
