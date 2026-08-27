import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Topi Crochet Vector & Grid Pattern Vault',
  description: 'Design, scale, simulate, and export handcrafted Dawoodi Bohra Topi crochet patterns.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAF8F5] text-[#2C2824] antialiased">
        {children}
      </body>
    </html>
  );
}
