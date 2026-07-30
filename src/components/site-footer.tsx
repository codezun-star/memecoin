import Image from "next/image";
import Link from "next/link";

import { FEATURED_COINS, TRACKED_COINS } from "@/lib/coins";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-sunken">
      <div className="shell flex flex-col gap-8 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-3">
          <p className="flex items-center gap-2 font-display text-lg font-extrabold">
            <Image src="/logo-mark.png" alt="" aria-hidden width={44} height={44} className="size-11" />
            Memecoin<span className="-ml-1 text-hype">Plaza</span>
          </p>
          <p className="text-sm text-ink-faint">
            Esto no es asesoramiento financiero: es un foro de internet sobre monedas de perros y
            ranas. Los precios pueden llevar unos segundos de retraso.
          </p>
        </div>

        <nav aria-label="Monedas" className="space-y-3">
          <p className="eyebrow">Monedas</p>
          <ul className="space-y-2 text-sm">
            {FEATURED_COINS.map((coin) => (
              <li key={coin.id}>
                <Link
                  href={`/coin/${coin.slug}`}
                  className="text-ink-soft transition-colors hover:text-ink"
                >
                  {coin.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/#mercado" className="text-brand-strong hover:underline">
                Ver las {TRACKED_COINS.length}
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Secciones" className="space-y-3">
          <p className="eyebrow">Sitio</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/operaciones" className="text-ink-soft transition-colors hover:text-ink">
                Operaciones en vivo
              </Link>
            </li>
            <li>
              <Link href="/blog" className="text-ink-soft transition-colors hover:text-ink">
                Blog
              </Link>
            </li>
            <li>
              <Link href="/signup" className="text-ink-soft transition-colors hover:text-ink">
                Crear cuenta
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="shell flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line py-5 text-xs text-ink-faint">
        <span>© {new Date().getFullYear()} Memecoin Plaza · Datos de mercado por CoinGecko</span>
        {/*
          El enlace a /llms.txt es lo que hace que ese archivo se descubra: su
          ruta está convenida, pero un rastreador solo la pide si sabe que
          existe, y robots.txt no tiene ningún campo donde anunciarla.
        */}
        <a
          href="/llms.txt"
          className="transition-colors hover:text-ink"
          title="Resumen del sitio en texto plano, para modelos de lenguaje"
        >
          llms.txt
        </a>
      </div>
    </footer>
  );
}
