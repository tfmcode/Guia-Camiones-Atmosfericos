"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin } from "lucide-react";

const ProximidadFloating: React.FC = () => {
  const pathname = usePathname();

  if (pathname === "/pozos-desagotes") {
    return null;
  }
  return (
    <Link
      href="/pozos-desagotes"
      title="Búsqueda por Proximidad"
      aria-label="Buscar empresas cercanas"
      className="fixed top-1/2 right-4 -translate-y-1/2 z-40 group"
    >
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-blue-500/50 group-hover:from-blue-600 group-hover:to-blue-800">
          <MapPin size={32} className="text-white" strokeWidth={2.5} />
        </div>

        <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping"></div>

        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-xl whitespace-nowrap">
            Desagotes de pozo ciego.
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProximidadFloating;
