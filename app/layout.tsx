import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RADAR // CS2 Player Lookup',
  description: 'CS2 player profiles with Premier, competitive ranks, FACEIT and match history.'
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="ru"><body>{children}</body></html>;
}
