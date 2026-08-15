import type { Metadata } from "next";
import { Chakra_Petch, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Chakra_Petch({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-display"
});

const body = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-body"
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "RADAR // CS2 Player Lookup",
  description:
    "Найдите статистику любого игрока CS2 по ссылке Steam, SteamID64/32 или нику: профиль, FACEIT ELO, банвары, наигранное время."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-void text-ink font-body antialiased">{children}</body>
    </html>
  );
}
