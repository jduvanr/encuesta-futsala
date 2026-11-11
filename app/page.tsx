import QRCode from "qrcode";
import Link from "next/link";
import { Encabezado } from "@/components/Encabezado";
import { Encuesta } from "@/components/Encuesta";
import { REDES } from "@/lib/config";

// El QR se genera en el servidor durante el build: cero JavaScript extra en el celular.
export default async function Inicio() {
  const qrYoutube = await QRCode.toString(REDES.youtube, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#0A0A0A", light: "#FFFFFF" },
  });

  return (
    <>
      <Encabezado />
      <main className="mx-auto w-full max-w-xl px-4 pb-10 pt-6 sm:pt-10">
        <Encuesta qrYoutube={qrYoutube} />
      </main>
      <footer className="mx-auto max-w-xl px-5 pb-8 text-center text-xs text-white/50">
        © {new Date().getFullYear()} futsala.co · Encuesta distrital de fútbol de salón ·{" "}
        <Link href="/politica-de-datos" className="underline underline-offset-2 hover:text-white">
          Tratamiento de datos
        </Link>
      </footer>
    </>
  );
}
