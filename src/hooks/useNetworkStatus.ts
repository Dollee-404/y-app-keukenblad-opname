import { useState, useEffect } from 'react';

export function useNetworkStatus(): boolean {
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    let offlineTimer: ReturnType<typeof setTimeout>;

    const handleOnline = () => {
      clearTimeout(offlineTimer);
      setOnline(true);
    };

    // Debounce 1s — voorkomt knipperen bij vluchtige netwerk-onderbrekingen
    const handleOffline = () => {
      offlineTimer = setTimeout(() => setOnline(false), 1000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(offlineTimer);
    };
  }, []);

  return online;
}
