// src/app/pozos-desagotes/page.tsx
import { Suspense } from "react";
import { getEmpresas } from "@/lib/api/empresaService";
import type { EmpresaWithCoords, Empresa } from "@/types/empresa";
import Link from "next/link";
import { AlertCircle, MapPin, Truck } from "lucide-react";

// Importar el wrapper cliente del mapa (maneja el dynamic ssr:false internamente)
import OptimizedPozosMapViewClient from "@/components/maps/OptimizedPozosMapViewClient";

// Configuración de Next.js para la página
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ✅ FUNCIÓN CORREGIDA - Score mínimo de 1
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

    // Buscar en nombre de la empresa (peso alto)
    const nombreLower = empresa.nombre.toLowerCase();
    const nombreMatches = pozosKeywords.filter((keyword) =>
      nombreLower.includes(keyword)
    ).length;
    score += nombreMatches * 3;

    // Buscar en servicios (peso alto)
    if (empresa.servicios && empresa.servicios.length > 0) {
      const serviciosText = empresa.servicios
        .map((s) => s.nombre.toLowerCase())
        .join(" ");
      const serviciosMatches = pozosKeywords.filter((keyword) =>
        serviciosText.includes(keyword)
      ).length;
      score += serviciosMatches * 3;
    }

    // Buscar en descripción/corrientes de residuos (peso medio)
    if (empresa.corrientes_de_residuos) {
      const descripcionLower = empresa.corrientes_de_residuos.toLowerCase();
      const descripcionMatches = pozosKeywords.filter((keyword) =>
        descripcionLower.includes(keyword)
      ).length;
      score += descripcionMatches * 2;
    }

    // Buscar en dirección (peso bajo)
    if (empresa.direccion) {
      const direccionLower = empresa.direccion.toLowerCase();
      const direccionMatches = pozosKeywords.filter((keyword) =>
        direccionLower.includes(keyword)
      ).length;
      score += direccionMatches * 1;
    }

    // Nombres sugestivos como bonus
    const nombreRelevante = nombresRelevantes.some((keyword) =>
      nombreLower.includes(keyword)
    );
    if (nombreRelevante) score += 1;

    // Log para debugging
    if (score > 0) {
      console.log(`✅ ${empresa.nombre}: score ${score}`);
    }

    // ✅ CAMBIO CRÍTICO: Score mínimo de 1 (era 2)
    return score >= 1;
  });

  // Ordenar por score (empresas más relevantes primero)
  empresasFiltradas.sort((a, b) => {
    // Primero las destacadas
    if (a.destacado && !b.destacado) return -1;
    if (!a.destacado && b.destacado) return 1;

    // Luego por relevancia implícita (más servicios relacionados)
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

// Componente de loading para el mapa
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

// Tipo para la respuesta de la API
interface ApiResponse {
  data?: Empresa[];
  empresas?: Empresa[];
  [key: string]: unknown;
}

// Componente de contenido principal (Server Component)
async function PozosDesagotesContent() {
  try {
    console.log("🚀 Cargando empresas para pozos de desagote...");
    const todasLasEmpresas = await getEmpresas();

    // Validar que la respuesta sea un array
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

    // Filtrar empresas especializadas en pozos de desagote
    const empresasFiltradas = filterEmpresasForPozos(empresasArray);

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
                registradas, pero podés buscar en nuestra guía general.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/empresas"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <MapPin size={20} />
                  Ver todas las empresas
                </Link>

                <Link
                  href="/registro"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <Truck size={20} />
                  Registrar mi empresa
                </Link>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-2">
                  ¿Tenés una empresa de desagotes?
                </h3>
                <p className="text-blue-800 text-sm mb-4">
                  Registrá tu empresa gratis y aparecé en los resultados de
                  búsqueda.
                </p>
                <Link
                  href="/registro"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Registrarme ahora →
                </Link>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-semibold text-green-900 mb-2">
                  ¿Necesitás este servicio?
                </h3>
                <p className="text-green-800 text-sm mb-4">
                  Explorá nuestra guía completa de empresas ambientales.
                </p>
                <Link
                  href="/empresas"
                  className="text-green-600 hover:text-green-700 font-medium text-sm"
                >
                  Ver empresas →
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    console.log("Empresas filtradas a pasar:", empresasFiltradas.length);

    // Retornar el componente del mapa con las empresas filtradas
    return <OptimizedPozosMapViewClient empresas={empresasFiltradas} />;
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
            Hubo un problema al cargar las empresas. Por favor, intentá
            nuevamente en unos momentos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pozos-desagotes"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Reintentar
            </Link>
            <Link
              href="/empresas"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
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

// Metadata mejorada para SEO
export const metadata = {
  title:
    "Pozos de Desagotes Ciegos - Búsqueda Inteligente por Proximidad | Guía de Camiones Atmosféricos",
  description:
    "Encuentra empresas especializadas en desagote de pozos ciegos cerca de tu ubicación. Búsqueda inteligente con Google Maps, ordenamiento por proximidad y geocodificación automática.",
  keywords: [
    "pozos ciegos",
    "desagote",
    "camiones atmosféricos",
    "vaciado pozos",
    "empresas desagote",
    "servicios ambientales",
    "proximidad",
    "geolocalización",
    "desobstrucción",
    "saneamiento",
    "pozos sépticos",
    "limpieza pozos",
    "hidrojet",
    "emergencias 24hs",
    "residuos líquidos",
  ].join(", "),
  openGraph: {
    title: "Pozos de Desagotes Ciegos - Búsqueda por Proximidad",
    description:
      "Encuentra empresas especializadas cerca de tu ubicación con nuestra búsqueda inteligente.",
    images: [
      {
        url: "/img/portada.png",
        width: 1200,
        height: 630,
        alt: "Búsqueda de empresas de desagote por proximidad",
      },
    ],
  },
};
