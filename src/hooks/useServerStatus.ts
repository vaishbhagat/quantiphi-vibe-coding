import { useState, useEffect, useCallback } from 'react';
import { MacroApiService, HealthResponse } from '../services/api';

export interface UseServerStatusResult {
  status: 'loading' | 'online' | 'offline';
  serverInfo: HealthResponse | null;
  error: string | null;
  checkStatus: () => Promise<void>;
}

export function useServerStatus(): UseServerStatusResult {
  const [status, setStatus] = useState<'loading' | 'online' | 'offline'>('loading');
  const [serverInfo, setServerInfo] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      setError(null);
      const data = await MacroApiService.checkServerHealth();
      setServerInfo(data);
      setStatus('online');
    } catch (err: any) {
      console.warn('API connection check failed:', err);
      setError(err?.message || 'Server is unreachable');
      setStatus('offline');
    }
  }, []);

  useEffect(() => {
    checkStatus();
    // Periodically poll every 10 seconds to keep connection feedback fresh
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return {
    status,
    serverInfo,
    error,
    checkStatus,
  };
}
