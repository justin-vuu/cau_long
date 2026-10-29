'use client';

import { Search, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import PublicShell from '@/components/PublicShell';
import PublicPageTitle from '@/components/PublicPageTitle';
import { EmptyState, ErrorState, LoadingState } from '@/components/UiStates';
import { statusLabel } from '@/lib/api';
import type { Player } from '@/lib/types';
import { useApiData } from '@/hooks/useApiData';

export default function PlayersPage() {
  const { data, loading, error, reload } = useApiData<{ players: Player[] }>('layDanhSachNguoiChoiCongKhai');
  const [search, setSearch] = useState('');
  const players = useMemo(() => (data?.players || []).filter(p => `${p.HoTen} ${p.CauLacBo} ${p.KhoaHoc || ''} ${p.LopChuyen || ''}`.toLowerCase().includes(search.toLowerCase())), [data, search]);
  return <PublicShell><PublicPageTitle eyebrow="DANH SÁCH CÔNG KHAI" title="Người chơi đăng ký" description="Số điện thoại được ẩn để bảo vệ thông tin cá nhân. Danh sách cập nhật trực tiếp từ ban tổ chức." /><main className="container-page list-main">
    <div className="list-tools"><div><b><Users size={18} /> {data?.players.length || 0} người chơi</b><span>Bao gồm đăng ký đang chờ và đã xác nhận</span></div><label className="search-box"><Search size={17} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên, khóa hoặc lớp..." /></label></div>
    <section className="card">{loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={reload} /> : !players.length ? <EmptyState title="Chưa có người chơi" message="Danh sách đăng ký sẽ xuất hiện tại đây." /> : <div className="table-wrap"><table className="data-table"><thead><tr><th>STT</th><th>Họ và tên</th><th>Trình độ</th><th>Khóa · Lớp chuyên</th><th>Trạng thái</th></tr></thead><tbody>{players.map((p, i) => <tr key={p.MaNguoiChoi}><td><b className="number">{i + 1}</b></td><td><b>{p.HoTen}</b></td><td><span className="level">{p.VaiTro === 'Cổ động viên' ? 'Cổ động viên' : p.TrinhDo}</span></td><td>{[p.KhoaHoc, p.LopChuyen].filter(Boolean).join(' · ') || p.CauLacBo || '—'}</td><td><span className={`status-pill ${p.TrangThai === 'DA_XAC_NHAN' ? 'status-green' : p.TrangThai === 'TU_CHOI' ? 'status-red' : 'status-amber'}`}>{statusLabel[p.TrangThai]}</span></td></tr>)}</tbody></table></div>}</section>
  </main><style>{`.list-main{padding:36px 0}.list-tools{display:flex;justify-content:space-between;align-items:end;margin-bottom:18px}.list-tools>div b{display:flex;align-items:center;gap:8px;font-size:16px}.list-tools>div span{display:block;color:var(--muted);font-size:12px;margin-top:5px}.search-box{width:310px;display:flex;align-items:center;gap:9px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:0 12px}.search-box svg{color:var(--muted)}.search-box input{border:0;outline:0;height:42px;width:100%;font-size:13px}.number{display:grid;width:28px;height:28px;place-items:center;background:#f1f4f9;border-radius:8px;font-size:12px}.level{padding:5px 9px;border-radius:7px;background:var(--blue-soft);color:var(--blue);font-size:12px;font-weight:700}@media(max-width:650px){.list-tools{align-items:stretch;flex-direction:column;gap:15px}.search-box{width:100%}}`}</style></PublicShell>;
}
