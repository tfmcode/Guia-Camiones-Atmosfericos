// src/app/pozos-desagotes/page.tsx - SIN filtro de keywords
import { Suspense } from "react";
import { getEmpresas } from "@/lib/api/empresaService";
import type { EmpresaWithCoords, Empresa } from "@/types/empresa";
import Link from "next/link";
import { AlertCircle, MapPin, Truck, RefreshCw } from "lucide-react";
import OptimizedPozosMapViewClient from "@/components/maps/OptimizedPozosMapViewClient";

export const dynamic = "force-dynamic";
export const revalidate = 900; // 15 minutos

function MapLoadingState() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Empresas por Proximidad - Búsqueda en Mapa
          </h1>
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-200 h-20 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    </div>
  );
}

interface ApiResponse {
  data?: Empresa[];
  empresas?: Empresa[];
  [key: string]: unknown;
}

async function PozosDesagotesContent() {
  try {
    console.log("🚀 Cargando todas las empresas con ubicación...");
    const todasLasEmpresas = await getEmpresas();

    let empresasArray: EmpresaWithCoords[] = [];

    if (Array.isArray(todasLasEmpresas)) {
      empresasArray = todasLasEmpresas as EmpresaWithCoords[];
    } else if (
      todasLasEmpresas &&
      typeof todasLasEmpresas === "object" &&
      "data" in todasLasEmpresas &&
      Array.isArray((todasLasEmpresas as ApiResponse).data)
    ) {
      empresasArray = (todasLasEmpresas as ApiResponse)
        .data as EmpresaWithCoords[];
    } else {
      console.error("❌ Formato de respuesta no reconocido:", todasLasEmpresas);
    }

    console.log(`📊 Empresas cargadas: ${empresasArray.length} total`);

    // ✅ FILTRO SIMPLE: Solo empresas con coordenadas válidas
    const empresasConUbicacion = empresasArray.filter(
      (empresa) =>
        empresa.lat != null &&
        empresa.lng != null &&
        typeof empresa.lat === "number" &&
        typeof empresa.lng === "number" &&
        !isNaN(empresa.lat) &&
        !isNaN(empresa.lng)
    );

    console.log(
      `🗺️ Empresas con ubicación: ${empresasConUbicacion.length} de ${empresasArray.length}`
    );

    // ✅ Ordenar por destacadas primero
    empresasConUbicacion.sort((a, b) => {
      if (a.destacado && !b.destacado) return -1;
      if (!a.destacado && b.destacado) return 1;
      return 0;
    });

    if (empresasConUbicacion.length === 0) {
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 py-16">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck size={32} className="text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Mapa de Empresas
              </h1>
              <p className="text-lg text-gray-600">Búsqueda por proximidad</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No hay empresas con ubicación disponible
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Actualmente no hay empresas con coordenadas geocodificadas.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/empresas"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <MapPin size={20} />
                  Ver listado completo
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        {/* ✅ Header con título y botón de actualización */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-20 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <MapPin size={20} className="text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Búsqueda por Proximidad
                </h1>
                <p className="text-xs text-gray-600">
                  {empresasConUbicacion.length} empresas con ubicación
                </p>
              </div>
            </div>

            {/* ✅ Botón de actualización */}
            <form action="/pozos-desagotes">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg group"
                title="Actualizar lista de empresas"
              >
                <RefreshCw
                  size={16}
                  className="group-hover:rotate-180 transition-transform duration-500"
                />
                <span className="hidden sm:inline">Actualizar</span>
                <div className="hidden sm:flex items-center gap-1 ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  15m
                </div>
              </button>
            </form>
          </div>
        </div>

        {/* Mapa con TODAS las empresas que tienen coordenadas */}
        <OptimizedPozosMapViewClient empresas={empresasConUbicacion} />
      </div>
    );
  } catch (error) {
    console.error("❌ Error cargando empresas:", error);

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error al cargar empresas
          </h2>
          <p className="text-gray-600 mb-6">
            Hubo un problema al cargar las empresas. Intentá actualizar la
            página.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <form action="/pozos-desagotes">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <RefreshCw size={18} />
                Actualizar
              </button>
            </form>
            <Link
              href="/empresas"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium inline-block"
            >
              Ver listado completo
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

export default function PozosDesagotesPage() {
  return (
    <Suspense fallback={<MapLoadingState />}>
      <PozosDesagotesContent />
    </Suspense>
  );
}

export const metadata = {
  title: "Mapa de Empresas - Búsqueda por Proximidad | Guía Atmosféricos",
  description:
    "Encuentra empresas cerca de tu ubicación con actualización automática cada 15 minutos.",
};
