import type { Metadata } from "next";
import Link from "next/link";
import { Bandera, Encabezado } from "@/components/Encabezado";
import { SITIO } from "@/lib/config";

export const metadata: Metadata = {
  title: "Política de tratamiento de datos",
  description: "Cómo futsala.co trata los datos personales de la encuesta sobre fútbol de salón en Bogotá.",
};

export default function Politica() {
  return (
    <>
      <Encabezado />
      <main className="mx-auto w-full max-w-2xl px-4 pb-12 pt-6">
        <article className="tarjeta text-[15px] leading-relaxed text-white/85 [&_h2]:mb-2 [&_h2]:mt-7 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-blanco [&_li]:mt-1 [&_ul]:list-disc [&_ul]:pl-5">
          <Bandera className="mb-6 w-20" />
          <h1 className="text-2xl font-bold leading-tight text-blanco sm:text-3xl">Política de tratamiento de datos personales</h1>
          <p className="mt-2 text-sm text-white/60">Estudio “{SITIO.titulo}”</p>

          <h2>1. Responsable</h2>
          <p>
            {SITIO.responsable}, en alianza con la Liga de Fútbol de Salón de Bogotá, es responsable del tratamiento de los datos
            recogidos en esta encuesta, conforme a la Ley 1581 de 2012 y el Decreto 1074 de 2015 (que incorpora el Decreto 1377
            de 2013). Contacto: <a className="text-amarillo underline" href={`mailto:${SITIO.correoDatos}`}>{SITIO.correoDatos}</a>.
          </p>

          <h2>2. Datos que recogemos</h2>
          <ul>
            <li>
              Respuestas de la encuesta: tu rol (jugador, aficionado, cuerpo técnico, organizador, periodista, creador de contenido, patrocinador o árbitro), rango de edad, localidad y las
              preguntas de tu rol, como hábitos de consumo, condiciones de trabajo, coberturas de salud y riesgos, y organización de
              torneos.
            </li>
            <li>El canal por el que llegaste a la encuesta (por ejemplo, un código QR o una red social).</li>
            <li>Opcionalmente, tu número de WhatsApp, solo si decides dejarlo al final.</li>
          </ul>
          <p className="mt-2">
            No pedimos tu nombre, documento ni correo. Tus respuestas son anónimas. El número de WhatsApp se guarda en una tabla
            separada que no se puede relacionar con tus respuestas. Algunas preguntas tocan datos sensibles (ingresos, salud y
            lesiones): no estás obligado a responderlas, son opcionales e incluyen la opción &quot;Prefiero no responder&quot;.
          </p>

          <h2>3. Finalidad</h2>
          <ul>
            <li>Elaborar estadísticas sobre cómo se vive el fútbol de salón en Bogotá y mejorar los escenarios y las transmisiones.</li>
            <li>Si dejaste tu WhatsApp: enviarte los resultados del estudio. No lo usaremos para otros fines ni lo venderemos.</li>
          </ul>

          <h2>4. Menores de edad</h2>
          <p>
            Si eres menor de 18 años, te recomendamos responder con el acompañamiento de tu madre, padre o acudiente. Solo
            recogemos datos anónimos y de carácter estadístico, respetando tus derechos prevalentes.
          </p>

          <h2>5. Tus derechos</h2>
          <p>Como titular puedes:</p>
          <ul>
            <li>Conocer, actualizar y rectificar tus datos.</li>
            <li>Pedir prueba de la autorización que nos diste.</li>
            <li>Saber cómo usamos tus datos.</li>
            <li>Revocar la autorización o pedir que eliminemos tu número de WhatsApp.</li>
            <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).</li>
          </ul>
          <p className="mt-2">
            Escríbenos a <a className="text-amarillo underline" href={`mailto:${SITIO.correoDatos}`}>{SITIO.correoDatos}</a>.
            Respondemos consultas en máximo 10 días hábiles y reclamos en máximo 15 días hábiles.
          </p>

          <h2>6. Seguridad y conservación</h2>
          <p>
            Los datos se guardan en una base de datos con acceso restringido: el público solo puede enviar respuestas, no
            consultarlas. Conservamos la información solo mientras dure el estudio y la publicación de sus resultados; después se
            elimina o se deja solo en forma agregada.
          </p>

          <h2>7. Vigencia</h2>
          <p>Esta política rige desde noviembre de 2026. Cualquier cambio se publicará en esta misma página.</p>

          <Link href="/" className="btn-primario mt-8 w-full">
            Volver a la encuesta
          </Link>
        </article>
      </main>
    </>
  );
}
