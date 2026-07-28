/**
 * Comprueba contra CoinGecko que todos los ids de src/lib/coins.ts existen.
 *
 * Por qué hace falta: un id equivocado no da error en ninguna parte. CoinGecko
 * simplemente no devuelve esa moneda, `normalizeMarket` la descarta y la tarjeta
 * se queda con guiones para siempre. Este script convierte ese fallo silencioso
 * en uno ruidoso.
 *
 *   npm run coins:verify
 *
 * Sale con código 1 si algún id no existe, así que sirve tal cual en CI.
 */
import { TRACKED_COINS } from "@/lib/coins";

const API_BASE = process.env.COINGECKO_API_BASE ?? "https://api.coingecko.com/api/v3";
const API_KEY = process.env.COINGECKO_API_KEY;

type MarketRow = { id?: unknown; name?: unknown; market_cap_rank?: unknown };

async function main() {
  const ids = TRACKED_COINS.map((c) => c.id);
  const params = new URLSearchParams({
    vs_currency: "usd",
    ids: ids.join(","),
    order: "market_cap_desc",
    per_page: "250",
  });

  const headers: Record<string, string> = { accept: "application/json" };
  if (API_KEY) headers["x-cg-demo-api-key"] = API_KEY;

  console.log(`Comprobando ${ids.length} monedas contra ${API_BASE}…\n`);

  const res = await fetch(`${API_BASE}/coins/markets?${params}`, { headers });

  if (!res.ok) {
    console.error(`✗ CoinGecko respondió ${res.status} ${res.statusText}.`);
    if (res.status === 429) {
      console.error("  Es un límite de peticiones: espera un minuto y reintenta.");
    }
    process.exit(1);
  }

  const rows = (await res.json()) as MarketRow[];
  const encontrados = new Map(
    rows.filter((r) => typeof r.id === "string").map((r) => [r.id as string, r]),
  );

  const faltan: string[] = [];

  for (const coin of TRACKED_COINS) {
    const row = encontrados.get(coin.id);
    if (row) {
      const rank = typeof row.market_cap_rank === "number" ? `#${row.market_cap_rank}` : "sin rank";
      console.log(`  ✓ ${coin.id.padEnd(24)} ${String(row.name).padEnd(22)} ${rank}`);
    } else {
      faltan.push(coin.id);
      console.log(`  ✗ ${coin.id.padEnd(24)} NO EXISTE en CoinGecko`);
    }
  }

  if (faltan.length > 0) {
    console.error(`\n${faltan.length} id(s) sin correspondencia: ${faltan.join(", ")}`);
    console.error(
      "Busca el id correcto en https://www.coingecko.com/ — está en la URL de la moneda,\n" +
        "por ejemplo coingecko.com/en/coins/dogwifcoin -> el id es 'dogwifcoin'.",
    );
    process.exit(1);
  }

  console.log(`\n✓ Las ${ids.length} monedas existen y devuelven datos.`);
}

main().catch((error) => {
  console.error("✗ No se ha podido consultar CoinGecko:", error);
  process.exit(1);
});
