import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sin la cabecera X-Powered-By: anuncia el framework en cada respuesta y no
  // aporta nada al visitante.
  poweredByHeader: false,
  // Los artículos se leen del disco. Las páginas del blog son estáticas y el
  // contenido queda incrustado en el build, pero se declara igualmente para que
  // el trazado de ficheros incluya content/ si alguna ruta pasa a dinámica.
  outputFileTracingIncludes: {
    "/blog": ["./content/blog/**/*"],
    "/blog/[slug]": ["./content/blog/**/*"],
    "/blog/categoria/[tag]": ["./content/blog/**/*"],
    "/sitemap.xml": ["./content/blog/**/*"],
  },
  images: {
    remotePatterns: [
      // Logos de las monedas servidos por CoinGecko
      { protocol: "https", hostname: "assets.coingecko.com" },
      { protocol: "https", hostname: "coin-images.coingecko.com" },
      // Avatares de Google OAuth y de Supabase Storage
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
