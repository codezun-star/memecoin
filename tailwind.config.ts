import type { Config } from "tailwindcss";

/**
 * Tokens del sistema de diseño de Memecoin Plaza — tema claro.
 * Las decisiones y el porqué de cada valor están en DESIGN.md.
 *
 * Todos los colores de texto han sido verificados a WCAG AA (>= 4.5:1) sobre
 * `canvas` y sobre `surface`.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Superficies: crema cálida, nunca blanco puro de fondo (DESIGN.md §2.1)
        canvas: "#FFFBF3",
        surface: "#FFFFFF",
        sunken: "#FBF3E6",
        line: { DEFAULT: "#F0E3CE", strong: "#E0CDB0" },

        // Texto
        ink: {
          DEFAULT: "#1F1710",
          soft: "#6A5847",
          faint: "#7C6957",
        },

        // Acción principal. `strong` es la única variante válida para texto.
        brand: {
          DEFAULT: "#FF7A18",
          strong: "#B84E08",
          light: "#FFA23D",
          soft: "rgba(255,122,24,0.10)",
        },

        /**
         * Una marca por moneda, en dos variantes:
         *  - DEFAULT: viva, para logos, rellenos, glows y degradados.
         *  - ink: apagada y con contraste AA, para texto, trazos de gráfico
         *    y estados activos. Sobre fondo claro la variante viva no se lee.
         */
        shiba: { DEFAULT: "#FF7A18", ink: "#C4500A", soft: "rgba(255,122,24,0.10)" },
        doge: { DEFAULT: "#F5C542", ink: "#8A6B00", soft: "rgba(245,197,66,0.14)" },
        pepe: { DEFAULT: "#4ADE80", ink: "#14803F", soft: "rgba(74,222,128,0.14)" },
        bonk: { DEFAULT: "#FFB627", ink: "#9A6300", soft: "rgba(255,182,39,0.13)" },

        // Dirección de precio — reservados, no usar para otra cosa
        up: { DEFAULT: "#0B7F45", soft: "rgba(11,127,69,0.10)" },
        down: { DEFAULT: "#CE1F45", soft: "rgba(206,31,69,0.09)" },
        flat: { DEFAULT: "#7C6957", soft: "rgba(124,105,87,0.10)" },
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
      maxWidth: { shell: "1200px" },
      borderRadius: { card: "20px", input: "14px" },
      boxShadow: {
        // En claro la profundidad sí se hace con sombra real, tintada en cálido
        // para que no se vea gris sobre la crema.
        soft: "0 1px 2px rgba(31,23,16,0.04), 0 8px 24px -14px rgba(31,23,16,0.16)",
        lift: "0 2px 4px rgba(31,23,16,0.05), 0 18px 34px -18px rgba(31,23,16,0.26)",
        glow: "0 2px 4px rgba(31,23,16,0.05), 0 18px 34px -18px var(--coin-accent, #FF7A18)",
        "inset-top": "inset 0 1px 0 rgba(255,255,255,0.45)",
      },
      backgroundImage: {
        hype: "linear-gradient(96deg, #FF7A18 0%, #FFC42E 100%)",
        "hype-soft": "linear-gradient(96deg, rgba(255,122,24,0.14) 0%, rgba(245,197,66,0.18) 100%)",
      },
      transitionDuration: { DEFAULT: "180ms" },
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
        shimmer: { "100%": { transform: "translateX(100%)" } },
        // Destello al cambiar un precio en vivo
        "flash-up": {
          "0%": { backgroundColor: "rgba(11,127,69,0.18)" },
          "100%": { backgroundColor: "transparent" },
        },
        "flash-down": {
          "0%": { backgroundColor: "rgba(206,31,69,0.16)" },
          "100%": { backgroundColor: "transparent" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.35", transform: "scale(0.8)" },
        },
      },
      animation: {
        "pop-like": "pop-like 320ms ease-out",
        "fade-up": "fade-up 220ms ease-out both",
        shimmer: "shimmer 1.6s infinite",
        "flash-up": "flash-up 900ms ease-out",
        "flash-down": "flash-down 900ms ease-out",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
