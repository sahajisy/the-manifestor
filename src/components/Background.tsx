'use client';

import { useAuth } from './AuthProvider';

export function Background() {
  const { settings } = useAuth();
  
  // Default is true if not explicitly set to false
  const showAnimations = settings?.ambientAnimations !== false;

  if (!showAnimations) return null;

  return (
    <>
      {/* Aurora blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
    </>
  );
}
