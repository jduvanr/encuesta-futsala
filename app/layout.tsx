import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { SITIO } from "@/lib/config";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITIO.url),
  title: { default: `${SITIO.titulo} | futsala.co`, template: "%s | futsala.co" },
  description: SITIO.descripcion,
  applicationName: "futsala.co",
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "futsala.co",
    url: "/",
    title: SITIO.titulo,
    description: SITIO.descripcion,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: SITIO.titulo }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITIO.titulo,
    description: SITIO.descripcion,
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0A0A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO" className={poppins.variable}>
      <body>
        <div className="fondo" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
