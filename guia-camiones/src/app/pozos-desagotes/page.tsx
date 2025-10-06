// src/app/pozos-desagotes/page.tsx - Botón debajo del título
import { Suspense } from "react";
import { getEmpresas } from "@/lib/api/empresaService";
import type { EmpresaWithCoords, Empresa } from "@/types/empresa";
import Link from "next/link";
import { AlertCircle, MapPin, Truck, RefreshCw } from "lucide-react";
import OptimizedPozosMapViewClient from "@/components/maps/OptimizedPozosMapViewClient";

export const dynamic = "force-dynamic";
export const revalidate = 900; // 15 minutos

function filterEmpresasForPozos(
  empresas: EmpresaWithCoords[]
): EmpresaWithCoords[] {
  console.log(
    `🔍 Iniciando filtro de pozos. Total empresas: ${empresas.length}`
  );

  const pozosKeywords = [
    "pozo",
    "pozos",
    "desagote",
    "desagotes",
    "septico",
    "septica",
    "ciego",
    "ciegos",
    "fosa",
    "fosas",
    "succion",
    "vaciado",
    "atmosferico",
    "atmosfericos",
    "camion",
    "camiones",
    "limpieza",
    "desobstruccion",
    "saneamiento",
    "cloacal",
    "residual",
    "bomba",
    "bombeo",
    "aspiracion",
    "cañeria",
    "cañerias",
    "drenaje",
    "alcantarilla",
    "sumidero",
    "tanque",
    "cisterna",
    "deposito",
    "efluente",
    "lodo",
    "barro",
    "hidrojet",
    "destapacion",
    "mantenimiento",
    "emergencia",
    "24hs",
    "industrial",
    "domiciliario",
    "residencial",
    "comercial",
  ];

  const nombresRelevantes = [
    "ambiental",
    "ambientales",
    "servicios",
    "transporte",
    "ecologico",
    "residuo",
    "residuos",
    "tratamiento",
    "gestion",
    "integral",
    "sanitario",
    "limpio",
    "limpia",
    "verde",
    "express",
    "rapido",
  ];

  const empresasFiltradas = empresas.filter((empresa) => {
    let score = 0;

    const nombreLower = empresa.nombre.toLowerCase();
    const nombreMatches = pozosKeywords.filter((keyword) =>
      nombreLower.includes(keyword)
    ).length;
    score += nombreMatches * 3;

    if (empresa.servicios && empresa.servicios.length > 0) {
      const serviciosText = empresa.servicios
        .map((s) => s.nombre.toLowerCase())
        .join(" ");
      const serviciosMatches = pozosKeywords.filter((keyword) =>
        serviciosText.includes(keyword)
      ).length;
      score += serviciosMatches * 3;
    }

    if (empresa.corrientes_de_residuos) {
      const descripcionLower = empresa.corrientes_de_residuos.toLowerCase();
      const descripcionMatches = pozosKeywords.filter((keyword) =>
        descripcionLower.includes(keyword)
      ).length;
      score += descripcionMatches * 2;
    }

    if (empresa.direccion) {
      const direccionLower = empresa.direccion.toLowerCase();
      const direccionMatches = pozosKeywords.filter((keyword) =>
        direccionLower.includes(keyword)
      ).length;
      score += direccionMatches * 1;
    }

    const nombreRelevante = nombresRelevantes.some((keyword) =>
      nombreLower.includes(keyword)
    );
    if (nombreRelevante) score += 1;

    if (score > 0) {
      console.log(`✅ ${empresa.nombre}: score ${score}`);
    }

    return score >= 1;
  });

  empresasFiltradas.sort((a, b) => {
    if (a.destacado && !b.destacado) return -1;
    if (!a.destacado && b.destacado) return 1;

    const aRelevance =
      (a.servicios?.length || 0) + (a.corrientes_de_residuos ? 1 : 0);
    const bRelevance =
      (b.servicios?.length || 0) + (b.corrientes_de_residuos ? 1 : 0);

    return bRelevance - aRelevance;
  });

  console.log(
    `✅ Filtro completado: ${empresasFiltradas.length} empresas encontradas`
  );

  return empresasFiltradas;
}

function MapLoadingState() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Pozos de Desagotes - Búsqueda por Proximidad
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
    console.log("🚀 Cargando empresas para pozos de desagote...");
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

    const empresasFiltradas = filterEmpresasForPozos(empresasArray);

    const conCoordenadas = empresasFiltradas.filter(
      (e) => e.lat && e.lng
    ).length;
    const sinCoordenadas = empresasFiltradas.length - conCoordenadas;

    console.log(
      `🗺️ Geocodificación: ${conCoordenadas} completas, ${sinCoordenadas} pendientes`
    );

    if (empresasFiltradas.length === 0) {
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 py-16">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck size={32} className="text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Pozos de Desagotes Ciegos
              </h1>
              <p className="text-lg text-gray-600">
                Búsqueda especializada por proximidad
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No se encontraron empresas especializadas
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Actualmente no hay empresas especializadas en pozos de desagote
                registradas.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/empresas"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <MapPin size={20} />
                  Ver todas las empresas
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
                <Truck size={20} className="text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                Desagotes de Pozos Ciegos
                </h1>
              </div>
            </div>

            {/* ✅ Botón de actualización - Posición mejorada */}
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

        {/* Mapa con empresas */}
        <OptimizedPozosMapViewClient empresas={empresasFiltradas} />
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
              Ver guía general
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
  title:
    "Pozos de Desagotes Ciegos - Búsqueda por Proximidad | Guía Atmosféricos",
  description:
    "Encuentra empresas especializadas cerca de tu ubicación con actualización automática cada 15 minutos.",
};
