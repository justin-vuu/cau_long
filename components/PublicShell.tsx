import PublicHeader from '@/components/PublicHeader';
import BrandMark from '@/components/BrandMark';

export default function PublicShell({ children }: { children: React.ReactNode }) {
  return <><PublicHeader />{children}<footer><div className="container-page footer-inner"><BrandMark /><p>Giải đăng ký cá nhân, bốc thăm ghép đôi công bằng.</p><span>© {new Date().getFullYear()} Đấu Trường Cầu Lông</span></div><style>{`footer{background:var(--navy-1);color:#fff;padding:34px 0;margin-top:64px}.footer-inner{display:flex;align-items:center;gap:30px}.footer-inner p{color:#8692a8;font-size:13px;flex:1}.footer-inner>span{color:#68758e;font-size:12px}@media(max-width:700px){.footer-inner{flex-direction:column;text-align:center;gap:15px}}`}</style></footer></>;
}
