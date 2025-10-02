"use client";

import dynamic from "next/dynamic";
import { Empresa } from "@/types";
// Import dinámico del mapa, sólo en cliente
const OptimizedPozosMapView = dynamic(
  () => import("@/components/maps/OptimizedPozosMapView"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[60vh] grid place-items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Cargando mapa...</p>
      </div>
    ),
  }
);

export default function OptimizedPozosMapViewClient({
  empresas,
}: {
  empresas: Empresa[];
}) {
  return <OptimizedPozosMapView empresas={empresas} />;
}
