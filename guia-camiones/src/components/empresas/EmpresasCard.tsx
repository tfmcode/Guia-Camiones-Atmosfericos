"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Globe, Mail } from "lucide-react"; // iconitos!
import type { Empresa } from "@/types/empresa";

interface Props {
  empresa: Empresa;
}

const EmpresaCard = ({ empresa }: Props) => {
  const imagenDestacada = empresa.imagenes?.[0] || "/img/LaVictoria.webp";

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

      <div className="p-4 space-y-2">
        <h2 className="text-lg font-semibold text-blue-700 hover:underline">
          {empresa.nombre}
        </h2>

        {empresa.telefono && (
          <p className="text-sm text-gray-700 flex items-center gap-1">
            <Phone size={14} className="text-blue-500" />
            {empresa.telefono}
          </p>
        )}

        {empresa.web && (
          <p className="text-sm text-gray-700 flex items-center gap-1">
            <Globe size={14} className="text-blue-500" />
            {empresa.web}
          </p>
        )}

        {empresa.email && (
          <p className="text-sm text-gray-700 flex items-center gap-1">
            <Mail size={14} className="text-blue-500" />
            {empresa.email}
          </p>
        )}

        {empresa.direccion && (
          <p className="text-sm text-gray-700 flex items-center gap-1">
            <MapPin size={14} className="text-blue-500" />
            {empresa.direccion}
          </p>
        )}
      </div>
    </Link>
  );
};

export default EmpresaCard;
