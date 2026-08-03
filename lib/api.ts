import type { ApiResponse } from '@/lib/types';

const WRITE_ACTIONS = new Set([
  'dangKyNguoiChoi', 'luuGiaiDau', 'themNguoiChoi', 'suaNguoiChoi', 'xoaNguoiChoi',
  'capNhatTrangThaiNguoiChoi', 'khoaDangKy', 'moDangKy', 'bocThamGiaiDau',
  'huyKetQuaBocTham', 'capNhatKetQuaTranDau', 'dangXuat',
]);

function clearApiSessionCache() {
  if (typeof window === 'undefined') return;
  Object.keys(window.sessionStorage).filter(key => key.startsWith('dtcl_api:')).forEach(key => window.sessionStorage.removeItem(key));
}

export async function callApi<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch('/api/apps-script', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    cache: 'no-store',
    body: JSON.stringify({ action, ...payload }),
  });
  const result = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !result.ok || result.data === undefined) {
    throw new Error(result.error || 'Không thể kết nối đến hệ thống. Vui lòng thử lại.');
  }
  if (WRITE_ACTIONS.has(action)) clearApiSessionCache();
  return result.data;
}

export function formatDate(value?: string, includeTime = false) {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

export const statusLabel: Record<string, string> = {
  DANG_DANG_KY: 'Đang đăng ký', DA_KHOA_DANG_KY: 'Đã khóa đăng ký',
  DA_BOC_THAM: 'Đã bốc thăm', DANG_THI_DAU: 'Đang thi đấu', DA_KET_THUC: 'Đã kết thúc',
  CHO_XAC_NHAN: 'Chờ xác nhận', DA_XAC_NHAN: 'Đã xác nhận', TU_CHOI: 'Từ chối',
};
