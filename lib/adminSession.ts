import type { AdminUser } from '@/lib/types';

const KEY = 'dtcl_admin_user';
const MAX_CACHE_MS = 5 * 60 * 1000;

type CachedAdmin = { user: AdminUser; expiresAt: number };

export function getCachedAdminUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = JSON.parse(window.sessionStorage.getItem(KEY) || 'null') as CachedAdmin | null;
    if (!cached?.user || cached.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(KEY);
      return null;
    }
    return cached.user;
  } catch {
    window.sessionStorage.removeItem(KEY);
    return null;
  }
}

export function cacheAdminUser(user: AdminUser, sessionExpiresAt?: number) {
  if (typeof window === 'undefined') return;
  const expiresAt = Math.min(sessionExpiresAt || Number.MAX_SAFE_INTEGER, Date.now() + MAX_CACHE_MS);
  window.sessionStorage.setItem(KEY, JSON.stringify({ user, expiresAt } satisfies CachedAdmin));
}

export function clearCachedAdminUser() {
  if (typeof window !== 'undefined') window.sessionStorage.removeItem(KEY);
}
