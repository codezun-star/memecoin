import type { Metadata } from "next";

import { TradeTape } from "@/components/trade-tape";
import { TRADABLE_COINS } from "@/lib/coins";
import { SITE_URL } from "@/lib/site-config";

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

export default function OperacionesPage() {
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

      <TradeTape />

      <section className="surface-sunken mt-12 max-w-3xl p-6">
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
            La conexión la abre tu propio navegador. Si tu red la bloquea, la página lo dirá en vez
            de quedarse en blanco, y el resto del sitio sigue funcionando igual.
          </p>
        </div>
      </section>

      <p className="mt-6 text-xs text-ink-faint">
        Monedas disponibles en la cinta: {TRADABLE_COINS.map((c) => c.symbol).join(", ")}.
      </p>
    </div>
  );
}
