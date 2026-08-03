'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { callApi } from '@/lib/api';
import type { AdminUser } from '@/lib/types';
import { LoadingState } from '@/components/UiStates';
import { cacheAdminUser, getCachedAdminUser } from '@/lib/adminSession';

export default function AdminGuard({ children, onUser }: { children: React.ReactNode; onUser?: (user: AdminUser) => void }) {
  const router = useRouter(); const pathname = usePathname();
  const [cachedUser] = useState<AdminUser | null>(() => getCachedAdminUser());
  const [ready, setReady] = useState(Boolean(cachedUser));
  useEffect(() => {
    if (cachedUser) { onUser?.(cachedUser); return; }
    callApi<{ user: AdminUser }>('xacThucPhien').then(r => {
      cacheAdminUser(r.user); onUser?.(r.user); setReady(true);
    }).catch(() => router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`));
  }, [router, pathname, onUser, cachedUser]);
  if (!ready) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><LoadingState label="Đang xác thực phiên..." /></div>;
  return children;
}
