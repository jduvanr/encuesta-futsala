import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        amarillo: "#FCD116",
        rojo: "#CE1126",
        negro: "#0A0A0A",
        blanco: "#FFFFFF",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "entra-derecha": {
          from: { opacity: "0", transform: "translateX(24px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "entra-izquierda": {
          from: { opacity: "0", transform: "translateX(-24px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        aparece: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "entra-derecha": "entra-derecha 280ms cubic-bezier(.2,.8,.2,1) both",
        "entra-izquierda": "entra-izquierda 280ms cubic-bezier(.2,.8,.2,1) both",
        aparece: "aparece 400ms cubic-bezier(.2,.8,.2,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
