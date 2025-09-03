"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Globe, Mail, Star } from "lucide-react";
import type { Empresa } from "@/types/empresa";

interface Props {
  empresa: Empresa;
}

const EmpresaCard = ({ empresa }: Props) => {
  const imagenDestacada = empresa.imagenes?.[0] || "/img/sinFoto.png";

  return (
    <Link
      href={`/empresas/${empresa.slug}`}
      className="group block bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-blue-300 hover:scale-[1.02] overflow-hidden"
    >
      {/* Imagen y Badge Destacada */}
      <div className="relative w-full aspect-[4/3] overflow-hidden">
        <Image
          src={imagenDestacada}
          alt={`Imagen de ${empresa.nombre}`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
          priority={false}
        />
        {empresa.destacado && (
          <div className="absolute top-3 right-3 bg-gray-700 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
            <Star size={12} className="fill-current text-gray-300" />
            Destacada
          </div>
        )}
        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Contenido */}
      <div className="p-4 sm:p-5 space-y-3">
        {/* Título */}
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2 leading-tight">
          {empresa.nombre}
        </h2>

        {/* Información de contacto */}
        <div className="space-y-2">
          {empresa.telefono && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="flex-shrink-0 w-5 h-5 bg-blue-50 rounded-full flex items-center justify-center">
                <Phone size={12} className="text-blue-500" />
              </div>
              <span className="truncate">{empresa.telefono}</span>
            </div>
          )}

          {empresa.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="flex-shrink-0 w-5 h-5 bg-blue-50 rounded-full flex items-center justify-center">
                <Mail size={12} className="text-blue-500" />
              </div>
              <span className="truncate">{empresa.email}</span>
            </div>
          )}

          {empresa.web && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="flex-shrink-0 w-5 h-5 bg-blue-50 rounded-full flex items-center justify-center">
                <Globe size={12} className="text-blue-500" />
              </div>
              <span className="truncate">{empresa.web}</span>
            </div>
          )}
        </div>

        {/* Ubicación */}
        {(empresa.direccion || empresa.localidad || empresa.provincia) && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <div className="flex-shrink-0 w-5 h-5 bg-green-50 rounded-full flex items-center justify-center mt-0.5">
                <MapPin size={12} className="text-green-500" />
              </div>
              <div className="min-w-0 flex-1">
                {empresa.direccion && (
                  <div className="font-medium truncate">
                    {empresa.direccion}
                  </div>
                )}
                {(empresa.localidad || empresa.provincia) && (
                  <div className="text-xs text-gray-500 truncate">
                    {[empresa.localidad, empresa.provincia]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Servicios */}
        {empresa.servicios && empresa.servicios.length > 0 && (
          <div className="pt-2">
            <div className="flex flex-wrap gap-1">
              {empresa.servicios.slice(0, 2).map((servicio) => (
                <span
                  key={servicio.id}
                  className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md"
                >
                  {servicio.nombre}
                </span>
              ))}
              {empresa.servicios.length > 2 && (
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md">
                  +{empresa.servicios.length - 2} más
                </span>
              )}
            </div>
          </div>
        )}

        {/* Call to action */}
        <div className="pt-2">
          <div className="inline-flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
            Ver detalles
            <svg
              className="ml-1 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default EmpresaCard;
