import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// ✅ CAMBIO PRINCIPAL: Forzar revalidación y evitar caché
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params;

  // ✅ CAMBIO: Headers para evitar caché del navegador y CDN
  const headers = {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "Last-Modified": new Date().toUTCString(),
  };

  try {
    console.log(`🔍 [API Slug] Buscando empresa con slug: "${slug}"`);

    // ✅ CAMBIO: Query mejorado con todos los campos necesarios
    const empresaQuery = `
      SELECT 
        id, slug, nombre, email, telefono, direccion, provincia,
        localidad, imagenes, destacado, habilitado, fecha_creacion,
        web, corrientes_de_residuos
      FROM empresa
      WHERE slug = $1
      LIMIT 1
    `;
    const { rows } = await pool.query(empresaQuery, [slug]);
    const empresa = rows[0];

    // ✅ CAMBIO: Mejor logging para debugging
    if (!empresa) {
      console.log(`❌ [API Slug] Empresa con slug "${slug}" no existe`);
      return NextResponse.json(
        {
          message: "No encontrado",
          slug: slug,
          timestamp: new Date().toISOString(),
        },
        { status: 404, headers }
      );
    }

    if (!empresa.habilitado) {
      console.log(
        `⚠️ [API Slug] Empresa "${empresa.nombre}" existe pero está deshabilitada`
      );
      return NextResponse.json(
        {
          message: "No encontrado",
          slug: slug,
          timestamp: new Date().toISOString(),
        },
        { status: 404, headers }
      );
    }

    console.log(
      `📊 [API Slug] Empresa encontrada: "${empresa.nombre}" (ID: ${empresa.id})`
    );
    console.log(`🔍 [API Slug] Datos de empresa:`, {
      id: empresa.id,
      nombre: empresa.nombre,
      slug: empresa.slug,
      habilitado: empresa.habilitado,
      imagenes: empresa.imagenes?.length || 0,
      email: empresa.email ? "Sí" : "No",
      web: empresa.web ? "Sí" : "No",
      direccion: empresa.direccion ? "Sí" : "No",
    });

    // ✅ CAMBIO: Query de servicios mejorado con ordenamiento
    const serviciosQuery = `
      SELECT s.id, s.nombre
      FROM empresa_servicio es
      JOIN servicio s ON s.id = es.servicio_id
      WHERE es.empresa_id = $1
      ORDER BY s.nombre ASC
    `;
    const { rows: servicios } = await pool.query(serviciosQuery, [empresa.id]);

    console.log(
      `🔧 [API Slug] Servicios cargados para "${empresa.nombre}": ${servicios.length}`
    );
    if (servicios.length > 0) {
      console.log(
        `📋 [API Slug] Lista de servicios:`,
        servicios.map((s) => s.nombre)
      );
    }

    // ✅ CAMBIO: Construir respuesta completa
    const empresaCompleta = {
      ...empresa,
      servicios,
      // ✅ AGREGADO: Metadata para debugging en desarrollo
      ...(process.env.NODE_ENV === "development" && {
        _metadata: {
          timestamp: new Date().toISOString(),
          slug: slug,
          servicios_count: servicios.length,
          imagenes_count: empresa.imagenes?.length || 0,
        },
      }),
    };

    console.log(
      `✅ [API Slug] Devolviendo empresa completa: "${empresa.nombre}"`
    );
    console.log(`📊 [API Slug] Resumen final:`, {
      nombre: empresa.nombre,
      slug: empresa.slug,
      servicios: servicios.length,
      imagenes: empresa.imagenes?.length || 0,
      datos_completos: !!(empresa.telefono && empresa.direccion),
    });

    return NextResponse.json(empresaCompleta, { headers });
  } catch (error) {
    console.error(
      `❌ [API Slug] Error al obtener empresa con slug "${slug}":`,
      error
    );

    // ✅ CAMBIO: Mejor manejo de errores con información contextual
    const errorResponse = {
      message: "Error al obtener empresa",
      slug: slug,
      timestamp: new Date().toISOString(),
      // Solo incluir detalles del error en desarrollo
      ...(process.env.NODE_ENV === "development" && {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      }),
    };

    return NextResponse.json(errorResponse, {
      status: 500,
      headers,
    });
  }
}
