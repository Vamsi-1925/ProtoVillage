/**
 * Tailwind config for ProtoVillage — tokens copied verbatim from
 * DESIGN_SYSTEM.md (Modern Humanist) and mirrored from the Stitch UI kit
 * reference `stitch_ui_kit/orders_light_theme/code.html`.
 *
 * NOTE: token keys are stable (kebab-case). Do NOT rename without updating
 * every component that consumes them.
 */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        // ----- Modern Humanist palette (from DESIGN_SYSTEM.md front-matter) -----
        "surface": "#fcf9f5",
        "surface-dim": "#dcdad6",
        "surface-bright": "#fcf9f5",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f6f3ef",
        "surface-container": "#f0edea",
        "surface-container-high": "#ebe8e4",
        "surface-container-highest": "#e5e2de",
        "on-surface": "#1c1c1a",
        "on-surface-variant": "#3f484a",
        "inverse-surface": "#31302e",
        "inverse-on-surface": "#f3f0ec",
        "outline": "#6f797a",
        "outline-variant": "#bec8ca",
        "surface-tint": "#1b6870",
        "primary": "#005158",
        "on-primary": "#ffffff",
        "primary-container": "#1e6a72",
        "on-primary-container": "#a2e7f0",
        "inverse-primary": "#8dd2da",
        "secondary": "#00696d",
        "on-secondary": "#ffffff",
        "secondary-container": "#91f2f7",
        "on-secondary-container": "#007074",
        "tertiary": "#634200",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#825800",
        "on-tertiary-container": "#ffd597",
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        "primary-fixed": "#a9eef7",
        "primary-fixed-dim": "#8dd2da",
        "on-primary-fixed": "#001f23",
        "on-primary-fixed-variant": "#004f56",
        "secondary-fixed": "#91f2f7",
        "secondary-fixed-dim": "#74d6db",
        "on-secondary-fixed": "#002021",
        "on-secondary-fixed-variant": "#004f52",
        "tertiary-fixed": "#ffddaf",
        "tertiary-fixed-dim": "#f8bc5a",
        "on-tertiary-fixed": "#281800",
        "on-tertiary-fixed-variant": "#614000",
        "background": "#fcf9f5",
        "on-background": "#1c1c1a",
        "surface-variant": "#e5e2de",
        // Extended brand accents (also from DESIGN_SYSTEM.md)
        "cream-surface": "#FDFAE4",
        "warm-sand": "#D9C8A2",
        "terracotta-error": "#87211E",
        "olive-success": "#6B7A41",
        "clay-brown": "#A6654E",
        "dusty-rose": "#D8A39D",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        sm: "0.25rem",
        md: "0.75rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
      },
      fontFamily: {
        headline: ["Raleway", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Raleway", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["'Nunito Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
        label: ["'Nunito Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        // Typography scale from DESIGN_SYSTEM.md
        "display-lg": ["48px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg": ["32px", { lineHeight: "1.25", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "1.3", fontWeight: "600" }],
        "headline-sm": ["20px", { lineHeight: "1.4", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "label-md": ["14px", { lineHeight: "1.2", letterSpacing: "0.02em", fontWeight: "700" }],
        "label-sm": ["12px", { lineHeight: "1.2", letterSpacing: "0.04em", fontWeight: "700" }],
      },
      boxShadow: {
        "warm-sm": "0 1px 2px rgba(29,29,27,0.06), 0 1px 3px rgba(29,29,27,0.04)",
        "warm": "0 4px 12px rgba(29,29,27,0.06), 0 2px 4px rgba(29,29,27,0.04)",
        "warm-lg": "0 12px 32px rgba(29,29,27,0.08), 0 4px 8px rgba(29,29,27,0.04)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 200ms ease-out",
        "slide-up": "slide-up 220ms cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
