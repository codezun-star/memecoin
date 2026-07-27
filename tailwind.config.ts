import type { Config } from "tailwindcss";

/**
 * Tokens del sistema de diseño de Memecoin Plaza.
 * Las decisiones y el porqué de cada valor están documentados en DESIGN.md.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Fondos: carbón cálido, nunca gris neutro (ver DESIGN.md §2.1)
        ink: {
          950: "#0B0A09",
          900: "#12100E",
          800: "#1A1613",
          700: "#241E19",
          600: "#332A22",
          500: "#4A3D31",
        },
        // Acción principal: cruce Shiba x Doge
        brand: {
          400: "#FFA23D",
          500: "#FF8A1F",
          600: "#E56A00",
        },
        accent: {
          400: "#6EE7A0",
          500: "#4ADE80",
          600: "#22C55E",
        },
        // Una marca por moneda
        shiba: { DEFAULT: "#FF7A18", deep: "#B44A00", soft: "rgba(255,122,24,0.12)" },
        doge: { DEFAULT: "#F5C542", deep: "#A8830F", soft: "rgba(245,197,66,0.12)" },
        pepe: { DEFAULT: "#4ADE80", deep: "#1C8F4B", soft: "rgba(74,222,128,0.12)" },
        bonk: { DEFAULT: "#FFB627", deep: "#B87700", soft: "rgba(255,182,39,0.12)" },
        // Texto
        cream: "#FFF8EF",
        sand: "#C6B7A6",
        dust: "#8C7C6C",
        // Dirección de precio — reservados, no usar para otra cosa
        up: { 500: "#3DDC84", soft: "rgba(61,220,132,0.14)" },
        down: { 500: "#FF4D6A", soft: "rgba(255,77,106,0.14)" },
        flat: { 500: "#8C7C6C", soft: "rgba(140,124,108,0.14)" },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "display-xl": ["3.5rem", { lineHeight: "1", letterSpacing: "-0.03em", fontWeight: "800" }],
        "display-lg": ["2.5rem", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "800" }],
        "display-md": ["1.75rem", { lineHeight: "1.15", letterSpacing: "-0.01em", fontWeight: "700" }],
        eyebrow: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.08em", fontWeight: "600" }],
      },
      maxWidth: {
        shell: "1200px",
      },
      borderRadius: {
        card: "20px",
        input: "14px",
      },
      boxShadow: {
        soft: "0 12px 32px -12px rgba(0,0,0,0.7)",
        glow: "0 0 0 1px rgba(255,255,255,0.04), 0 10px 40px -12px var(--coin-accent, #FF8A1F)",
        "inset-top": "inset 0 1px 0 rgba(255,255,255,0.25)",
      },
      backgroundImage: {
        hype: "linear-gradient(96deg, #FF7A18 0%, #F5C542 100%)",
        "hype-soft": "linear-gradient(96deg, rgba(255,122,24,0.16) 0%, rgba(245,197,66,0.16) 100%)",
      },
      transitionDuration: {
        DEFAULT: "180ms",
      },
      keyframes: {
        "pop-like": {
          "0%": { transform: "scale(1)" },
          "45%": { transform: "scale(1.25)" },
          "100%": { transform: "scale(1)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "pop-like": "pop-like 320ms ease-out",
        "fade-up": "fade-up 220ms ease-out both",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
