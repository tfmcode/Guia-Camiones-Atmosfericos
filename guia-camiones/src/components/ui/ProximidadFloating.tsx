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
      {/* Ícono */}
      <div className="relative flex flex-col items-center">
        <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-xl flex items-center justify-center transition-transform duration-300 hover:scale-110">
          <MapPin size={24} className="text-white" strokeWidth={2.3} />
        </div>

        {/* halo ping */}
        <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping"></div>
      </div>

      {/* Texto centrado con leve sangría en segunda línea */}
      <div className="text-center animate-[pulse_2s_ease-in-out_infinite]">
        <p className="bg-yellow-400 text-black text-[13px] font-semibold px-2 py-1 rounded-md shadow-md border border-black leading-tight">
          Desagotes de pozo ciego
          <br />
          <span className="pl-6">en tu zona</span>
        </p>
      </div>
    </Link>
  );
};

export default ProximidadFloating;
