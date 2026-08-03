import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, unstable_cache } from 'next/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PUBLIC_READ_ACTIONS = new Set([
  'layGiaiDauCongKhai', 'layDanhSachNguoiChoiCongKhai',
  'layDanhSachDoiCongKhai', 'layBangDauCongKhai',
]);
const WRITE_ACTIONS = new Set([
  'dangKyNguoiChoi', 'luuGiaiDau', 'themNguoiChoi', 'suaNguoiChoi', 'xoaNguoiChoi',
  'capNhatTrangThaiNguoiChoi', 'khoaDangKy', 'moDangKy', 'bocThamGiaiDau',
  'huyKetQuaBocTham', 'capNhatKetQuaTranDau',
]);
const PUBLIC_CACHE_TAG = 'du-lieu-giai-cong-khai';

async function callAppsScript(body: Record<string, unknown>, sessionToken = '') {
  const apiUrl = process.env.APPS_SCRIPT_API_URL;
  const sharedSecret = process.env.APPS_SCRIPT_SHARED_SECRET;
  if (!apiUrl || !sharedSecret) throw new Error('Máy chủ chưa được cấu hình Apps Script.');
  const upstream = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    cache: 'no-store',
    redirect: 'follow',
    body: JSON.stringify({ ...body, sharedSecret, sessionToken }),
  });
  const raw = await upstream.text();
  try { return JSON.parse(raw) as Record<string, unknown>; }
  catch { throw new Error('Apps Script trả về dữ liệu không hợp lệ. Kiểm tra URL deployment /exec.'); }
}

// Cache dùng chung trên Vercel giúp người xem không phải chờ Apps Script khởi động.
const getCachedPublicData = unstable_cache(
  async (action: string) => callAppsScript({ action }),
  ['apps-script-public-v1'],
  { revalidate: 20, tags: [PUBLIC_CACHE_TAG] },
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || typeof body.action !== 'string') {
      return NextResponse.json({ ok: false, error: 'Yêu cầu không hợp lệ.' }, { status: 400 });
    }
    const sessionToken = request.cookies.get('dtcl_session')?.value || '';
    const result = PUBLIC_READ_ACTIONS.has(body.action)
      ? await getCachedPublicData(body.action)
      : await callAppsScript(body, sessionToken);

    if (result.ok && WRITE_ACTIONS.has(body.action)) {
      revalidateTag(PUBLIC_CACHE_TAG, { expire: 0 });
    }

    const status = result.ok ? 200 : result.code === 'UNAUTHORIZED' ? 401 : 400;
    if (body.action === 'dangNhap' && result.ok && result.data && typeof result.data === 'object') {
      const data = result.data as Record<string, unknown>;
      const token = String(data.token || '');
      const expiresAt = Number(data.expiresAt || Date.now() + 8 * 60 * 60 * 1000);
      const response = NextResponse.json({ ...result, data: { user: data.user, expiresAt } });
      response.cookies.set('dtcl_session', token, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict',
        path: '/', expires: new Date(expiresAt),
      });
      return response;
    }
    if (body.action === 'dangXuat') {
      const response = NextResponse.json({ ok: true, data: { success: true } });
      response.cookies.set('dtcl_session', '', { httpOnly: true, expires: new Date(0), path: '/' });
      return response;
    }
    return NextResponse.json(result, { status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi proxy không xác định.';
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
