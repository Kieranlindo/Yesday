import type { Metadata, Viewport } from 'next';
import GetTheApp from '@/components/GetTheApp';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Yesday · Wedding venues with real prices and live dates', template: '%s · Yesday' },
  description: 'Find a wedding venue in London with real prices and live dates, book a custom tour, and secure your date online.',
};
export const viewport: Viewport = { themeColor: '#FBF8F1', viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Jost:wght@300;400;500&family=Pinyon+Script&display=swap" />
      </head>
      <body>
        <div className="site">{children}</div>
        <GetTheApp />
      </body>
    </html>
  );
}
