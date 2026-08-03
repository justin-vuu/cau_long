'use client';

import { useEffect } from 'react';
import { prefetchApiData } from '@/hooks/useApiData';

const PUBLIC_ACTIONS = [
  'layGiaiDauCongKhai',
  'layDanhSachNguoiChoiCongKhai',
  'layDanhSachDoiCongKhai',
  'layBangDauCongKhai',
];

export default function PublicDataPrefetch() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      PUBLIC_ACTIONS.forEach(action => void prefetchApiData(action));
    }, 600);
    return () => window.clearTimeout(timer);
  }, []);
  return null;
}
