import type { Metadata } from "next";

import { Reveal } from "@/components/reveal";
import { TradeTape } from "@/components/trade-tape";
import { TRADABLE_COINS } from "@/lib/coins";
import { getMarkets } from "@/lib/coingecko";
import { SITE_URL } from "@/lib/site-config";

/**
 * Se regenera cada minuto. Lo único que se pide al servidor son los logos de las
 * monedas —las operaciones las trae el navegador—, así que no hace falta más.
 */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Operaciones en vivo: compras y ventas de meme coins en tiempo real",
  description:
    "Cinta de operaciones en tiempo real de las principales meme coins: cada compra y cada venta según van cruzándose en el mercado, con presión compradora y vendedora.",
  alternates: { canonical: "/operaciones" },
  openGraph: {
    title: "Operaciones en vivo · Memecoin Plaza",
    description: "Compras y ventas de meme coins en tiempo real.",
    url: `${SITE_URL}/operaciones`,
    type: "website",
  },
};

export default async function OperacionesPage() {
  const markets = await getMarkets();

  // Si el proveedor no responde, el logo cae solo al monograma de color: la
  // cinta funciona igual, que es lo que importa aquí.
  const logos: Record<string, string> = {};
  for (const market of markets ?? []) {
    if (market.image) logos[market.id] = market.image;
  }

  return (
    <div className="shell py-10 md:py-14">
      <header className="mb-8 max-w-2xl">
        <p className="eyebrow mb-2">En directo</p>
        <h1 className="font-display text-display-lg">Operaciones en vivo</h1>
        <p className="mt-3 text-lg text-ink-soft">
          Cada compra y cada venta según se cruzan en el mercado, sin recargar nada. Elige las
          monedas que quieras seguir.
        </p>
      </header>

      <TradeTape logos={logos} />

      <Reveal as="section" className="surface-sunken mt-12 max-w-3xl p-6">
        <h2 className="font-display text-lg font-bold">Cómo leer esta pantalla</h2>
        <div className="mt-3 space-y-3 text-sm text-ink-soft">
          <p>
            Cada línea es una operación real que acaba de ejecutarse. La etiqueta indica{" "}
            <strong className="text-ink">quién cruzó el mercado</strong>: en una compra, alguien
            aceptó las ventas que había disponibles; en una venta, al revés. No significa que haya
            más gente comprando que vendiendo, porque en toda operación hay exactamente una de cada.
          </p>
          <p>
            La barra de arriba reparte el importe de las últimas operaciones entre las dos
            direcciones. Es una medida de <strong className="text-ink">presión</strong>, no de
            volumen total.
          </p>
          <p>
            El flujo viene de <strong className="text-ink">un solo mercado</strong>, así que no
            recoge lo que se opera en el resto de plataformas ni en los intercambios
            descentralizados. Sirve para ver el pulso, no para medir el volumen del sector.
          </p>
          <p>
            La conexión la abre tu propio navegador. Si tu red la bloquea —pasa en oficinas y en
            algunas conexiones móviles—, la cinta pasa a traer las operaciones a través de nuestro
            servidor: siguen siendo reales, llegan con unos segundos de retraso y la etiqueta de
            arriba lo indica como <strong className="text-ink">En diferido</strong>.
          </p>
        </div>
      </Reveal>

      <Reveal as="section" className="mt-6">
        <p className="text-xs text-ink-faint">
          Monedas disponibles en la cinta: {TRADABLE_COINS.map((c) => c.symbol).join(", ")}.
        </p>
      </Reveal>
    </div>
  );
}
