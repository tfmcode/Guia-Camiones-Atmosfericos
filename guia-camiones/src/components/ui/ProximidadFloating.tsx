"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin } from "lucide-react";

const ProximidadFloating: React.FC = () => {
  const noPathname = [
    "/pozos-desagotes",
    "/panel/empresa",
    "/panel/admin",
    "/panel/admin/empresas",
    "/panel/admin/usuarios",
  ];

  const pathname = usePathname();
  if (noPathname.includes(pathname)) return null;

  return (
    <Link
      href="/pozos-desagotes"
      className="fixed top-1/2 right-4 -translate-y-1/2 z-40 flex flex-col items-center gap-2"
    >
      {/* Botón / Icono */}
      <div className="relative">
        <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-xl flex items-center justify-center transition-transform duration-300 hover:scale-110">
          <MapPin size={26} className="text-white" strokeWidth={2.3} />
        </div>
        {/* Texto arriba con animación pulse suave */}
        <span className="bg-yellow-400 text-black text-sm font-semibold px-3 py-1 rounded-md shadow-md border border-black animate-[pulse_2s_ease-in-out_infinite]">
          Desagote de Pozo Ciego
        </span>

        {/* halo ping */}
        <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping"></div>
      </div>
    </Link>
  );
};

export default ProximidadFloating;
