'use client';

import Link from 'next/link';
import { CalendarDays, CheckCircle2, Clock3, MapPin, ShieldCheck, Shuffle, Trophy, Users } from 'lucide-react';
import PublicShell from '@/components/PublicShell';
import { ErrorState, LoadingState } from '@/components/UiStates';
import { formatDate, statusLabel } from '@/lib/api';
import type { Tournament } from '@/lib/types';
import { useApiData } from '@/hooks/useApiData';

export default function HomePage() {
  const { data: tournament, loading, error, reload } = useApiData<Tournament>('layGiaiDauCongKhai');
  const canRegister = tournament?.TrangThai === 'DANG_DANG_KY';
  return (
    <PublicShell>
      <main>
        <section className="hero">
          <div className="court-lines" />
          <div className="container-page hero-grid">
            <div className="hero-copy">
              <span className="eyebrow"><span /> VÒNG BẢNG & LOẠI TRỰC TIẾP</span>
              <h1>{tournament?.TenGiai || 'Đấu Trường Cầu Lông'}</h1>
              <p className="lead">Đăng ký <b>cá nhân</b>, hệ thống bốc thăm ngẫu nhiên để ghép đôi và xếp bracket. Công bằng, minh bạch, đầy kịch tính.</p>
              <div className="hero-actions">
                <Link href="/dang-ky" className="btn btn-primary" aria-disabled={!canRegister}><Trophy size={18} /> Đăng ký thi đấu</Link>
                <Link href="/bang-dau" className="btn ghost">Xem sơ đồ <span>→</span></Link>
              </div>
              <div className="mini-points"><span><CheckCircle2 /> Ghép đôi ngẫu nhiên</span><span><ShieldCheck /> Kết quả minh bạch</span></div>
            </div>
            <div className="hero-card card">
              {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={reload} /> : tournament && <>
                <div className="event-head"><div className="shuttle"><Trophy /></div><div><small>GIẢI ĐẤU SẮP DIỄN RA</small><h2>{tournament.TenGiai}</h2></div></div>
                <div className="event-info"><p><CalendarDays /> <span><small>THỜI GIAN</small><b>{formatDate(tournament.NgayBatDau, true)}</b></span></p><p><MapPin /><span><small>ĐỊA ĐIỂM</small><b>{tournament.DiaDiem || 'Đang cập nhật'}</b></span></p><p><Clock3 /><span><small>HẠN ĐĂNG KÝ</small><b>{formatDate(tournament.HanDangKy, true)}</b></span></p></div>
                <div className="event-foot"><span className={`status-pill ${canRegister ? 'status-green' : 'status-orange'}`}>{statusLabel[tournament.TrangThai]}</span><b><Users size={16} /> {tournament.SoNguoiDangKy || 0} người đã đăng ký</b></div>
              </>}
            </div>
          </div>
        </section>
        <section className="container-page quick-section">
          <div className="section-title"><span>THEO DÕI GIẢI ĐẤU</span><h2>Mọi thông tin trong một nơi</h2><p>Dữ liệu được cập nhật trực tiếp từ ban tổ chức.</p></div>
          <div className="quick-grid">
            <Link href="/nguoi-choi" className="quick-card card"><span className="quick-icon blue"><Users /></span><h3>Danh sách người chơi</h3><p>Xem người chơi đã đăng ký và trạng thái xác nhận.</p><b>Xem danh sách →</b></Link>
            <Link href="/doi-thi-dau" className="quick-card card"><span className="quick-icon orange"><Shuffle /></span><h3>Đội sau bốc thăm</h3><p>Theo dõi kết quả ghép đôi ngẫu nhiên chính thức.</p><b>Xem các đội →</b></Link>
            <Link href="/bang-dau" className="quick-card card"><span className="quick-icon green"><Trophy /></span><h3>Sơ đồ thi đấu</h3><p>Bracket, tỷ số và hành trình tới chức vô địch.</p><b>Xem bracket →</b></Link>
          </div>
        </section>
      </main>
      <style>{`
        .hero{position:relative;overflow:hidden;background:linear-gradient(118deg,#0a1425 0%,#152846 62%,#1c3658 100%);color:#fff;min-height:570px;display:flex;align-items:center}.court-lines{position:absolute;inset:0;background:linear-gradient(90deg,transparent 49.8%,rgba(255,255,255,.03) 50%,transparent 50.2%),linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px);background-size:100% 100%,100% 120px}.hero:after{content:'';position:absolute;width:480px;height:480px;border:1px solid rgba(255,255,255,.06);border-radius:50%;right:-170px;top:-180px}.hero-grid{position:relative;z-index:1;display:grid;grid-template-columns:1.05fr .95fr;gap:70px;align-items:center;padding:68px 0}.eyebrow{font-size:11px;font-weight:900;letter-spacing:.18em;color:#ffab72;display:flex;align-items:center;gap:9px}.eyebrow span{width:26px;height:2px;background:var(--orange)}.hero h1{font-size:clamp(42px,5.4vw,72px);line-height:1.03;letter-spacing:-.045em;margin:18px 0 20px;max-width:650px}.lead{color:#aebbd0;font-size:17px;line-height:1.75;max-width:620px}.lead b{color:#fff}.hero-actions{display:flex;gap:12px;margin-top:30px}.hero-actions .btn{min-height:50px;padding:12px 20px}.ghost{border-color:rgba(255,255,255,.2);color:#fff;background:rgba(255,255,255,.05)}.mini-points{display:flex;gap:22px;margin-top:24px;color:#93a1b7;font-size:12px}.mini-points span{display:flex;align-items:center;gap:6px}.mini-points svg{width:15px;color:#54c99b}.hero-card{padding:0;overflow:hidden;color:var(--ink);transform:rotate(1deg)}.event-head{padding:24px;display:flex;gap:15px;align-items:center;border-bottom:1px solid var(--line)}.shuttle{width:52px;height:52px;border-radius:14px;background:var(--orange-soft);color:var(--orange);display:grid;place-items:center}.event-head small,.event-info small{display:block;font-size:9px;font-weight:900;letter-spacing:.13em;color:#9aa2b2;margin-bottom:5px}.event-head h2{font-size:19px;margin:0}.event-info{padding:7px 24px}.event-info p{display:flex;align-items:center;gap:13px;padding:13px 0;margin:0;border-bottom:1px solid var(--line)}.event-info p:last-child{border:0}.event-info svg{color:var(--orange);width:19px}.event-info b{font-size:13px}.event-foot{background:#f8fafc;padding:16px 24px;display:flex;align-items:center;justify-content:space-between}.event-foot>b{display:flex;align-items:center;gap:6px;font-size:12px;color:#59647a}.quick-section{padding:76px 0 20px}.section-title{text-align:center;margin-bottom:35px}.section-title span{font-size:10px;letter-spacing:.18em;font-weight:900;color:var(--orange)}.section-title h2{font-size:32px;margin:10px 0 8px}.section-title p{color:var(--muted)}.quick-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.quick-card{padding:25px;transition:.2s}.quick-card:hover{transform:translateY(-4px);border-color:#d9dfe9}.quick-icon{width:48px;height:48px;border-radius:14px;display:grid;place-items:center}.quick-icon.blue{background:var(--blue-soft);color:var(--blue)}.quick-icon.orange{background:var(--orange-soft);color:var(--orange)}.quick-icon.green{background:var(--green-soft);color:var(--green)}.quick-card h3{margin:18px 0 8px;font-size:17px}.quick-card p{font-size:13px;line-height:1.65;color:var(--muted);min-height:44px}.quick-card b{display:block;margin-top:16px;font-size:12px;color:var(--orange)}
        @media(max-width:900px){.hero-grid{grid-template-columns:1fr;gap:38px}.hero{min-height:0}.hero-card{transform:none;max-width:580px}.quick-grid{grid-template-columns:1fr}.quick-card p{min-height:0}}@media(max-width:600px){.hero-grid{padding:48px 0}.hero h1{font-size:42px}.lead{font-size:15px}.hero-actions{flex-direction:column}.mini-points{flex-direction:column;gap:9px}.event-foot{align-items:flex-start;gap:12px;flex-direction:column}.quick-section{padding-top:54px}.section-title h2{font-size:26px}}
      `}</style>
    </PublicShell>
  );
}
