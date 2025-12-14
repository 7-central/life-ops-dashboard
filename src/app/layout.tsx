import type { Metadata } from 'next';
import './globals.css';
import { Nav } from '@/components/ui/nav';

export const metadata: Metadata = {
  title: 'Life Ops Dashboard',
  description: 'Operational life management system',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
