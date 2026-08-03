'use client';

import { Maximize2 } from 'lucide-react';
import PublicShell from '@/components/PublicShell';
import PublicPageTitle from '@/components/PublicPageTitle';
import TournamentBracket from '@/components/TournamentBracket';
import { EmptyState, ErrorState, LoadingState } from '@/components/UiStates';
import type { BracketData } from '@/lib/types';
import { useApiData } from '@/hooks/useApiData';

export default function BracketPage() {
  const { data, loading, error, reload } = useApiData<BracketData>('layBangDauCongKhai');
  const hasBracket = !!data?.rounds?.length;
  return <PublicShell><PublicPageTitle eyebrow="KẾT QUẢ TRỰC TIẾP" title="Sơ đồ thi đấu" description="Cuộn ngang để xem toàn bộ các vòng. Đội thắng được tô xanh và tự động xuất hiện ở vòng tiếp theo." /><main className="container-page bracket-main"><div className="bracket-toolbar"><div><b>BRACKET {data?.bracketSize || '—'} ĐỘI</b><span>Cập nhật theo kết quả chính thức</span></div><button className="btn btn-secondary" onClick={() => document.documentElement.requestFullscreen?.()}><Maximize2 size={15} /> Toàn màn hình</button></div><section className="bracket-shell card">{loading ? <LoadingState label="Đang dựng sơ đồ..." /> : error ? <ErrorState message={error} onRetry={reload} /> : !hasBracket ? <EmptyState title="Chưa có sơ đồ thi đấu" message="Bracket sẽ xuất hiện ngay sau khi ban tổ chức bốc thăm." /> : <TournamentBracket bracket={data} />}</section><div className="legend"><span><i className="green" /> Đội thắng</span><span><i className="yellow" /> Suất miễn đấu (BYE)</span><span><i className="gray" /> Đang chờ</span></div></main><style>{`.bracket-main{padding:30px 0}.bracket-toolbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:15px}.bracket-toolbar b{font-size:13px}.bracket-toolbar span{display:block;font-size:11px;color:var(--muted);margin-top:4px}.bracket-shell{padding:20px 12px;min-height:360px;background:linear-gradient(#fff,#fbfcfe)}.legend{display:flex;gap:24px;justify-content:center;margin-top:17px;color:var(--muted);font-size:11px}.legend span{display:flex;align-items:center;gap:6px}.legend i{width:10px;height:10px;border-radius:3px}.legend .green{background:var(--green)}.legend .yellow{background:var(--amber)}.legend .gray{background:#c9d0db}@media(max-width:550px){.bracket-toolbar .btn{display:none}.legend{align-items:flex-start;flex-direction:column;gap:8px;padding-left:8px}}`}</style></PublicShell>;
}
