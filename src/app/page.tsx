import { Suspense } from "react";
import Link from "next/link";
import { Flame, MessagesSquare, TrendingUp } from "lucide-react";

import { CoinCard } from "@/components/coin-card";
import { ChangeBadge } from "@/components/change-badge";
import { Button } from "@/components/ui/button";
import { getMarkets } from "@/lib/coingecko";
import { getCommentCounts } from "@/lib/comments";
import { TRACKED_COINS } from "@/lib/coins";
import { formatCompact } from "@/lib/format";

// Los precios se refrescan como mucho una vez por minuto (límite del tier público).
export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      <Hero />
      <section className="shell pb-4 pt-12 md:pt-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow mb-1">El parqué</p>
            <h2 className="font-display text-display-md">Las cuatro grandes</h2>
          </div>
          <p className="text-sm text-dust">Precios vía CoinGecko · se actualizan cada minuto</p>
        </div>

        <Suspense fallback={<CoinGridSkeleton />}>
          <CoinGrid />
        </Suspense>
      </section>
      <ValueProps />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.06]">
      {/* Manchas de color de las cuatro monedas, muy difusas: dan la identidad
          cromática del producto sin competir con el texto. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-24 top-0 size-72 rounded-full bg-shiba/25 blur-[100px]" />
        <div className="absolute left-1/3 -top-16 size-72 rounded-full bg-doge/20 blur-[100px]" />
        <div className="absolute right-1/4 top-10 size-64 rounded-full bg-pepe/20 blur-[100px]" />
        <div className="absolute -right-16 -top-8 size-72 rounded-full bg-bonk/20 blur-[100px]" />
      </div>

      <div className="shell relative py-16 md:py-24">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-ink-800/70 px-3 py-1 text-xs text-sand backdrop-blur">
          <Flame className="size-3.5 text-brand-500" aria-hidden />
          Precios en vivo + foro de la comunidad
        </span>

        {/* `text-balance` + el nowrap del gradiente evitan que "meme coins" se
            parta en dos líneas al crecer el titular. */}
        <h1 className="mt-5 max-w-4xl text-balance font-display text-[2.5rem] font-extrabold leading-[1.02] tracking-tight md:text-display-xl">
          Los precios de las <span className="whitespace-nowrap text-hype">meme coins</span>
          <br className="hidden sm:block" /> y la gente que las defiende.
        </h1>

        <p className="mt-5 max-w-xl text-lg text-sand">
          Dogecoin, Shiba Inu, Pepe y Bonk en una sola pantalla. Mira el gráfico, lee lo que dice
          la comunidad y suelta tu tesis.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="#contenido">
            <Button size="lg">Ver el mercado</Button>
          </Link>
          <Link href="/signup">
            <Button size="lg" variant="secondary">
              Únete al debate
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

async function CoinGrid() {
  // Precios y contadores de comentarios en paralelo: son fuentes independientes.
  const [markets, commentCounts] = await Promise.all([getMarkets(), getCommentCounts()]);

  const marketById = new Map((markets ?? []).map((m) => [m.id, m]));

  const totalCap = (markets ?? []).reduce((sum, m) => sum + (m.market_cap ?? 0), 0);

  let best: { id: string; change: number } | null = null;
  for (const market of markets ?? []) {
    const change = market.price_change_percentage_24h;
    if (change === null || change === undefined) continue;
    if (!best || change > best.change) best = { id: market.id, change };
  }
  const bestCoin = best ? TRACKED_COINS.find((c) => c.id === best.id) : null;

  return (
    <div className="space-y-6">
      {!markets && (
        <p
          role="status"
          className="rounded-input border border-doge/30 bg-doge-soft px-4 py-3 text-sm text-doge"
        >
          No hemos podido cargar los precios de CoinGecko (probablemente un límite de peticiones).
          El resto de la web funciona con normalidad; vuelve a intentarlo en un minuto.
        </p>
      )}

      {markets && markets.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-dust">
          <span>
            Capitalización combinada{" "}
            <span className="tabular text-cream">{formatCompact(totalCap)}</span>
          </span>
          {bestCoin && best && (
            <span className="inline-flex items-center gap-2">
              Mejor 24 h
              <span className="text-cream">{bestCoin.name}</span>
              <ChangeBadge value={best.change} size="sm" />
            </span>
          )}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {TRACKED_COINS.map((coin) => (
          <CoinCard
            key={coin.id}
            coin={coin}
            market={marketById.get(coin.id) ?? null}
            commentCount={commentCounts[coin.id]}
          />
        ))}
      </div>
    </div>
  );
}

function CoinGridSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {TRACKED_COINS.map((coin) => (
        <div key={coin.id} className="surface space-y-4 p-5 md:p-6">
          <div className="flex items-center gap-3">
            <div className="skeleton size-11 rounded-full" />
            <div className="space-y-2">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-3 w-12" />
            </div>
          </div>
          <div className="skeleton h-8 w-32" />
          <div className="skeleton h-14 w-full" />
          <div className="skeleton h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

function ValueProps() {
  const items = [
    {
      icon: TrendingUp,
      title: "Datos, no humo",
      body: "Precio, capitalización, volumen y gráfico de cada moneda, directos de la API de CoinGecko.",
    },
    {
      icon: MessagesSquare,
      title: "Un hilo por moneda",
      body: "Comenta, responde y da like. Sin algoritmo raro: lo más nuevo arriba y punto.",
    },
    {
      icon: Flame,
      title: "Comunidad, no gurús",
      body: "Aquí nadie te vende una señal. Es un foro de gente discutiendo sobre perros y ranas.",
    },
  ];

  return (
    <section className="shell pt-16">
      <div className="grid gap-5 md:grid-cols-3">
        {items.map(({ icon: Icon, title, body }) => (
          <div key={title} className="surface p-6">
            <span className="mb-4 grid size-10 place-items-center rounded-full bg-hype-soft text-brand-500">
              <Icon className="size-5" aria-hidden />
            </span>
            <h3 className="font-display text-lg font-bold">{title}</h3>
            <p className="mt-1.5 text-sm text-sand">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
