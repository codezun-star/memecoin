import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/json-ld";
import { Reveal } from "@/components/reveal";
import { TradeTape } from "@/components/trade-tape";
import { TRADABLE_COINS } from "@/lib/coins";
import { getMarkets } from "@/lib/coingecko";
import type { FaqItem } from "@/lib/markdown";
import { migas, preguntasFrecuentes } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-config";

/**
 * Se regenera cada minuto. Lo único que se pide al servidor son los logos de las
 * monedas —las operaciones las trae el navegador—, así que no hace falta más.
 */
export const revalidate = 60;

const DESCRIPCION =
  "Cada compra y cada venta de las principales meme coins según se cruzan en el mercado, con la presión compradora y vendedora del momento.";

export const metadata: Metadata = {
  title: "Compras y ventas de meme coins en tiempo real",
  description: DESCRIPCION,
  alternates: { canonical: "/operaciones" },
  keywords: [
    "compras y ventas de criptomonedas en tiempo real",
    "operaciones en vivo meme coins",
    "presión compradora y vendedora",
    "flujo de órdenes dogecoin",
    "volumen en tiempo real shiba inu",
  ],
  openGraph: {
    title: "Operaciones en vivo · Memecoin Plaza",
    description: DESCRIPCION,
    url: `${SITE_URL}/operaciones`,
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Operaciones en vivo", description: DESCRIPCION },
};

const FAQ: FaqItem[] = [
  {
    pregunta: "¿Qué significa que una operación sea de compra o de venta?",
    respuesta:
      "Indica quién cruzó el mercado. En una compra, alguien aceptó las ventas que ya estaban disponibles en el libro de órdenes; en una venta, alguien aceptó las compras. No significa que haya más gente comprando que vendiendo: en toda operación hay exactamente un comprador y un vendedor.",
  },
  {
    pregunta: "¿Qué mide la barra de presión compradora?",
    respuesta:
      "Reparte el importe de las últimas operaciones entre las dos direcciones. Si marca 70 %, quiere decir que el 70 % del dinero movido en esas operaciones vino de gente cruzando el mercado para comprar. Es una medida de presión y de agresividad, no de volumen total ni de saldo neto.",
  },
  {
    pregunta: "¿Estas operaciones son de todo el mercado?",
    respuesta:
      "No. Cada moneda trae el flujo de un único mercado, así que no recoge lo que se opera en el resto de plataformas ni en los intercambios descentralizados. Sirve para ver el pulso de la actividad, no para medir el volumen total del sector.",
  },
  {
    pregunta: "¿Por qué unas monedas van por un mercado y otras por otro?",
    respuesta:
      "Porque el mercado con más volumen solo lista las meme coins grandes. Siete de las veinte que seguimos no cotizan ahí en contado, así que su flujo viene de un segundo mercado que sí las lista. La cinta las mezcla sin distinguirlas: una operación es una operación venga de donde venga.",
  },
  {
    pregunta: "¿Por qué a veces pone «En diferido»?",
    respuesta:
      "Porque la conexión directa la abre tu propio navegador, y hay redes que la bloquean: es habitual en oficinas y en algunas conexiones móviles. Cuando eso pasa, la página pasa a traer las operaciones a través de nuestro servidor. Siguen siendo reales, pero llegan en tandas con unos segundos de retraso, y la etiqueta lo indica en lugar de fingir que es tiempo real.",
  },
  {
    pregunta: "¿Cuántas operaciones se muestran?",
    respuesta:
      "La tabla muestra las 25 más recientes para que la página no se alargue sin límite. La barra de presión, en cambio, trabaja con una ventana mayor de operaciones, porque con pocas muestras el porcentaje daría saltos constantes y no diría nada útil.",
  },
];

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
      <JsonLd
        esquemas={[
          migas([{ nombre: "Operaciones en vivo", ruta: "/operaciones" }]),
          preguntasFrecuentes(FAQ),
        ]}
      />

      <nav aria-label="Ruta" className="mb-6 flex items-center gap-2 text-sm text-ink-faint">
        <Link href="/" className="transition-colors hover:text-ink">
          Inicio
        </Link>
        <span aria-hidden>›</span>
        <span className="text-ink-soft">Operaciones en vivo</span>
      </nav>

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
            Cada moneda trae el flujo de <strong className="text-ink">un solo mercado</strong>, así
            que no recoge lo que se opera en el resto de plataformas ni en los intercambios
            descentralizados. Sirve para ver el pulso, no para medir el volumen del sector.
          </p>
          <p>
            No todas van por el mismo sitio: el mercado con más volumen solo lista las meme coins
            grandes, así que siete de las veinte vienen de un segundo mercado que sí las tiene. La
            cinta las mezcla sin distinguirlas.
          </p>
          <p>
            La conexión la abre tu propio navegador. Si tu red la bloquea —pasa en oficinas y en
            algunas conexiones móviles—, la cinta pasa a traer las operaciones a través de nuestro
            servidor: siguen siendo reales, llegan con unos segundos de retraso y la etiqueta de
            arriba lo indica como <strong className="text-ink">En diferido</strong>.
          </p>
        </div>
      </Reveal>

      <Reveal as="section" className="mt-12 max-w-3xl">
        <h2 className="font-display text-display-md">Preguntas frecuentes</h2>
        <div className="mt-6 space-y-3">
          {FAQ.map((item) => (
            <details key={item.pregunta} className="surface-card group p-5">
              <summary className="cursor-pointer list-none font-display font-bold text-ink marker:content-none">
                <span className="inline-flex w-full items-center justify-between gap-4">
                  {item.pregunta}
                  <span
                    aria-hidden
                    className="shrink-0 text-brand-strong transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 leading-relaxed text-ink-soft">{item.respuesta}</p>
            </details>
          ))}
        </div>
      </Reveal>

      {/* Enlaces a cada ficha: le da al rastreador un camino desde aquí hacia
          las veinte páginas de moneda, y al lector un sitio al que ir. */}
      <Reveal as="section" className="mt-12">
        <h2 className="font-display text-lg font-bold">Monedas disponibles en la cinta</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {TRADABLE_COINS.map((coin) => (
            <li key={coin.id}>
              <Link
                href={`/coin/${coin.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
              >
                <span className="font-mono font-medium uppercase">{coin.symbol}</span>
                <span className="text-ink-faint">{coin.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  );
}
