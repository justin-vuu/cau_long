'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { callApi } from '@/lib/api';
import type { AdminUser } from '@/lib/types';
import { LoadingState } from '@/components/UiStates';

export default function AdminGuard({ children, onUser }: { children: React.ReactNode; onUser?: (user: AdminUser) => void }) {
  const router = useRouter(); const pathname = usePathname();
  const [ready, setReady] = useState(false);
  useEffect(() => { callApi<{ user: AdminUser }>('xacThucPhien').then(r => { onUser?.(r.user); setReady(true); }).catch(() => router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`)); }, [router, pathname, onUser]);
  if (!ready) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><LoadingState label="Đang xác thực phiên..." /></div>;
  return children;
}
