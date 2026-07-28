import { Suspense } from "react";
import Link from "next/link";
import { Flame, MessagesSquare, TrendingUp } from "lucide-react";

import { LiveCoinGrid } from "@/components/live-coin-grid";
import { Reveal } from "@/components/reveal";
import { LiveMarketsProvider } from "@/components/live-markets-provider";
import { Button } from "@/components/ui/button";
import { getMarkets } from "@/lib/coingecko";
import { getCommentCounts } from "@/lib/comments";
import { TRACKED_COINS } from "@/lib/coins";

// El primer pintado se sirve cacheado hasta un minuto; a partir de ahí el
// cliente mantiene los precios frescos por su cuenta.
export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      <Hero />
      <section id="mercado" className="shell pb-4 pt-12 md:pt-16">
        <Reveal className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow mb-1">El parqué</p>
            <h2 className="font-display text-display-md">
              Las {TRACKED_COINS.length} que importan
            </h2>
          </div>
          <p className="text-sm text-ink-faint">Los precios se actualizan solos cada 20 segundos</p>
        </Reveal>

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
    <section className="relative overflow-hidden border-b border-line">
      {/* Manchas de color de las cuatro monedas, muy difusas: dan la identidad
          cromática del producto sin competir con el texto. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-24 top-0 size-72 rounded-full bg-shiba/25 blur-[100px]" />
        <div className="absolute left-1/3 -top-16 size-72 rounded-full bg-doge/20 blur-[100px]" />
        <div className="absolute right-1/4 top-10 size-64 rounded-full bg-pepe/20 blur-[100px]" />
        <div className="absolute -right-16 -top-8 size-72 rounded-full bg-bonk/20 blur-[100px]" />
      </div>

      <div className="shell relative py-16 md:py-24">
        <span className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface/70 px-3 py-1 text-xs text-ink-soft backdrop-blur">
          <Flame className="size-3.5 text-brand-strong" aria-hidden />
          Precios en vivo + foro de la comunidad
        </span>

        {/* `text-balance` + el nowrap del gradiente evitan que "meme coins" se
            parta en dos líneas al crecer el titular. */}
        <h1 className="mt-5 max-w-4xl text-balance font-display text-[2.5rem] font-extrabold leading-[1.02] tracking-tight md:text-display-xl">
          Los precios de las <span className="whitespace-nowrap text-hype">meme coins</span>
          <br className="hidden sm:block" /> y la gente que las defiende.
        </h1>

        <p className="mt-5 max-w-xl text-lg text-ink-soft">
          Las {TRACKED_COINS.length} meme coins que mueven el mercado, en una sola pantalla. Mira el
          gráfico, lee lo que dice la comunidad y suelta tu tesis.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="#mercado">
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

  // A partir de aquí manda el cliente: sondea y mantiene los precios al día sin
  // recargar la página.
  return (
    <LiveMarketsProvider initialMarkets={markets}>
      <LiveCoinGrid commentCounts={commentCounts} />
    </LiveMarketsProvider>
  );
}

function CoinGridSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {TRACKED_COINS.map((coin) => (
        <div key={coin.id} className="surface-card space-y-4 p-5 md:p-6">
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
      body: "Precio, capitalización, volumen y gráfico de cada moneda, al día y sin recargar.",
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
        {items.map(({ icon: Icon, title, body }, i) => (
          <Reveal key={title} delay={i * 90} className="surface-card p-6">
            <span className="mb-4 grid size-10 place-items-center rounded-full bg-hype-soft text-brand-strong">
              <Icon className="size-5" aria-hidden />
            </span>
            <h3 className="font-display text-lg font-bold">{title}</h3>
            <p className="mt-1.5 text-sm text-ink-soft">{body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
