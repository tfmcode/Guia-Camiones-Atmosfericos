import { NextResponse } from "next/server";
import pool from "@/lib/db";

// ✅ Forzar revalidación y evitar caché
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const headers = {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "Last-Modified": new Date().toUTCString(),
  };

  try {
    console.log("🔍 [API Public] Cargando empresas con coordenadas...");

    // ✅ Query con CAST explícito para coordenadas
    const empresasQuery = `
      SELECT 
        e.id, e.nombre, e.provincia, e.localidad, e.imagenes, 
        e.destacado, e.slug, e.telefono, e.email, e.direccion,
        e.web, e.corrientes_de_residuos, e.habilitado, e.fecha_creacion,
        -- ✅ IMPORTANTE: CAST a DOUBLE PRECISION para asegurar tipo numérico
        CAST(e.lat AS DOUBLE PRECISION) as lat,
        CAST(e.lng AS DOUBLE PRECISION) as lng,
        -- ✅ Indicador si necesita geocodificación
        CASE 
          WHEN e.lat IS NULL OR e.lng IS NULL THEN true 
          ELSE false 
        END as needs_geocoding
      FROM empresa e
      WHERE e.habilitado = true
      ORDER BY 
        e.destacado DESC,
        e.fecha_creacion DESC
    `;

    const { rows: empresas } = await pool.query(empresasQuery);

    console.log(`📊 [API Public] ${empresas.length} empresas cargadas`);

    // ✅ Estadísticas de geocodificación
    const needsGeocoding = empresas.filter((e) => e.needs_geocoding).length;
    const hasCoordinates = empresas.filter((e) => !e.needs_geocoding).length;

    console.log(
      `🗺️ [API Public] Geocodificación: ${hasCoordinates} completas, ${needsGeocoding} pendientes`
    );

    if (empresas.length === 0) {
      return NextResponse.json([], { headers });
    }

    // Obtener servicios
    const empresaIds = empresas.map((e) => e.id);
    const serviciosQuery = `
      SELECT es.empresa_id, s.id, s.nombre
      FROM empresa_servicio es
      JOIN servicio s ON s.id = es.servicio_id
      WHERE es.empresa_id = ANY($1::int[])
      ORDER BY s.nombre ASC
    `;
    const { rows: servicios } = await pool.query(serviciosQuery, [empresaIds]);

    // ✅ Mapear empresas con servicios Y parsear coordenadas explícitamente
    const empresasConServicios = empresas.map((empresa) => {
      const serviciosEmpresa = servicios
        .filter((s) => s.empresa_id === empresa.id)
        .map((s) => ({
          id: s.id,
          nombre: s.nombre,
        }));

      return {
        ...empresa,
        // ✅ CRÍTICO: Parsear lat/lng como números o null
        lat: empresa.lat != null ? parseFloat(empresa.lat) : null,
        lng: empresa.lng != null ? parseFloat(empresa.lng) : null,
        servicios: serviciosEmpresa,
      };
    });

    // Metadata para desarrollo
    const response = {
      data: empresasConServicios,
      meta:
        process.env.NODE_ENV === "development"
          ? {
              timestamp: new Date().toISOString(),
              total: empresasConServicios.length,
              geocoding_status: {
                complete: hasCoordinates,
                pending: needsGeocoding,
                percentage:
                  empresas.length > 0
                    ? Math.round((hasCoordinates / empresas.length) * 100)
                    : 0,
              },
            }
          : undefined,
    };

    return NextResponse.json(
      process.env.NODE_ENV === "development" ? response : empresasConServicios,
      { headers }
    );
  } catch (error) {
    console.error("❌ [API Public] Error:", error);
    return NextResponse.json(
      { message: "Error al obtener empresas" },
      { status: 500, headers }
    );
  }
}
