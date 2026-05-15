import type {Metadata} from 'next';
import { Anuphan, Pattaya, Pridi, Playfair_Display } from 'next/font/google';
import './globals.css'; // Global styles

const anuphan = Anuphan({ subsets: ['thai', 'latin'], variable: '--font-anuphan' });
const pattaya = Pattaya({ weight: '400', subsets: ['thai', 'latin'], variable: '--font-pattaya' });
const pridi = Pridi({ weight: ['300', '400', '500'], subsets: ['thai', 'latin'], variable: '--font-pridi' });
const playfair = Playfair_Display({ subsets: ['latin'], style: ['italic', 'normal'], weight: ['600', '700'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: 'RoyAksorn | รอยอักษร',
  description: 'รอยอักษร - เมื่อตัวอักษร... เริ่มเล่าเรื่อง',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="th" className={`${anuphan.variable} ${pattaya.variable} ${pridi.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
