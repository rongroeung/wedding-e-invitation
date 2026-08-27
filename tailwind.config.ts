import type { Config } from "tailwindcss";

/**
 * Colours are wired to CSS custom properties so the admin “Theme” page can
 * re-skin the whole invitation at runtime without a rebuild.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        burgundy: "var(--c-primary)",
        gold: "var(--c-secondary)",
        champagne: "var(--c-accent)",
        ivory: "var(--c-bg)",
        ink: "var(--c-text)",
        cream: "#F7F1E6",
        beige: "#EFE3CE",
        brown: "#3E2A20",
        "gold-deep": "#A8842F",
        "gold-light": "#F0DFB4",
      },
      fontFamily: {
        khmer: ["var(--f-heading)", "Noto Serif Khmer", "serif"],
        sans: ["var(--f-body)", "Noto Sans Khmer", "system-ui", "sans-serif"],
        latin: ["Cormorant Garamond", "Noto Serif Khmer", "serif"],
      },
      
      boxShadow: {
        card: "0 18px 60px -25px rgba(62,42,32,0.45)",
        gold: "0 0 32px -8px rgba(200,162,74,0.55)",
        inset: "inset 0 0 0 1px rgba(200,162,74,0.35)",
      },
      backgroundImage: {
        "gold-sheen":
          "linear-gradient(100deg,#A8842F 0%,#E4CE9B 22%,#F6E7BE 38%,#C8A24A 55%,#8F6B22 78%,#E4CE9B 100%)",
      },
      keyframes: {
        fadeUp: { "0%": { opacity: "0", transform: "translateY(28px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        scaleIn: { "0%": { opacity: "0", transform: "scale(.92)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        shimmer: { "0%": { backgroundPosition: "0% 50%" }, "100%": { backgroundPosition: "200% 50%" } },
        petal: { "0%": { transform: "translateY(-8vh) rotate(0deg)", opacity: "0" }, "12%": { opacity: ".75" }, "100%": { transform: "translateY(108vh) rotate(320deg)", opacity: "0" } },
        pulseSoft: { "0%,100%": { opacity: ".55" }, "50%": { opacity: "1" } },
      },
      animation: {
        fadeUp: "fadeUp .9s cubic-bezier(.22,.9,.28,1) both",
        fadeIn: "fadeIn 1.1s ease both",
        scaleIn: "scaleIn .9s cubic-bezier(.22,.9,.28,1) both",
        floaty: "floaty 6s ease-in-out infinite",
        shimmer: "shimmer 6s linear infinite",
        pulseSoft: "pulseSoft 3.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
