'use client';

import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import BrandMark from '@/components/BrandMark';

const links = [
  { href: '/', label: 'Trang chủ' }, { href: '/nguoi-choi', label: 'Người chơi' },
  { href: '/doi-thi-dau', label: 'Đội thi đấu' }, { href: '/bang-dau', label: 'Sơ đồ thi đấu' },
];

export default function PublicHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="public-header">
      <div className="container-page header-inner">
        <Link href="/"><BrandMark /></Link>
        <nav className={open ? 'open' : ''}>
          {links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>)}
          <Link className="btn btn-primary join" href="/dang-ky">Đăng ký thi đấu</Link>
        </nav>
        <button className="menu" onClick={() => setOpen(!open)} aria-label="Mở menu">{open ? <X /> : <Menu />}</button>
      </div>
      <style>{`
        .public-header{height:76px;background:rgba(255,255,255,.96);border-bottom:1px solid var(--line);position:sticky;top:0;z-index:50;backdrop-filter:blur(12px)}.header-inner{height:100%;display:flex;align-items:center;justify-content:space-between}.public-header nav{display:flex;align-items:center;gap:27px}.public-header nav>a:not(.btn){font-size:14px;font-weight:700;color:#4e586c}.public-header nav>a:hover{color:var(--orange)}.join{margin-left:4px;color:#fff!important}.menu{display:none;background:none;border:0;color:var(--ink)}
        @media(max-width:800px){.menu{display:grid;place-items:center}.public-header nav{display:none;position:absolute;top:76px;left:0;right:0;background:#fff;padding:18px 20px 22px;border-bottom:1px solid var(--line);box-shadow:var(--shadow);align-items:stretch}.public-header nav.open{display:flex;flex-direction:column;gap:18px}.join{margin:0!important}}
      `}</style>
    </header>
  );
}
