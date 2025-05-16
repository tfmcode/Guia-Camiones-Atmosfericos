"use client";

import Link from "next/link";
import Image from "next/image";
import type { Empresa } from "@/types/empresa";

interface Props {
  empresa: Empresa;
}

const EmpresaCard = ({ empresa }: Props) => {
  const imagenDestacada =
    empresa.imagenes?.[0] ||
    "https://res.cloudinary.com/demo/image/upload/sample.jpg";

  return (
    <Link
      href={`/empresas/${empresa.slug}`}
      className="block border rounded overflow-hidden shadow-sm bg-white hover:shadow-md transition hover:ring-1 hover:ring-blue-500"
    >
      <div className="relative w-full aspect-[16/9]">
        <Image
          src={imagenDestacada}
          alt={`Imagen de ${empresa.nombre}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
          priority={false}
        />
      </div>

      <div className="p-4">
        <h2 className="text-lg font-semibold text-blue-700 hover:underline">
          {empresa.nombre}
        </h2>
        <p className="text-sm text-gray-600 mb-1">
          {empresa.provincia || "-"} — {empresa.localidad || "-"}
        </p>
        <p className="text-sm mb-2 text-gray-700">
          {empresa.servicios?.join(", ") || "Sin servicios"}
        </p>
        {empresa.destacado && (
          <span className="inline-block text-xs text-white bg-yellow-500 px-2 py-1 rounded">
            DESTACADA
          </span>
        )}
      </div>
    </Link>
  );
};

export default EmpresaCard;
