/**
 * Comprueba contra los dos mercados que los pares configurados existen y están
 * operando.
 *
 * Por qué hace falta: un par equivocado **no da error visible**. El flujo
 * simplemente no manda nada para esa moneda y no aparece nunca en la cinta, sin
 * que nada lo indique. Este script convierte ese fallo silencioso en uno ruidoso.
 *
 *   npm run pairs:verify
 *
 * Sale con código 1 si algún par falla, así que sirve tal cual en CI.
 */
import { TRACKED_COINS, mercadoDe, type FuenteDeMercado } from "@/lib/coins";

const API_BINANCE = process.env.BINANCE_API ?? "https://api.binance.com";
const API_GATE = process.env.GATE_API ?? "https://api.gateio.ws";

/** Pares operando en cada mercado, en su forma canónica en mayúsculas. */
type Catalogo = Map<string, string>;

async function catalogoBinance(): Promise<Catalogo> {
  const res = await fetch(`${API_BINANCE}/api/v3/exchangeInfo`);
  if (!res.ok) throw new Error(`el mercado principal respondió ${res.status} ${res.statusText}`);

  const data = (await res.json()) as { symbols?: { symbol?: unknown; status?: unknown }[] };
  const salida: Catalogo = new Map();
  for (const s of data.symbols ?? []) {
    if (typeof s.symbol === "string") {
      salida.set(s.symbol.toUpperCase(), String(s.status ?? ""));
    }
  }
  return salida;
}

async function catalogoGate(): Promise<Catalogo> {
  const res = await fetch(`${API_GATE}/api/v4/spot/currency_pairs`);
  if (!res.ok) throw new Error(`el mercado secundario respondió ${res.status} ${res.statusText}`);

  const data = (await res.json()) as { id?: unknown; trade_status?: unknown }[];
  const salida: Catalogo = new Map();
  for (const p of Array.isArray(data) ? data : []) {
    if (typeof p.id === "string") {
      // Gate usa "tradable" donde Binance usa "TRADING"; se normaliza para que
      // el resto del script no tenga que saber de qué mercado viene.
      salida.set(p.id.toUpperCase(), p.trade_status === "tradable" ? "TRADING" : String(p.trade_status ?? ""));
    }
  }
  return salida;
}

const NOMBRE: Record<FuenteDeMercado, string> = {
  binance: "principal",
  gate: "secundario",
};

async function main() {
  const conMercado = TRACKED_COINS.map((c) => ({ coin: c, mercado: mercadoDe(c) })).filter(
    (x): x is { coin: (typeof TRACKED_COINS)[number]; mercado: NonNullable<ReturnType<typeof mercadoDe>> } =>
      x.mercado !== null,
  );

  console.log(`Comprobando ${conMercado.length} pares en dos mercados…\n`);

  const necesarios = new Set(conMercado.map((x) => x.mercado.fuente));
  const catalogos = new Map<FuenteDeMercado, Catalogo>();

  // Un mercado caído no debe impedir comprobar el otro.
  const fallosDeCatalogo: string[] = [];
  for (const fuente of necesarios) {
    try {
      catalogos.set(fuente, fuente === "binance" ? await catalogoBinance() : await catalogoGate());
    } catch (error) {
      fallosDeCatalogo.push(`mercado ${NOMBRE[fuente]}: ${(error as Error).message}`);
    }
  }

  const problemas: string[] = [];

  for (const { coin, mercado } of conMercado) {
    const catalogo = catalogos.get(mercado.fuente);
    const par = mercado.par.toUpperCase();
    const etiqueta = `${coin.symbol.padEnd(10)} ${par.padEnd(16)} [${NOMBRE[mercado.fuente]}]`;

    if (!catalogo) {
      console.log(`  ? ${etiqueta} sin comprobar`);
      continue;
    }

    const estado = catalogo.get(par);
    if (!estado) {
      problemas.push(`${coin.id}: el par ${par} no existe en el mercado ${NOMBRE[mercado.fuente]}`);
      console.log(`  ✗ ${etiqueta} NO EXISTE`);
    } else if (estado !== "TRADING") {
      problemas.push(`${coin.id}: el par ${par} está en estado ${estado}`);
      console.log(`  ✗ ${etiqueta} estado ${estado}`);
    } else {
      console.log(`  ✓ ${etiqueta} operando`);
    }
  }

  // Monedas sin ningún mercado: no es un error, pero conviene saber cuáles
  // quedan fuera de la cinta.
  const sinMercado = TRACKED_COINS.filter((c) => mercadoDe(c) === null);
  if (sinMercado.length > 0) {
    console.log(`\nSin mercado (no aparecen en la cinta): ${sinMercado.map((c) => c.symbol).join(", ")}`);
    console.log("Añade su tradePair o su gatePair en src/lib/coins.ts.");
  }

  if (fallosDeCatalogo.length > 0) {
    console.error(`\nNo se ha podido consultar algún mercado:`);
    for (const f of fallosDeCatalogo) console.error(`  - ${f}`);
  }

  if (problemas.length > 0 || fallosDeCatalogo.length > 0) {
    if (problemas.length > 0) {
      console.error(`\n${problemas.length} problema(s):`);
      for (const p of problemas) console.error(`  - ${p}`);
      console.error("\nCorrige o elimina el par en src/lib/coins.ts.");
    }
    process.exit(1);
  }

  console.log(`\n✓ Los ${conMercado.length} pares existen y están operando.`);
}

main().catch((error) => {
  console.error("✗ No se han podido consultar los mercados:", error);
  process.exit(1);
});
