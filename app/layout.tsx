import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Đấu Trường Cầu Lông', template: '%s | Đấu Trường Cầu Lông' },
  description: 'Nền tảng tổ chức giải cầu lông đôi loại trực tiếp, đăng ký cá nhân và bốc thăm ghép đội.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
