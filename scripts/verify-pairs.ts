/**
 * Comprueba contra Binance que los pares de `tradePair` existen y están activos.
 *
 * Por qué hace falta: un par equivocado no da error visible. El WebSocket
 * simplemente no manda nada para ese flujo y la moneda no aparece nunca en la
 * cinta, sin que nada lo indique.
 *
 *   npm run pairs:verify
 *
 * Sale con código 1 si algún par no existe, así que sirve tal cual en CI.
 */
import { TRACKED_COINS, TRADABLE_COINS } from "@/lib/coins";

const API = process.env.BINANCE_API ?? "https://api.binance.com";

type SymbolInfo = { symbol?: unknown; status?: unknown };

async function main() {
  console.log(`Comprobando ${TRADABLE_COINS.length} pares contra ${API}…\n`);

  const res = await fetch(`${API}/api/v3/exchangeInfo`);
  if (!res.ok) {
    console.error(`✗ Binance respondió ${res.status} ${res.statusText}.`);
    process.exit(1);
  }

  const data = (await res.json()) as { symbols?: SymbolInfo[] };
  const activos = new Map<string, string>();
  for (const s of data.symbols ?? []) {
    if (typeof s.symbol === "string") {
      activos.set(s.symbol.toUpperCase(), String(s.status ?? ""));
    }
  }

  const problemas: string[] = [];

  for (const coin of TRADABLE_COINS) {
    const par = coin.tradePair.toUpperCase();
    const estado = activos.get(par);

    if (!estado) {
      problemas.push(`${coin.id}: el par ${par} no existe`);
      console.log(`  ✗ ${coin.symbol.padEnd(10)} ${par.padEnd(14)} NO EXISTE`);
    } else if (estado !== "TRADING") {
      problemas.push(`${coin.id}: el par ${par} está en estado ${estado}`);
      console.log(`  ✗ ${coin.symbol.padEnd(10)} ${par.padEnd(14)} estado ${estado}`);
    } else {
      console.log(`  ✓ ${coin.symbol.padEnd(10)} ${par.padEnd(14)} operando`);
    }
  }

  // Monedas sin par: no es un error, pero conviene saber cuáles quedan fuera.
  const sinPar = TRACKED_COINS.filter((c) => !c.tradePair);
  if (sinPar.length > 0) {
    console.log(`\nSin par asignado (no aparecen en la cinta): ${sinPar.map((c) => c.symbol).join(", ")}`);
    console.log("Si alguna cotiza en Binance, añade su tradePair en src/lib/coins.ts.");
  }

  if (problemas.length > 0) {
    console.error(`\n${problemas.length} problema(s):`);
    for (const p of problemas) console.error(`  - ${p}`);
    console.error("\nCorrige o elimina el tradePair en src/lib/coins.ts.");
    process.exit(1);
  }

  console.log(`\n✓ Los ${TRADABLE_COINS.length} pares existen y están operando.`);
}

main().catch((error) => {
  console.error("✗ No se ha podido consultar Binance:", error);
  process.exit(1);
});
