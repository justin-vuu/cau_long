import { Clock3, Trophy } from 'lucide-react';
import type { BracketData, Match, Team } from '@/lib/types';

function TeamRow({ team, match, slot }: { team?: Team | null; match: Match; slot: 1 | 2 }) {
  const id = slot === 1 ? match.MaDoi1 : match.MaDoi2;
  const isWinner = !!id && id === match.MaDoiThang;
  const firstRoundBye = match.SoVong === 1 && !id;
  const scoreKey = slot === 1 ? 0 : 1;
  const scoreMatch = String(match.TySoHiep1 || '').match(/^(\d{1,2})[-–:](\d{1,2})$/);
  const scores = scoreMatch ? [scoreMatch[scoreKey + 1]] : match.TySoHiep1 && scoreKey === 0 ? ['Lỗi'] : [];
  return <div className={`bracket-team ${isWinner ? 'winner' : ''} ${firstRoundBye ? 'bye' : ''}`}><span className="team-name">{firstRoundBye ? 'BYE' : team?.TenHienThi || 'Đang chờ'}</span><span className="scores">{scores.map((score, i) => <b key={i}>{score}</b>)}{isWinner && <Trophy size={13} />}</span></div>;
}

function MatchCard({ match, connector = true }: { match: Match; connector?: boolean }) {
  return <div className={`bracket-match ${connector ? 'has-connector' : ''}`}><div className="match-label">TRẬN {match.ThuTuTran} {match.TrangThai === 'HOAN_THANH' || match.TrangThai === 'MIEN_DAU' ? <span className="done">HOÀN THÀNH</span> : <span><Clock3 size={10} /> CHỜ ĐẤU</span>}</div><TeamRow team={match.Doi1} match={match} slot={1} /><TeamRow team={match.Doi2} match={match} slot={2} /></div>;
}

export default function TournamentBracket({ bracket }: { bracket: BracketData }) {
  return <div className="bracket-scroll"><div className="bracket-board" style={{ ['--rounds' as string]: bracket.rounds.length }}>
    {bracket.rounds.map((round, roundIndex) => <section className="round-column" key={round.key}><h3>{round.name}<small>{round.matches.length} trận</small></h3><div className="round-matches">{round.matches.map(match => <div className="match-slot" style={{ ['--factor' as string]: Math.pow(2, roundIndex) }} key={match.MaTran}><MatchCard match={match} connector={roundIndex < bracket.rounds.length - 1} /></div>)}</div></section>)}
    {bracket.thirdPlaceMatch && <section className="round-column third-place"><h3>Tranh hạng ba<small>1 trận</small></h3><div className="round-matches"><div className="match-slot" style={{ ['--factor' as string]: Math.pow(2, Math.max(0, bracket.rounds.length - 2)) }}><MatchCard match={bracket.thirdPlaceMatch} connector={false} /></div></div></section>}
  </div><style>{`
    .bracket-scroll{overflow:auto;padding:4px 4px 28px}.bracket-board{display:flex;min-width:max-content;gap:62px;padding:5px 28px 15px 4px}.round-column{width:245px;flex:none}.round-column h3{font-size:13px;text-align:center;margin:0;height:56px;padding:9px;border-radius:10px;background:#fff;border:1px solid var(--line);box-shadow:var(--shadow)}.round-column h3 small{display:block;margin-top:4px;color:var(--muted);font-size:9px;font-weight:600}.round-matches{position:relative}.match-slot{height:calc(142px * var(--factor));display:flex;align-items:center;position:relative}.bracket-match{width:100%;background:#fff;border:1px solid #dfe4ed;border-radius:10px;box-shadow:0 7px 22px -17px #1e293b;position:relative;z-index:2}.match-label{height:27px;padding:7px 10px;border-bottom:1px solid var(--line);color:#929bad;font-size:8px;font-weight:900;letter-spacing:.08em;display:flex;justify-content:space-between}.match-label span{display:flex;align-items:center;gap:3px;color:#a26f0d}.match-label .done{color:var(--green)}.bracket-team{height:38px;padding:0 10px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);gap:8px}.bracket-team:last-child{border:0}.team-name{font-size:11px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bracket-team:not(.winner):not(.bye) .team-name:only-child{color:var(--muted)}.bracket-team.winner{background:var(--green-soft);color:#087b54;border-left:3px solid var(--green)}.bracket-team.bye{background:var(--amber-soft);color:#ad750a}.scores{display:flex;align-items:center;gap:5px}.scores b{font-size:10px;min-width:14px;text-align:center}.scores svg{color:var(--green)}.has-connector:after{content:'';position:absolute;left:100%;top:50%;width:63px;height:1px;background:#cdd4df}.has-connector:before{content:'';position:absolute;left:calc(100% + 62px);top:50%;width:1px;height:calc(142px * var(--factor) / 2);background:#cdd4df;transform:translateY(-50%)}.round-column:nth-last-child(1) .has-connector:after,.round-column:nth-last-child(1) .has-connector:before{display:none}.third-place{border-left:1px dashed #d8deE8;padding-left:20px;width:265px}.third-place h3{color:#a66e08;background:var(--amber-soft)}
    @media(max-width:700px){.bracket-board{gap:48px;padding-right:20px}.round-column{width:220px}.has-connector:after{width:49px}.has-connector:before{left:calc(100% + 48px)}}
  `}</style></div>;
}
