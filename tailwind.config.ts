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
        // Written as rgb(<channels> / <alpha-value>) so utilities such as
        // `text-ink/70` and `border-gold/40` actually compile.
        heading: "rgb(var(--c-primary-rgb) / <alpha-value>)",
        stage: "rgb(var(--c-stage-rgb) / <alpha-value>)",
        "gold-frame": "rgb(var(--gold-frame-rgb) / <alpha-value>)",
        gold: "rgb(var(--c-secondary-rgb) / <alpha-value>)",
        champagne: "rgb(var(--c-accent-rgb) / <alpha-value>)",
        ivory: "rgb(var(--c-bg-rgb) / <alpha-value>)",
        ink: "rgb(var(--c-text-rgb) / <alpha-value>)",
        cream: "#FBF9F5",
        beige: "#EDE7DC",
        brown: "#3B2C21",
        "gold-deep": "rgb(var(--gold-deep-rgb) / <alpha-value>)",
        "gold-dark": "rgb(var(--gold-1-rgb) / <alpha-value>)",
        "gold-light": "rgb(var(--gold-3-rgb) / <alpha-value>)",
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
          "linear-gradient(100deg,var(--gold-deep) 0%,var(--gold-1) 22%,var(--gold-3) 40%,var(--gold-2) 56%,var(--gold-deep) 78%,var(--gold-1) 100%)",
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
