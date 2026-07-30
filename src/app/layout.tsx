import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ServiceWorkerRegistration } from "@/components/service-worker";
import { SITE_URL } from "@/lib/site-config";

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
  // Base para que las URLs canónicas y las de Open Graph salgan absolutas.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Memecoin Plaza — precios y debate de meme coins",
    template: "%s · Memecoin Plaza",
  },
  description:
    "Precios en tiempo real y foro de la comunidad para Dogecoin, Shiba Inu, Pepe y Bonk.",
  applicationName: "Memecoin Plaza",
  // El sitio es su propia marca, no una sección de otra: la autoría apunta
  // aquí para que Search no lo agrupe bajo el dominio padre.
  authors: [{ name: "Memecoin Plaza", url: SITE_URL }],
  creator: "Memecoin Plaza",
  publisher: "Memecoin Plaza",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Memecoin Plaza",
    description: "Precios en tiempo real y debate de meme coins: DOGE, SHIB, PEPE y BONK.",
    url: SITE_URL,
    siteName: "Memecoin Plaza",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Memecoin Plaza",
    description: "Precios en tiempo real y debate de meme coins.",
  },
  // Instalada en iOS: sin barra del navegador y con el nombre corto.
  appleWebApp: {
    capable: true,
    title: "Memecoin Plaza",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFBF3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:text-ink"
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
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
