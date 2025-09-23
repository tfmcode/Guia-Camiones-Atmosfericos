// src/app/pozos-desagotes/page.tsx

import { Suspense } from "react";
import EmpresasMapView from "@/components/empresas/EmpresasMapView";
import { getEmpresas } from "@/lib/api/empresaService";
import type { Empresa } from "@/types/empresa";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Datos de prueba para pozos de desagote
const EMPRESAS_PRUEBA: Empresa[] = [
  {
    id: 9999,
    nombre: "Servicios de Pozos Ciegos Buenos Aires",
    habilitado: true,
    slug: "pozos-ciegos-ba",
    telefono: "11-4567-8901",
    email: "info@pozosba.com",
    direccion: "Av. Corrientes 1234, Ciudad Autónoma de Buenos Aires",
    provincia: "Ciudad Autónoma de Buenos Aires",
    localidad: "Capital Federal",
    web: "www.pozosba.com",
    imagenes: [],
    destacado: true,
    corrientes_de_residuos:
      "Especialistas en desagote de pozos ciegos, sépticos y cámaras de inspección. Servicio 24hs con equipos modernos y personal capacitado.",
    servicios: [
      { id: 1, nombre: "Desagote de pozos ciegos" },
      { id: 2, nombre: "Limpieza de pozos sépticos" },
      { id: 3, nombre: "Camiones atmosféricos" },
      { id: 4, nombre: "Desobstrucción de cañerías" },
    ],
  },
  {
    id: 9998,
    nombre: "Atmosféricos del Sur SRL",
    habilitado: true,
    slug: "atmosfericos-sur",
    telefono: "11-5678-9012",
    email: "contacto@atmosfericos.com",
    direccion: "Calle 7 N° 456, La Plata, Buenos Aires",
    provincia: "Buenos Aires",
    localidad: "La Plata",
    web: "www.atmosfericos-sur.com.ar",
    imagenes: [],
    destacado: false,
    corrientes_de_residuos:
      "Vaciado y limpieza de pozos con equipos especializados. Atención en todo el Gran La Plata.",
    servicios: [
      { id: 5, nombre: "Vaciado de pozos" },
      { id: 6, nombre: "Desobstrucción cloacal" },
      { id: 7, nombre: "Limpieza de cámaras sépticas" },
    ],
  },
  {
    id: 9997,
    nombre: "Desobstrucción Total 24HS",
    slug: "desobstruccion-total",
    habilitado: true,

    telefono: "11-6789-0123",
    email: "urgencias@desobstruccion24.com",
    direccion: "Av. San Martín 789, Quilmes, Buenos Aires",
    provincia: "Buenos Aires",
    localidad: "Quilmes",
    web: "www.desobstruccion24.com.ar",
    imagenes: [],
    destacado: true,
    corrientes_de_residuos:
      "Servicios de saneamiento y desobstrucción 24hs. Pozos ciegos, sépticos y pluviales.",
    servicios: [
      { id: 8, nombre: "Desobstrucción de cañerías" },
      { id: 9, nombre: "Limpieza de pozos" },
      { id: 10, nombre: "Servicio de emergencia 24hs" },
    ],
  },
  {
    id: 9996,
    nombre: "Camiones Atmosféricos Norte",
    slug: "atmosfericos-norte",
    habilitado: true,

    telefono: "11-7890-1234",
    email: "info@atmosfericosnorte.com",
    direccion: "Ruta 8 Km 35, Pilar, Buenos Aires",
    provincia: "Buenos Aires",
    localidad: "Pilar",
    imagenes: [],
    destacado: false,
    corrientes_de_residuos:
      "Especialistas en vaciado de pozos negros y sépticos en zona norte del Gran Buenos Aires.",
    servicios: [
      { id: 11, nombre: "Pozos sépticos" },
      { id: 12, nombre: "Pozos ciegos" },
      { id: 13, nombre: "Cámaras de inspección" },
    ],
  },
  {
    id: 9995,
    nombre: "Saneamiento Express",
    slug: "saneamiento-express",
    telefono: "11-8901-2345",
    direccion: "Av. Eva Perón 321, Morón, Buenos Aires",
    provincia: "Buenos Aires",
    habilitado: true,

    localidad: "Morón",
    imagenes: [],
    destacado: false,
    corrientes_de_residuos:
      "Servicio rápido de desagote y limpieza para empresas y particulares.",
    servicios: [
      { id: 14, nombre: "Desagote industrial" },
      { id: 15, nombre: "Limpieza de pozos domiciliarios" },
    ],
  },
  {
    id: 9994,
    nombre: "Ecoambiente Pozos SA",
    slug: "ecoambiente-pozos",
    telefono: "11-9012-3456",
    email: "ventas@ecoambiente.com.ar",
    direccion: "Calle Belgrano 567, San Isidro, Buenos Aires",
    provincia: "Buenos Aires",
    habilitado: true,

    localidad: "San Isidro",
    web: "www.ecoambiente-pozos.com",
    imagenes: [],
    destacado: true,
    corrientes_de_residuos:
      "Gestión integral de residuos líquidos con tecnología avanzada y cuidado del medio ambiente.",
    servicios: [
      { id: 16, nombre: "Tratamiento ecológico" },
      { id: 17, nombre: "Desagote sustentable" },
      { id: 18, nombre: "Pozos domiciliarios" },
    ],
  },
];

// Función mejorada para filtrar empresas especializadas en pozos de desagote
function filterEmpresasForPozos(empresas: Empresa[]): Empresa[] {
  console.log(`Iniciando filtro de pozos. Total empresas: ${empresas.length}`);

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
  ];

  // Palabras clave adicionales para nombres relevantes
  const nombresRelevantes = [
    "ambiental",
    "servicios",
    "transporte",
    "ecologico",
    "residuo",
    "tratamiento",
    "gestion",
  ];

  const empresasFiltradas = empresas.filter((empresa) => {
    // Buscar en nombre de la empresa (más peso)
    const nombreMatch = pozosKeywords.some((keyword) =>
      empresa.nombre.toLowerCase().includes(keyword)
    );

    // Buscar en servicios (si existen)
    const serviciosMatch =
      empresa.servicios?.some((servicio) =>
        pozosKeywords.some((keyword) =>
          servicio.nombre.toLowerCase().includes(keyword)
        )
      ) || false;

    // Buscar en descripción/corrientes de residuos
    const descripcionMatch = empresa.corrientes_de_residuos
      ? pozosKeywords.some((keyword) =>
          empresa.corrientes_de_residuos!.toLowerCase().includes(keyword)
        )
      : false;

    // Buscar en dirección
    const direccionMatch = empresa.direccion
      ? pozosKeywords.some((keyword) =>
          empresa.direccion.toLowerCase().includes(keyword)
        )
      : false;

  /*   // Nombres sugestivos como fallback
    const nombreRelevante = nombresRelevantes.some((keyword) =>
      empresa.nombre.toLowerCase().includes(keyword)
    );
 */
    const match =
      nombreMatch || serviciosMatch || descripcionMatch || direccionMatch;

    if (match) {
      const motivos = [
        nombreMatch && "nombre",
        serviciosMatch && "servicios",
        descripcionMatch && "descripción",
        direccionMatch && "dirección",
      ]
        .filter(Boolean)
        .join(", ");

      console.log(`Empresa filtrada: ${empresa.nombre} - Motivos: ${motivos}`);
    }

    return match;
  });

  console.log(
    `Empresas especializadas encontradas: ${empresasFiltradas.length}`
  );

  // Si no encontramos suficientes, agregar empresas con nombres relevantes
  if (empresasFiltradas.length < 5) {
    console.log(
      `Pocas empresas encontradas, agregando empresas adicionales...`
    );
    const empresasAdicionales = empresas
      .filter((e) => !empresasFiltradas.includes(e))
      .filter((e) =>
        nombresRelevantes.some((keyword) =>
          e.nombre.toLowerCase().includes(keyword)
        )
      )
      .slice(0, 10 - empresasFiltradas.length);

    empresasAdicionales.forEach((empresa) => {
      console.log(`Empresa adicional agregada: ${empresa.nombre}`);
    });

    return [...empresasFiltradas, ...empresasAdicionales];
  }

  return empresasFiltradas;
}

async function PozosDesagotesContent() {
  try {
    console.log("Cargando empresas para pozos de desagote...");
    const todasLasEmpresas = await getEmpresas();

    console.log("DEBUG - Respuesta de getEmpresas:", {
      tipo: typeof todasLasEmpresas,
      esArray: Array.isArray(todasLasEmpresas),
      longitud: Array.isArray(todasLasEmpresas)
        ? todasLasEmpresas.length
        : "N/A",
    });

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
        console.error("Formato de respuesta no reconocido:", todasLasEmpresas);
      }
    }

    // DEBUG: Información sobre empresas reales
    if (empresasArray.length > 0) {
      console.log("DEBUG - Análisis de empresas reales:", {
        total: empresasArray.length,
        primeras3: empresasArray.slice(0, 3).map((e) => ({
          nombre: e.nombre,
          servicios: e.servicios?.length || 0,
          tieneServicios: !!e.servicios,
          corrientes: !!e.corrientes_de_residuos,
        })),
        empresasConServicios: empresasArray.filter(
          (e) => e.servicios && e.servicios.length > 0
        ).length,
        empresasConDescripcion: empresasArray.filter(
          (e) => e.corrientes_de_residuos
        ).length,
      });
    } else {
      console.warn("No se encontraron empresas reales en la respuesta");
    }

    // Filtrar empresas especializadas en pozos de desagote
    let empresasFiltradas = filterEmpresasForPozos(empresasArray);

    // Agregar empresas de prueba SIEMPRE para desarrollo/testing
    console.log("Agregando empresas de prueba para desarrollo...");
    empresasFiltradas = [...EMPRESAS_PRUEBA, ...empresasFiltradas];

    // Remover duplicados por ID si los hay
    const empresasUnicas = empresasFiltradas.filter(
      (empresa, index, self) =>
        index === self.findIndex((e) => e.id === empresa.id)
    );

    console.log(
      `Total de empresas después de agregar datos de prueba: ${empresasUnicas.length}`
    );

    if (empresasUnicas.length === 0) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🚛</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron empresas especializadas
            </h2>
            <p className="text-gray-600 mb-4">
              Actualmente no hay empresas especializadas en pozos de desagote
              registradas en tu zona.
            </p>
            <Link
              href="/empresas"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ver todas las empresas
            </Link>
          </div>
        </div>
      );
    }

    return <EmpresasMapView empresas={empresasUnicas} />;
  } catch (error) {
    console.error("Error cargando empresas:", error);

    // En caso de error, mostrar solo empresas de prueba
    console.log("Fallback: Mostrando solo empresas de prueba debido al error");
    return <EmpresasMapView empresas={EMPRESAS_PRUEBA} />;
  }
}

export default function PozosDesagotesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">
              Cargando empresas especializadas en pozos de desagote...
            </p>
          </div>
        </div>
      }
    >
      <PozosDesagotesContent />
    </Suspense>
  );
}

// Metadata para SEO
export const metadata = {
  title:
    "Pozos de Desagotes Ciegos - Búsqueda por Proximidad | Guía de Camiones Atmosféricos",
  description:
    "Encuentra empresas especializadas en desagote de pozos ciegos cerca de tu ubicación. Búsqueda inteligente con mapa interactivo y ordenamiento por proximidad.",
  keywords:
    "pozos ciegos, desagote, camiones atmosféricos, vaciado pozos, empresas desagote, servicios ambientales",
};
