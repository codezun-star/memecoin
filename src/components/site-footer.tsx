import Link from "next/link";

import { FEATURED_COINS, TRACKED_COINS } from "@/lib/coins";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-sunken">
      <div className="shell flex flex-col gap-8 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-3">
          <p className="font-display text-lg font-extrabold">
            Memecoin<span className="text-hype"> Plaza</span>
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
      </div>
      <div className="shell border-t border-line py-5 text-xs text-ink-faint">
        © {new Date().getFullYear()} Memecoin Plaza · Datos de mercado por CoinGecko
      </div>
    </footer>
  );
}
