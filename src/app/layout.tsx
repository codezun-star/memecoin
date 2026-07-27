import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

import "./globals.css";

// Tres familias, tres trabajos distintos. Ver DESIGN.md §3.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Memecoin Plaza — precios y debate de meme coins",
    template: "%s · Memecoin Plaza",
  },
  description:
    "Precios en tiempo real y foro de la comunidad para Dogecoin, Shiba Inu, Pepe y Bonk.",
  openGraph: {
    title: "Memecoin Plaza",
    description: "Precios y debate de meme coins: DOGE, SHIB, PEPE y BONK.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#12100E",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-ink-950"
        >
          Saltar al contenido
        </a>
        <div className="flex min-h-dvh flex-col">
          <SiteHeader />
          <main id="contenido" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
