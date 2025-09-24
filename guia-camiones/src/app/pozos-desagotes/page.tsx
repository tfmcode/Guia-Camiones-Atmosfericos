// src/app/pozos-desagotes/page.tsx

import { Suspense } from "react";
import EmpresasMapViewEnhanced from "@/components/empresas/EmpresasMapView";
import { getEmpresas } from "@/lib/api/empresaService";
import type { Empresa } from "@/types/empresa";
import Link from "next/link";
import { AlertCircle, MapPin, Truck } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Función mejorada para filtrar empresas especializadas en pozos de desagote
function filterEmpresasForPozos(empresas: Empresa[]): Empresa[] {
  console.log(
    `🔍 Iniciando filtro inteligente de pozos. Total empresas: ${empresas.length}`
  );

  // Palabras clave principales para pozos de desagote
  const pozosKeywords = [
    // Términos principales
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

    // Equipos y servicios específicos
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

    // Términos técnicos
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

    // Servicios relacionados
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

  // Nombres de empresas relevantes
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

    return score >= 2; // Requiere al menos score 2 para ser incluida
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
    `✅ Filtro completado: ${empresasFiltradas.length} empresas especializadas encontradas`
  );

  return empresasFiltradas;
}

async function PozosDesagotesContent() {
  try {
    console.log("🚀 Cargando empresas para pozos de desagote...");
    const todasLasEmpresas = await getEmpresas();

    // Validar que la respuesta sea un array
    let empresasArray: Empresa[] = [];

    if (Array.isArray(todasLasEmpresas)) {
      empresasArray = todasLasEmpresas;
    } else if (
      todasLasEmpresas &&
      typeof todasLasEmpresas === "object" &&
      !Array.isArray(todasLasEmpresas)
    ) {
      // Si la respuesta es un objeto, intentar extraer el array
      if (
        Object.prototype.hasOwnProperty.call(todasLasEmpresas, "data") &&
        Array.isArray((todasLasEmpresas as { data?: unknown }).data)
      ) {
        empresasArray = (todasLasEmpresas as { data: Empresa[] }).data;
      } else if (
        Object.prototype.hasOwnProperty.call(todasLasEmpresas, "empresas") &&
        Array.isArray((todasLasEmpresas as { empresas?: unknown }).empresas)
      ) {
        empresasArray = (todasLasEmpresas as { empresas: Empresa[] }).empresas;
      } else {
        console.error(
          "❌ Formato de respuesta no reconocido:",
          todasLasEmpresas
        );
      }
    }

    console.log(`📊 Empresas cargadas: ${empresasArray.length} total`);

    // Filtrar empresas especializadas en pozos de desagote
    const empresasFiltradas = filterEmpresasForPozos(empresasArray);

    if (empresasFiltradas.length === 0) {
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 py-16">
            {/* Header de error */}
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

            {/* Mensaje de no encontrado */}
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

            {/* Información adicional */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-2">
                  ¿Tenés una empresa de desagotes?
                </h3>
                <p className="text-blue-800 text-sm mb-4">
                  Registrá tu empresa gratis y aparecer en los resultados de
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

    // Retornar el componente mejorado con las empresas filtradas
    return <EmpresasMapViewEnhanced empresas={empresasFiltradas} />;
  } catch (error) {
    console.error("❌ Error cargando empresas:", error);

    // En caso de error, mostrar mensaje amigable
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
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Reintentar
            </button>
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          {/* Loading más detallado */}
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
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium mb-2">
                Cargando empresas especializadas...
              </p>
              <p className="text-sm text-gray-500">
                Analizando base de datos y preparando búsqueda inteligente
              </p>
            </div>

            {/* Skeleton cards */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    >
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
