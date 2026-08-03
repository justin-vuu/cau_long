import { Trophy } from 'lucide-react';

export default function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-mark">
      <span className="brand-icon"><Trophy size={compact ? 17 : 21} strokeWidth={2.5} /></span>
      {!compact && <span><strong>Đấu Trường</strong><small>CẦU LÔNG</small></span>}
      <style>{`
        .brand-mark{display:flex;align-items:center;gap:11px;color:inherit}.brand-icon{width:${compact ? 34 : 42}px;height:${compact ? 34 : 42}px;border-radius:12px;background:linear-gradient(135deg,var(--orange),var(--orange-2));color:#fff;display:grid;place-items:center;box-shadow:0 8px 18px -10px #f97316}.brand-mark strong{display:block;font-size:16px;line-height:1.1}.brand-mark small{font-size:9px;font-weight:900;letter-spacing:.22em;color:var(--orange)}
      `}</style>
    </div>
  );
}
