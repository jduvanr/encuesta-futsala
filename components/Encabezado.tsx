import Image from "next/image";
import Link from "next/link";

export function Encabezado() {
  return (
    <header className="mx-auto flex w-full max-w-xl items-center justify-between px-5 pt-5">
      <Link href="/" className="rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-amarillo">
        <Image src="/logos/futsala.png" alt="futsala.co" width={571} height={240} priority sizes="130px" className="h-12 w-auto sm:h-14" />
      </Link>
      {/* Parche de futsala.co. Es decorativo (el logo de la izquierda ya nombra la marca), por eso alt="" */}
      <Image src="/logos/parche.png" alt="" width={320} height={320} priority sizes="56px" className="h-12 w-12 sm:h-14 sm:w-14" />
    </header>
  );
}

/** Franja con los colores de la bandera de Bogotá. */
export function Bandera({ className = "" }: { className?: string }) {
  return (
    <div className={`flex h-1.5 w-full overflow-hidden rounded-full ${className}`} aria-hidden="true">
      <span className="flex-1 bg-amarillo" />
      <span className="flex-1 bg-rojo" />
    </div>
  );
}
