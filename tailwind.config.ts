import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // HealthSherpa-inspired primary accent. brandAction is the accessible
        // darker companion for white-on-blue controls and small blue text.
        brand: "#0875F7",
        brandAction: "#0564D7",
        brandDark: "#034EAA",
        ink: "#22213F",
        muted: "#5F6078",
        lavender: "#EEEAFE",
        sky: "#EAF5FF",
        mint: "#DDF5EA",
        cream: "#FBFAF7",
        lilac: "#DCD8FF",
        coral: "#FFBCA8",
        ivory: "#FBFAF7",
      },
      fontFamily: { sans: ["Inter", "sans-serif"], display: ["Plus Jakarta Sans", "sans-serif"] },
      boxShadow: {
        soft: "0 18px 45px rgba(34,33,63,.10)",
        lift: "0 22px 44px rgba(8,117,247,.16)",
        card: "0 8px 22px rgba(34,33,63,.07)",
      },
    },
  },
  plugins: [],
} satisfies Config;
