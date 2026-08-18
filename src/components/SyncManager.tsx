'use client';

import { useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getQueuedAudio, removeQueuedAudio } from '@/lib/offlineQueue';

export function SyncManager() {
  useEffect(() => {
    const syncOfflineData = async () => {
      if (!navigator.onLine) return;

      try {

        const queue = await getQueuedAudio();
        
        if (queue.length === 0) return;
        
        console.log(`Syncing ${queue.length} offline audio recordings...`);

        for (const item of queue) {
          try {
            // Audio storage is disabled. Just run transcription directly.
            let transcript = "";
            let sentimentScore = null;
            try {
              const userDoc = await getDoc(doc(db, 'users', item.userId));
              const aim = userDoc.exists() ? userDoc.data().aim : "Goal";

              const formData = new FormData();
              formData.append('file', item.audioBlob);
              formData.append('aim', aim);

              const res = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData
              });
              if (res.ok) {
                const data = await res.json();
                transcript = data.transcript || "";
                sentimentScore = data.sentimentScore ?? null;
              }
            } catch (err) {
              console.error("Transcription/Sentiment failed during sync", err);
            }

            // Update Firestore document
            const docRef = doc(db, 'users', item.userId, 'checks', item.id);
            const updatePayload: any = {};
            if (transcript) updatePayload.transcript = transcript;
            if (sentimentScore !== null) updatePayload.sentimentScore = sentimentScore;
            
            await updateDoc(docRef, updatePayload);

            // Remove from local IndexedDB
            await removeQueuedAudio(item.id);
            console.log(`Successfully synced offline check ${item.id}`);

          } catch (err) {
            console.error(`Failed to sync item ${item.id}`, err);
          }
        }
      } catch (err) {
        console.error("SyncManager error", err);
      }
    };

    window.addEventListener('online', syncOfflineData);
    
    // Also try on mount in case we came online while the app was closed
    syncOfflineData();

    return () => {
      window.removeEventListener('online', syncOfflineData);
    };
  }, []);

  return null;
}
