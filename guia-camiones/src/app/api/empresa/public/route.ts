import { NextResponse } from "next/server";
import pool from "@/lib/db";

// ✅ CAMBIO PRINCIPAL: Forzar revalidación y evitar caché
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  // ✅ CAMBIO: Headers para evitar caché del navegador y CDN
  const headers = {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "Last-Modified": new Date().toUTCString(),
  };

  try {
    console.log("🔍 [API Public] Cargando empresas públicas...");

    // ✅ CAMBIO: Query mejorado con más campos necesarios
    const empresasQuery = `
      SELECT 
        e.id, e.nombre, e.provincia, e.localidad, e.imagenes, 
        e.destacado, e.slug, e.telefono, e.email, e.direccion,
        e.web, e.corrientes_de_residuos, e.habilitado, e.fecha_creacion
      FROM empresa e
      WHERE e.habilitado = true
      ORDER BY e.fecha_creacion DESC
    `;
    const { rows: empresas } = await pool.query(empresasQuery);

    console.log(
      `📊 [API Public] Encontradas ${empresas.length} empresas habilitadas`
    );

    // Si no hay empresas, devolver array vacío con headers
    if (empresas.length === 0) {
      console.log("⚠️ [API Public] No hay empresas habilitadas");
      return NextResponse.json([], { headers });
    }

    // Obtener todos los servicios asociados a las empresas de un solo query
    const empresaIds = empresas.map((e) => e.id);
    const serviciosQuery = `
      SELECT es.empresa_id, s.id, s.nombre
      FROM empresa_servicio es
      JOIN servicio s ON s.id = es.servicio_id
      WHERE es.empresa_id = ANY($1::int[])
      ORDER BY s.nombre ASC
    `;
    const { rows: servicios } = await pool.query(serviciosQuery, [empresaIds]);

    console.log(
      `🔧 [API Public] Cargados ${servicios.length} servicios para las empresas`
    );

    // ✅ CAMBIO: Mapear servicios con mejor logging
    const empresasConServicios = empresas.map((empresa) => {
      const serviciosEmpresa = servicios
        .filter((s) => s.empresa_id === empresa.id)
        .map((s) => ({
          id: s.id,
          nombre: s.nombre,
        }));

      // Log detallado para debugging
      console.log(
        `📋 [API Public] Empresa ${empresa.nombre}: ${
          serviciosEmpresa.length
        } servicios, ${empresa.imagenes?.length || 0} imágenes`
      );

      return {
        ...empresa,
        servicios: serviciosEmpresa,
      };
    });

    console.log(
      `✅ [API Public] Devolviendo ${empresasConServicios.length} empresas completas`
    );

    // ✅ CAMBIO: Agregar timestamp para debugging
    const response = {
      timestamp: new Date().toISOString(),
      count: empresasConServicios.length,
      data: empresasConServicios,
    };

    // ✅ CAMBIO: En desarrollo, devolver con metadata. En producción, solo los datos
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json(response, { headers });
    } else {
      return NextResponse.json(empresasConServicios, { headers });
    }
  } catch (error) {
    console.error("❌ [API Public] Error al obtener empresas públicas:", error);

    // ✅ CAMBIO: Mejor manejo de errores con más información
    const errorResponse = {
      message: "Error al obtener empresas",
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
