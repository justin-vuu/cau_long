'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, CheckCircle2, Info, QrCode, Send } from 'lucide-react';
import PublicShell from '@/components/PublicShell';
import { callApi } from '@/lib/api';
import qrPayment from '@/anh_quan_trong/anh_qr_cl40.png';

const FEE = '200.000 đồng';
const FEE_DEADLINE = '11/11/2026';
const TRANSFER_NOTE = 'Họ tên - Khóa - CL40';
const ATHLETE = 'Vận động viên';
const initial = { HoTen: '', KhoaHoc: '', LopChuyen: '', SoDienThoai: '', GioiTinh: '', TrinhDo: '', DongDoiMongMuon: '', VaiTro: ATHLETE, CamKetDongPhi: false, DaChuyenKhoan: false, HoTro: '' };
type TextField = 'HoTen' | 'KhoaHoc' | 'LopChuyen' | 'SoDienThoai' | 'GioiTinh' | 'TrinhDo' | 'DongDoiMongMuon' | 'VaiTro' | 'HoTro';

export default function RegisterPage() {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const change = (key: TextField, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const isAthlete = form.VaiTro === ATHLETE;
  async function submit(e: FormEvent) {
    e.preventDefault(); setError('');
    if (form.HoTen.trim().length < 2) return setError('Vui lòng nhập họ tên hợp lệ.');
    if (!/^(0|\+84)[0-9]{9,10}$/.test(form.SoDienThoai.replace(/[ .-]/g, ''))) return setError('Số điện thoại chưa đúng định dạng Việt Nam.');
    if (!form.KhoaHoc.trim()) return setError('Vui lòng nhập khóa (niên khóa).');
    if (isAthlete && !form.TrinhDo) return setError('Vui lòng tự đánh giá trình độ.');
    if (isAthlete && !form.CamKetDongPhi) return setError(`Vận động viên cần xác nhận đóng ${FEE} trước ngày ${FEE_DEADLINE}.`);
    const player = isAthlete ? form : { ...form, TrinhDo: '', DongDoiMongMuon: '', CamKetDongPhi: false, DaChuyenKhoan: false };
    setLoading(true);
    try { const result = await callApi<{ MaNguoiChoi: string }>('dangKyNguoiChoi', { player }); setCode(result.MaNguoiChoi); setForm(initial); }
    catch (e) { setError(e instanceof Error ? e.message : 'Đăng ký không thành công.'); }
    finally { setLoading(false); }
  }
  return <PublicShell><main className="register-bg"><div className="container-page register-wrap">
    <Link href="/" className="back"><ArrowLeft size={16} /> Về trang chủ</Link>
    <div className="register-grid">
      <section><span className="kicker">LỆ PHÍ VẬN ĐỘNG VIÊN</span><h1>{FEE} / người, đóng trước ngày {FEE_DEADLINE}</h1><p className="intro">Vận động viên quét mã QR bên dưới để chuyển khoản, nội dung ghi <b>{TRANSFER_NOTE}</b>. Thầy cô, khách mời và cổ động viên không thu phí.</p>
        <div className="qr-card card"><div className="qr-title"><QrCode size={18} /><span><b>QUÉT MÃ ĐỂ THANH TOÁN</b><small>Chủ tài khoản: ĐỖ ĐĂNG VŨ · MB 0382018862</small></span></div><Image src={qrPayment} alt="Mã QR chuyển khoản lệ phí giải cầu lông" priority sizes="(max-width: 850px) 90vw, 390px" /><p>Có thể đăng ký trước và chuyển khoản sau, chậm nhất ngày {FEE_DEADLINE}.</p></div>
        <div className="notice"><Info size={20} /><div><b>Đánh đôi, không phân biệt nam nữ</b><p>Mỗi người đăng ký cá nhân. Nếu đã có đồng đội, hãy ghi tên ở ô &quot;Đồng đội mong muốn&quot;. Ban tổ chức sẽ xếp cặp, chia bảng và công bố lịch thi đấu sau khi đóng đăng ký.</p></div></div>
      </section>
      <section className="card form-card">
        {code ? <div className="success"><span><CheckCircle2 size={42} /></span><h2>Đăng ký thành công!</h2><p>Thông tin của bạn đã được gửi đến ban tổ chức. Hãy lưu mã đăng ký:</p><strong>{code}</strong><p className="small">Đăng ký đang ở trạng thái chờ xác nhận.</p><div><Link href="/nguoi-choi" className="btn btn-primary">Xem danh sách</Link><button className="btn btn-secondary" onClick={() => setCode('')}>Đăng ký người khác</button></div></div> : <>
          <div className="form-title"><span>PHIẾU ĐĂNG KÝ ONLINE</span><h2>Thông tin người chơi</h2><p>Giao lưu cầu lông cựu học sinh Trần Phú, chào mừng 40 năm thành lập trường.</p></div>
          <form onSubmit={submit}><div className="form-grid">
            <label className="full"><span className="label">Tham gia với tư cách *</span><select className="select" value={form.VaiTro} onChange={e => change('VaiTro', e.target.value)} required><option>Vận động viên</option><option>Cổ động viên</option></select></label>
            <label className="full"><span className="label">Họ và tên *</span><input className="input" value={form.HoTen} onChange={e => change('HoTen', e.target.value)} placeholder="Nguyễn Văn An" maxLength={80} required /></label>
            <label><span className="label">Khóa (niên khóa) *</span><input className="input" value={form.KhoaHoc} onChange={e => change('KhoaHoc', e.target.value)} placeholder="2005-2008" maxLength={30} required /></label>
            <label><span className="label">Lớp chuyên</span><input className="input" value={form.LopChuyen} onChange={e => change('LopChuyen', e.target.value)} placeholder="Toán, Lý, Anh..." maxLength={60} /></label>
            <label><span className="label">Số điện thoại (Zalo) *</span><input className="input" value={form.SoDienThoai} onChange={e => change('SoDienThoai', e.target.value)} placeholder="09xxxxxxxx" inputMode="tel" maxLength={15} required /></label>
            <label><span className="label">Giới tính *</span><select className="select" value={form.GioiTinh} onChange={e => change('GioiTinh', e.target.value)} required><option value="">Chọn giới tính</option><option>Nam</option><option>Nữ</option><option>Khác</option></select></label>
            {isAthlete && <><label><span className="label">Tự đánh giá trình độ *</span><select className="select" value={form.TrinhDo} onChange={e => change('TrinhDo', e.target.value)} required><option value="">Chọn trình độ</option><option>Mới chơi</option><option>Phong trào</option><option>Khá</option></select></label>
            <label><span className="label">Đồng đội mong muốn</span><input className="input" value={form.DongDoiMongMuon} onChange={e => change('DongDoiMongMuon', e.target.value)} placeholder="Họ tên, khóa (nếu có)" maxLength={120} /></label></>}
            <label className="full"><span className="label">Có thể hỗ trợ, tài trợ</span><input className="input" value={form.HoTro} onChange={e => change('HoTro', e.target.value)} placeholder="Cầu, nước, giải thưởng, chụp ảnh..." maxLength={300} /></label>
            {isAthlete && <><label className="payment-check full"><input type="checkbox" checked={form.CamKetDongPhi} onChange={e => setForm(prev => ({ ...prev, CamKetDongPhi: e.target.checked }))} /><span><b>Tôi xác nhận đóng {FEE} trước ngày {FEE_DEADLINE} *</b><small>Ban tổ chức đối soát giao dịch trước khi xác nhận suất thi đấu.</small></span></label>
            <label className="payment-check full"><input type="checkbox" checked={form.DaChuyenKhoan} onChange={e => setForm(prev => ({ ...prev, DaChuyenKhoan: e.target.checked }))} /><span><b>Tôi đã chuyển khoản</b><small>Bỏ trống nếu bạn sẽ chuyển sau.</small></span></label></>}
          </div>{error && <div className="form-error">{error}</div>}<button className="btn btn-primary submit" disabled={loading || (isAthlete && !form.CamKetDongPhi)}>{loading ? <><span className="spinner mini" /> Đang gửi...</> : <><Send size={17} /> Xác nhận và gửi đăng ký</>}</button><p className="privacy">Số điện thoại chỉ dùng để liên hệ qua Zalo và đối soát chuyển khoản, không xuất hiện công khai.</p></form>
        </>}
      </section>
    </div>
  </div></main><style>{`
    .register-bg{min-height:calc(100vh - 76px);padding:34px 0 70px;background:radial-gradient(circle at 10% 10%,#e8effc 0,transparent 30%),var(--bg)}.back{display:inline-flex;gap:7px;align-items:center;color:var(--muted);font-size:13px;font-weight:700;margin-bottom:30px}.register-grid{display:grid;grid-template-columns:.9fr 1.1fr;gap:54px;align-items:start}.kicker{font-size:10px;letter-spacing:.18em;font-weight:900;color:var(--orange)}.register-grid h1{font-size:40px;line-height:1.13;letter-spacing:-.035em;margin:13px 0 18px}.intro{font-size:14px;line-height:1.75;color:var(--muted)}.intro b{color:var(--ink)}.qr-card{margin-top:23px;padding:15px;text-align:center;overflow:hidden}.qr-title{display:flex;align-items:center;gap:9px;text-align:left;padding:2px 3px 12px;color:var(--blue)}.qr-title span b,.qr-title span small{display:block}.qr-title span b{font-size:11px}.qr-title span small{font-size:9px;color:var(--muted);margin-top:3px}.qr-card img{display:block;width:100%;height:auto;max-height:510px;object-fit:contain;border-radius:10px;background:#e8ecf4}.qr-card>p{font-size:10px;color:var(--muted);margin:11px 0 0}.notice{display:flex;gap:12px;background:var(--amber-soft);border:1px solid #f5df9d;border-radius:13px;padding:16px;margin-top:18px;color:#9c6a0d}.notice svg{flex:none}.notice b{font-size:13px}.notice p{margin:5px 0 0;font-size:12px;line-height:1.55}.form-card{padding:30px;position:sticky;top:100px}.form-title{border-bottom:1px solid var(--line);padding-bottom:20px;margin-bottom:23px}.form-title>span{font-size:9px;font-weight:900;letter-spacing:.13em;color:var(--orange)}.form-title h2{margin:7px 0 6px;font-size:21px}.form-title p,.privacy{margin:0;color:var(--muted);font-size:12px}.full{grid-column:1/-1}.payment-check{display:flex;align-items:flex-start;gap:10px;padding:14px;border:1px solid #f1d394;background:var(--amber-soft);border-radius:10px;cursor:pointer}.payment-check input{width:18px;height:18px;accent-color:var(--orange);margin-top:1px}.payment-check span b,.payment-check span small{display:block}.payment-check span b{font-size:12px}.payment-check span small{font-size:10px;color:#99701e;margin-top:5px;line-height:1.5}.form-error{padding:11px 13px;margin-top:16px;border-radius:9px;background:var(--red-soft);color:var(--red);font-size:13px;font-weight:700}.submit{width:100%;margin-top:20px;min-height:48px}.privacy{text-align:center;margin-top:12px}.spinner.mini{width:16px;height:16px;border-width:2px;border-top-color:#fff}.success{text-align:center;padding:35px 10px}.success>span{width:72px;height:72px;border-radius:50%;display:grid;place-items:center;margin:0 auto 17px;color:var(--green);background:var(--green-soft)}.success h2{margin:0 0 8px}.success p{color:var(--muted);font-size:14px;line-height:1.6}.success>strong{display:inline-block;background:#f5f7fb;border:1px dashed #bfc7d5;padding:12px 22px;border-radius:9px;font-size:20px;letter-spacing:.08em;margin:10px}.success .small{font-size:12px}.success>div{display:flex;justify-content:center;gap:10px;margin-top:20px}
    @media(max-width:850px){.register-grid{grid-template-columns:1fr;gap:30px}.register-grid h1{font-size:35px}.form-card{position:static}.qr-card{max-width:500px}}@media(max-width:550px){.form-card{padding:20px}.register-bg{padding-top:24px}.success>div{flex-direction:column}}
  `}</style></PublicShell>;
}
