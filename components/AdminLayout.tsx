'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, ChevronRight, Dices, LogOut, Menu, Settings, Swords, UserCheck, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import AdminGuard from '@/components/AdminGuard';
import BrandMark from '@/components/BrandMark';
import { callApi } from '@/lib/api';
import type { AdminUser } from '@/lib/types';
import { clearCachedAdminUser } from '@/lib/adminSession';

const nav = [
  { href: '/admin', label: 'Tổng quan', icon: BarChart3 },
  { href: '/admin/nguoi-choi', label: 'Người chơi', icon: UserCheck, group: 'QUẢN LÝ GIẢI' },
  { href: '/admin/boc-tham', label: 'Bốc thăm', icon: Dices },
  { href: '/admin/tran-dau', label: 'Trận đấu', icon: Swords },
  { href: '/admin/cai-dat', label: 'Cài đặt giải', icon: Settings, group: 'HỆ THỐNG' },
];

export default function AdminLayout({ children, title, description }: { children: React.ReactNode; title: string; description?: string }) {
  const pathname = usePathname(); const [user, setUser] = useState<AdminUser | null>(null); const [open, setOpen] = useState(false);
  const receiveUser = useCallback((next: AdminUser) => setUser(next), []);
  async function logout() { try { await callApi('dangXuat'); } finally { clearCachedAdminUser(); window.location.href = '/admin/login'; } }
  return <AdminGuard onUser={receiveUser}><div className="admin-shell">
    <aside className={open ? 'admin-sidebar open' : 'admin-sidebar'}><button className="side-close" onClick={() => setOpen(false)}><X /></button><Link href="/admin" className="admin-brand"><BrandMark /></Link><nav>{nav.map(item => <div key={item.href}>{item.group && <p>{item.group}</p>}<Link href={item.href} onClick={() => setOpen(false)} className={pathname === item.href ? 'active' : ''}><item.icon size={17} /><span>{item.label}</span>{pathname === item.href && <ChevronRight size={14} />}</Link></div>)}</nav><div className="side-foot"><small>ĐĂNG NHẬP VỚI</small><b>{user?.HoTen || 'Quản trị viên'}</b><span>{user?.VaiTro || 'ADMIN'}</span></div></aside>
    {open && <button className="backdrop" onClick={() => setOpen(false)} aria-label="Đóng menu" />}
    <div className="admin-main"><header><button className="side-open" onClick={() => setOpen(true)}><Menu /></button><div><h1>{title}</h1>{description && <p>{description}</p>}</div><div className="admin-user"><span>{user?.HoTen?.split(' ').slice(-2).map(x => x[0]).join('').toUpperCase() || 'QT'}</span><div><b>{user?.HoTen || 'Quản trị viên'}</b><small>Quản trị hệ thống</small></div><button onClick={logout} title="Đăng xuất"><LogOut size={17} /></button></div></header><main>{children}</main></div>
    <style>{`
      .admin-shell{display:flex;min-height:100vh}.admin-sidebar{width:258px;flex:none;background:linear-gradient(180deg,var(--navy-2),var(--navy-1));color:#a7b2c7;padding:22px 15px;display:flex;flex-direction:column;position:fixed;inset:0 auto 0 0;z-index:60}.admin-brand{color:#fff;padding:5px 8px 25px}.admin-sidebar nav p{font-size:9px;letter-spacing:.16em;font-weight:900;color:#53617a;margin:22px 12px 8px}.admin-sidebar nav a{display:flex;align-items:center;gap:11px;border-left:3px solid transparent;border-radius:9px;padding:11px 11px;margin:3px 0;color:#9ca8be;font-size:13px;font-weight:700}.admin-sidebar nav a svg:last-child{margin-left:auto}.admin-sidebar nav a:hover{background:rgba(255,255,255,.05);color:#fff}.admin-sidebar nav a.active{color:#ffad74;border-left-color:var(--orange);background:linear-gradient(90deg,rgba(249,115,22,.17),transparent)}.side-foot{margin-top:auto;padding:17px 10px 3px;border-top:1px solid rgba(255,255,255,.08)}.side-foot small{display:block;color:#526078;font-size:8px;letter-spacing:.13em}.side-foot b{display:block;color:#d8dfea;font-size:12px;margin:6px 0 3px}.side-foot span{font-size:9px;color:var(--orange)}.admin-main{margin-left:258px;min-width:0;flex:1}.admin-main>header{height:82px;padding:0 30px;background:#fff;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:40}.admin-main>header h1{font-size:21px;margin:0}.admin-main>header p{font-size:11px;color:var(--muted);margin:5px 0 0}.admin-user{display:flex;align-items:center;gap:10px}.admin-user>span{width:35px;height:35px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,var(--blue),#865ce8);color:#fff;font-size:11px;font-weight:900}.admin-user div b,.admin-user div small{display:block}.admin-user div b{font-size:12px}.admin-user div small{color:var(--muted);font-size:9px;margin-top:3px}.admin-user button,.side-open,.side-close{border:1px solid var(--line);background:#fff;border-radius:9px;width:36px;height:36px;display:grid;place-items:center;color:var(--muted);cursor:pointer}.admin-main>main{padding:25px 30px 45px;max-width:1500px}.side-open,.side-close,.backdrop{display:none}
      @media(max-width:950px){.admin-sidebar{transform:translateX(-100%);transition:.2s}.admin-sidebar.open{transform:translateX(0)}.side-close{display:grid;position:absolute;right:13px;top:13px;background:rgba(255,255,255,.08);border:0;color:#fff}.backdrop{display:block;position:fixed;inset:0;border:0;background:rgba(4,10,20,.5);z-index:55}.admin-main{margin-left:0}.side-open{display:grid;margin-right:12px}.admin-main>header{justify-content:flex-start;padding:0 16px}.admin-user{margin-left:auto}.admin-main>main{padding:18px 14px 35px}}@media(max-width:560px){.admin-user div{display:none}.admin-main>header p{display:none}.admin-main>header h1{font-size:18px}}
    `}</style>
  </div></AdminGuard>;
}
