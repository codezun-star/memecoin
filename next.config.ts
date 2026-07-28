import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sin la cabecera X-Powered-By: anuncia el framework en cada respuesta y no
  // aporta nada al visitante.
  poweredByHeader: false,
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
