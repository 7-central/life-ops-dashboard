import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Life Ops Dashboard',
  description: 'ADHD-optimized life management system',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
