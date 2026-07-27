import Link from "next/link";

import { TRACKED_COINS } from "@/lib/coins";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-white/[0.06] bg-ink-950/60">
      <div className="shell flex flex-col gap-8 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-3">
          <p className="font-display text-lg font-extrabold">
            Memecoin<span className="text-hype"> Plaza</span>
          </p>
          <p className="text-sm text-dust">
            Precios vía la API pública de CoinGecko. Esto no es asesoramiento financiero: es un
            foro de internet sobre monedas de perros y ranas.
          </p>
        </div>

        <nav aria-label="Monedas" className="space-y-3">
          <p className="eyebrow">Monedas</p>
          <ul className="space-y-2 text-sm">
            {TRACKED_COINS.map((coin) => (
              <li key={coin.id}>
                <Link href={`/coin/${coin.slug}`} className="text-sand transition-colors hover:text-cream">
                  {coin.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="shell border-t border-white/[0.06] py-5 text-xs text-dust">
        © {new Date().getFullYear()} Memecoin Plaza · Hecho con Next.js y Supabase
      </div>
    </footer>
  );
}
