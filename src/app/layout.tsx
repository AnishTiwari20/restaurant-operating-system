import type { Metadata } from 'next';
import './globals.css';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'RestaurantOS - QR-Based Restaurant Ordering Platform',
  description: 'Modern, multi-tenant QR code menu browsing and live order tracking SaaS platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-zinc-950 text-white selection:bg-amber-500 selection:text-black">
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
