import { NextResponse } from "next/server";
import pool from "@/lib/db";

// ✅ CAMBIO PRINCIPAL: Forzar revalidación y evitar caché
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

    // ✅ NUEVO: Query incluye lat/lng para evitar geocodificación
    const empresasQuery = `
      SELECT 
        e.id, e.nombre, e.provincia, e.localidad, e.imagenes, 
        e.destacado, e.slug, e.telefono, e.email, e.direccion,
        e.web, e.corrientes_de_residuos, e.habilitado, e.fecha_creacion,
        e.lat, e.lng,  -- ✅ AGREGADO: Coordenadas cacheadas
        -- ✅ AGREGADO: Indicador si necesita geocodificación
        CASE 
          WHEN e.lat IS NULL OR e.lng IS NULL THEN true 
          ELSE false 
        END as needs_geocoding
      FROM empresa e
      WHERE e.habilitado = true
      ORDER BY 
        e.destacado DESC,  -- Destacadas primero
        e.fecha_creacion DESC
    `;

    const { rows: empresas } = await pool.query(empresasQuery);

    console.log(`📊 [API Public] ${empresas.length} empresas cargadas`);

    // ✅ NUEVO: Estadísticas de geocodificación
    const needsGeocoding = empresas.filter((e) => e.needs_geocoding).length;
    const hasCoordinates = empresas.filter((e) => !e.needs_geocoding).length;

    console.log(
      `🗺️ [API Public] Geocodificación: ${hasCoordinates} completas, ${needsGeocoding} pendientes`
    );

    if (empresas.length === 0) {
      return NextResponse.json([], { headers });
    }

    // Obtener servicios (igual que antes)
    const empresaIds = empresas.map((e) => e.id);
    const serviciosQuery = `
      SELECT es.empresa_id, s.id, s.nombre
      FROM empresa_servicio es
      JOIN servicio s ON s.id = es.servicio_id
      WHERE es.empresa_id = ANY($1::int[])
      ORDER BY s.nombre ASC
    `;
    const { rows: servicios } = await pool.query(serviciosQuery, [empresaIds]);

    const empresasConServicios = empresas.map((empresa) => {
      const serviciosEmpresa = servicios
        .filter((s) => s.empresa_id === empresa.id)
        .map((s) => ({
          id: s.id,
          nombre: s.nombre,
        }));

      return {
        ...empresa,
        servicios: serviciosEmpresa,
      };
    });

    // ✅ NUEVO: Metadata sobre geocodificación en desarrollo
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
                percentage: Math.round(
                  (hasCoordinates / empresas.length) * 100
                ),
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
