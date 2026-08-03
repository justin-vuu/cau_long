'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { callApi } from '@/lib/api';

const DATA_CACHE_MS = 30_000;
const inFlight = new Map<string, Promise<unknown>>();

function apiCacheKey(action: string, payload: Record<string, unknown>) { return `dtcl_api:${action}:${JSON.stringify(payload)}`; }

function readCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = JSON.parse(window.sessionStorage.getItem(key) || 'null') as { data: T; time: number } | null;
    return cached && Date.now() - cached.time < DATA_CACHE_MS ? cached.data : null;
  } catch { return null; }
}

async function fetchAndCache<T>(action: string, payload: Record<string, unknown>, cacheKey: string): Promise<T> {
  const running = inFlight.get(cacheKey) as Promise<T> | undefined;
  if (running) return running;
  const request = callApi<T>(action, payload).then(fresh => {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(cacheKey, JSON.stringify({ data: fresh, time: Date.now() }));
    return fresh;
  }).finally(() => inFlight.delete(cacheKey));
  inFlight.set(cacheKey, request);
  return request;
}

export async function prefetchApiData(action: string, payload: Record<string, unknown> = {}) {
  const cacheKey = apiCacheKey(action, payload);
  if (readCache(cacheKey)) return;
  try { await fetchAndCache(action, payload, cacheKey); } catch { /* Trang đích sẽ tự hiển thị lỗi nếu cần. */ }
}

export function useApiData<T>(action: string, payload: Record<string, unknown> = {}) {
  const cacheKey = apiCacheKey(action, payload);
  const [data, setData] = useState<T | null>(() => readCache<T>(cacheKey));
  const dataRef = useRef(data);
  const [loading, setLoading] = useState(() => !readCache<T>(cacheKey));
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!dataRef.current) setLoading(true); setError('');
    try {
      const fresh = await fetchAndCache<T>(action, payload, cacheKey);
      dataRef.current = fresh; setData(fresh);
    }
    catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, JSON.stringify(payload), cacheKey]);
  useEffect(() => { void load(); }, [load]);
  return { data, loading, error, reload: load, setData };
}
