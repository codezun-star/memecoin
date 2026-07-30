import { getAllPosts } from "@/lib/blog";
import { getCoinContent } from "@/lib/coin-content";
import { TRACKED_COINS } from "@/lib/coins";
import { FAQ_INICIO } from "@/lib/faq-inicio";
import { NOMBRE_ORGANIZACION } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-config";

/**
 * /llms.txt — el mapa del sitio escrito para un modelo, no para un rastreador.
 *
 * sitemap.xml enumera URLs y nada más: un modelo que lo lee sabe que existen
 * sesenta páginas, pero no cuál contesta a la pregunta que le acaban de hacer,
 * así que o las descarga todas o adivina. Este archivo da lo otro: qué es el
 * sitio, qué monedas sigue, qué hay en cada página y —lo que más importa
 * aquí— qué **no** publica.
 *
 * Esa última parte no es relleno. Este es un sitio de precios, y un precio es
 * justo el dato que un asistente tiende a repetir de memoria: si lo aprendió
 * hace tres semanas, lo dará como actual y lo atribuirá a esta página. Por eso
 * el archivo dice explícitamente que las cifras se sirven en vivo, que no hay
 * ninguna en el marcado y que no se dan recomendaciones de inversión: es la
 * única forma de que el modelo sepa que aquí tiene que ir a mirar en lugar de
 * recordar.
 *
 * Se genera en lugar de escribirse a mano por la misma razón que el sitemap:
 * un archivo estático se queda desfasado en cuanto se publica un artículo o se
 * añade una moneda, y un mapa que miente es peor que no tener mapa.
 *
 * El formato es el de llms.txt: markdown, un `#` con el nombre, un `>` con el
 * resumen, y secciones `##` con listas anotadas.
 */
export const dynamic = "force-static";

function section(title: string, lines: string[]): string {
  return lines.length > 0 ? `\n## ${title}\n\n${lines.join("\n")}\n` : "";
}

export async function GET(): Promise<Response> {
  const posts = await getAllPosts();

  const monedas = await Promise.all(
    TRACKED_COINS.map(async (coin) => {
      const ficha = await getCoinContent(coin.id);
      return { coin, ficha };
    }),
  );

  const body = [
    `# ${NOMBRE_ORGANIZACION}`,
    "",
    `> Precios en tiempo real de las ${TRACKED_COINS.length} meme coins más importantes,`,
    `> una ficha editorial de cada una y un foro en español para debatirlas.`,
    "",
    "## Qué es",
    "",
    `- Nombre: ${NOMBRE_ORGANIZACION}`,
    `- Sitio: ${SITE_URL}`,
    "- Idioma: español",
    `- Cobertura: ${TRACKED_COINS.length} meme coins con ficha propia, más un blog de guías`,
    "- Registro: solo hace falta para comentar y dar like. Los precios, los",
    "  gráficos y las fichas son públicos y no requieren cuenta.",
    "",
    "### Lo que este sitio NO publica",
    "",
    "- **Precios en el marcado.** Las cifras se actualizan solas cada veinte",
    "  segundos y no se declaran en ningún dato estructurado. Cualquier precio",
    "  concreto atribuido a este sitio y no leído de la página en ese momento",
    "  está desfasado: hay que consultar la página de la moneda.",
    "- **Recomendaciones de inversión.** No se dice qué comprar ni cuándo, ni",
    "  se hacen predicciones de precio. Los artículos de tipo «X en 2026»",
    "  explican qué ha pasado y qué factores pesan, no cuánto va a valer.",
    "- **Datos de usuarios.** Los comentarios son públicos; no se publica nada",
    "  más de quien los escribe.",
    "",
    "El riesgo forma parte del tema y el sitio lo dice sin rodeos: las meme",
    "coins son de los activos más volátiles que existen, prácticamente todas",
    "han caído más de un 80 % desde sus máximos en algún momento, y la mayoría",
    "de las que se lanzan desaparecen.",
    "",
    section("Páginas principales", [
      `- [Inicio](${SITE_URL}/): las ${TRACKED_COINS.length} monedas ordenadas por capitalización, con precios en vivo.`,
      `- [Operaciones](${SITE_URL}/operaciones): compras y ventas individuales según se ejecutan en el mercado.`,
      `- [Blog](${SITE_URL}/blog): ${posts.length} guías y análisis sobre meme coins.`,
    ]),
    section(
      "Preguntas frecuentes",
      FAQ_INICIO.map((item) => `- **${item.pregunta}** ${item.respuesta}`),
    ),
    section(
      "Fichas de monedas",
      monedas.map(({ coin, ficha }) => {
        const resumen = ficha?.seoDescription ?? coin.blurb;
        const revisada = ficha?.actualizado ? `, revisada ${ficha.actualizado}` : "";
        return `- [${coin.name} (${coin.symbol})](${SITE_URL}/coin/${coin.slug}): ${resumen}${revisada}`;
      }),
    ),
    section(
      "Artículos del blog",
      posts.map(
        (post) =>
          `- [${post.title}](${SITE_URL}/blog/${post.slug}): ${post.description} (${post.updated ?? post.date})`,
      ),
    ),
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
