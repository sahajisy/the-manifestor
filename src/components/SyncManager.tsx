'use client';

import { useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

export function SyncManager() {
  useEffect(() => {
    const syncOfflineData = async () => {
      if (!navigator.onLine) return;

      try {
        const { getQueuedAudio, removeQueuedAudio } = await import('@/lib/offlineQueue');
        const queue = await getQueuedAudio();
        
        if (queue.length === 0) return;
        
        console.log(`Syncing ${queue.length} offline audio recordings...`);

        for (const item of queue) {
          try {
            // Convert Blob back to base64 for uploadString, or just upload bytes
            // Wait, storage accepts uploadBytes directly for Blob
            const storageRef = ref(storage, item.audioFileName);
            
            // Need to convert blob to base64 or upload bytes
            // The previous code used uploadString with data_url, but we can use uploadBytes with Blob
            const { uploadBytes } = await import('firebase/storage');
            await uploadBytes(storageRef, item.audioBlob);
            const downloadUrl = await getDownloadURL(storageRef);

            // Transcribe if needed - for simplicity we just update the URL for now
            // or we could ping the transcribe API here using the blob
            let transcript = "";
            let sentimentScore = null;
            try {
              const formData = new FormData();
              formData.append('file', item.audioBlob);
              const res = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData
              });
              if (res.ok) {
                const data = await res.json();
                transcript = data.transcript || "";

                if (transcript) {
                  // Wait, how do we get the aim here?
                  // We don't have aim stored in the item queue.
                  // Since we are inside the client, we could fetch it from the user doc, but it's easier to just pass "Unknown aim" and let Gemini guess from transcript, or skip sentiment for background sync for now.
                  // Let's fetch the aim from Firestore since we have userId.
                  const { getDoc } = await import('firebase/firestore');
                  const userDoc = await getDoc(doc(db, 'users', item.userId));
                  const aim = userDoc.exists() ? userDoc.data().aim : "Goal";

                  const sentimentRes = await fetch('/api/analyze-sentiment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ aim, transcript })
                  });
                  if (sentimentRes.ok) {
                    const sentimentData = await sentimentRes.json();
                    sentimentScore = sentimentData.score;
                  }
                }
              }
            } catch (err) {
              console.error("Transcription/Sentiment failed during sync", err);
            }

            // Update Firestore document
            const docRef = doc(db, 'users', item.userId, 'checks', item.id);
            const updatePayload: any = { audioUrl: downloadUrl };
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
