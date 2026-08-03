import { AlertCircle, Inbox } from 'lucide-react';

export function LoadingState({ label = 'Đang tải dữ liệu...' }: { label?: string }) {
  return <div className="empty-state"><div className="spinner" style={{ margin: '0 auto 12px' }} /><p>{label}</p></div>;
}
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="empty-state"><AlertCircle size={34} color="var(--red)" style={{ margin: '0 auto 10px' }} /><strong style={{ color: 'var(--ink)' }}>Không tải được dữ liệu</strong><p style={{ margin: '7px auto 15px', maxWidth: 520 }}>{message}</p>{onRetry && <button className="btn btn-secondary" onClick={onRetry}>Thử lại</button>}</div>;
}
export function EmptyState({ title, message }: { title: string; message: string }) {
  return <div className="empty-state"><Inbox size={36} style={{ margin: '0 auto 10px' }} /><strong style={{ color: 'var(--ink)' }}>{title}</strong><p style={{ marginTop: 7 }}>{message}</p></div>;
}
