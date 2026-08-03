'use client';

import { useCallback, useEffect, useState } from 'react';
import { callApi } from '@/lib/api';

export function useApiData<T>(action: string, payload: Record<string, unknown> = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await callApi<T>(action, payload)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, JSON.stringify(payload)]);
  useEffect(() => { void load(); }, [load]);
  return { data, loading, error, reload: load, setData };
}
