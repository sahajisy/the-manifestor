import { Bebas_Neue, DM_Sans, DM_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { BottomNav } from '@/components/BottomNav';

const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas-neue' });
const dmSans = DM_Sans({ weight: ['400', '500', '600'], subsets: ['latin'], variable: '--font-dm-sans' });
const dmMono = DM_Mono({ weight: ['400', '500'], subsets: ['latin'], variable: '--font-dm-mono' });

export const metadata = {
  title: 'The Manifestor',
  description: 'Track your ultimate aim with brutal accountability.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${bebasNeue.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body suppressHydrationWarning>
        <AuthProvider>
          <div className="app-layout">
            {/* Aurora blobs */}
            <div className="blob blob-1" />
            <div className="blob blob-2" />
            <div className="blob blob-3" />
            
            {/* Screen content */}
            <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
              {children}
            </div>

            {/* Bottom nav */}
            <BottomNav />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
