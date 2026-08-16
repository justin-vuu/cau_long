import { CheckCircle2, Clock3 } from 'lucide-react';
import type { TournamentGroup } from '@/lib/types';

export default function GroupStage({ groups }: { groups: TournamentGroup[] }) {
  return <div className="group-stage-grid">{groups.map(group => <section className="group-card card" key={group.MaBang}>
    <header><div><span>VÒNG TRÒN</span><h3>{group.TenBang}</h3></div><b>{group.standings.length} đội · {group.matches.length} trận</b></header>
    <div className="standing-wrap"><table><thead><tr><th>#</th><th>Đội</th><th>Tr</th><th>T</th><th>Điểm</th><th>HS điểm</th></tr></thead><tbody>{group.standings.map(row => <tr key={row.MaDoi} className={row.DaDuDieuKien ? 'qualified' : ''}><td><span>{row.ThuHang}</span></td><td><b>{row.Doi?.TenHienThi || row.MaDoi}</b></td><td>{row.SoTran}</td><td>{row.Thang}</td><td><strong>{row.DiemXepHang ?? row.Thang}</strong></td><td>{row.HieuSoDiem > 0 ? '+' : ''}{row.HieuSoDiem}</td></tr>)}</tbody></table></div>
    <div className="group-matches">{group.matches.map(match => <div key={match.MaTran}><span>Trận {match.ThuTuTran}</span><p className={match.MaDoiThang === match.MaDoi1 ? 'winner' : ''}><b>{match.Doi1?.TenHienThi || 'Đang chờ'}</b><em>{sideScore(match, 0)}</em></p><p className={match.MaDoiThang === match.MaDoi2 ? 'winner' : ''}><b>{match.Doi2?.TenHienThi || 'Đang chờ'}</b><em>{sideScore(match, 1)}</em></p>{match.TrangThai === 'HOAN_THANH' || match.TrangThai === 'BO_CUOC' ? <CheckCircle2 /> : <Clock3 />}</div>)}</div>
    <style>{`
      .group-stage-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.group-card{overflow:hidden}.group-card>header{padding:15px 18px;background:linear-gradient(110deg,var(--navy-2),#233e65);color:#fff;display:flex;align-items:center;justify-content:space-between}.group-card header span{font-size:7px;letter-spacing:.16em;color:#ffad74;font-weight:900}.group-card header h3{font-size:16px;margin:4px 0 0}.group-card header>b{font-size:9px;color:#9dacc2}.standing-wrap{overflow-x:auto}.group-card table{width:100%;border-collapse:collapse;min-width:440px}.group-card th{padding:9px 8px;text-align:center;background:#f7f9fc;color:var(--muted);font-size:8px;border-bottom:1px solid var(--line)}.group-card th:nth-child(2),.group-card td:nth-child(2){text-align:left}.group-card td{padding:10px 8px;text-align:center;font-size:9px;border-bottom:1px solid var(--line)}.group-card td:first-child span{width:22px;height:22px;border-radius:7px;background:#eef1f5;display:grid;place-items:center;margin:auto;font-weight:900}.group-card tr.qualified{background:var(--green-soft)}.group-card tr.qualified td:first-child span{background:var(--green);color:#fff}.group-card td:nth-child(2) b{display:block;max-width:230px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.group-matches{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:12px;background:#f8fafc}.group-matches>div{background:#fff;border:1px solid var(--line);border-radius:9px;padding:8px;position:relative}.group-matches>div>span{font-size:7px;color:var(--muted);font-weight:800}.group-matches p{display:flex;justify-content:space-between;gap:5px;margin:5px 0 0;font-size:8px}.group-matches p b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.group-matches p em{font-style:normal;font-weight:900;white-space:nowrap}.group-matches p.winner{color:var(--green)}.group-matches>div>svg{position:absolute;right:6px;top:6px;width:11px;color:var(--muted)}.group-matches>div>svg:first-of-type{color:var(--green)}
      @media(max-width:900px){.group-stage-grid{grid-template-columns:1fr}}@media(max-width:520px){.group-matches{grid-template-columns:1fr}}
    `}</style>
  </section>)}</div>;
}

function sideScore(match: TournamentGroup['matches'][number], side: number) {
  if (!match.TySoHiep1) return '';
  const parts = String(match.TySoHiep1).match(/^(\d{1,2})[-–:](\d{1,2})$/);
  return parts ? parts[side + 1] : side === 0 ? 'Lỗi tỷ số' : '';
}
