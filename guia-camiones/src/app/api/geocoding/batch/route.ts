// src/app/api/geocoding/batch/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

const MAX_ADDRESSES_PER_REQUEST = 50; // Aumentado para batch processing
const geocodeCache = new Map<
  string,
  { lat: number; lng: number; timestamp: number }
>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

export async function POST(req: NextRequest) {
  try {
    // ✅ FIX: Recibir "requests" en lugar de "addresses"
    const { requests, force = false } = await req.json();

    // Validar formato
    if (!Array.isArray(requests)) {
      console.error("Formato inválido recibido:", typeof requests);
      return NextResponse.json(
        {
          error:
            "Se requiere un array de requests con formato: [{ id, address, provincia?, localidad? }]",
          received: typeof requests,
        },
        { status: 400 }
      );
    }

    if (requests.length === 0) {
      return NextResponse.json(
        { error: "El array de requests está vacío" },
        { status: 400 }
      );
    }

    if (requests.length > MAX_ADDRESSES_PER_REQUEST) {
      return NextResponse.json(
        {
          error: `Máximo ${MAX_ADDRESSES_PER_REQUEST} direcciones por request. Recibidas: ${requests.length}`,
        },
        { status: 400 }
      );
    }

    console.log(`[Geocoding] Procesando ${requests.length} solicitudes...`);

    const results = [];

    for (const requestData of requests) {
      const { id, address, provincia, localidad } = requestData;

      // Validar datos requeridos
      if (!address || !id) {
        console.warn(`Request inválido: id=${id}, address=${address}`);
        results.push({
          id: id || 0,
          success: false,
          error: "Dirección o ID faltante",
        });
        continue;
      }

      // Construir dirección completa
      const addressParts = [address];
      if (localidad) addressParts.push(localidad);
      if (provincia) addressParts.push(provincia);
      addressParts.push("Argentina");
      const fullAddress = addressParts.join(", ");

      const cacheKey = fullAddress.toLowerCase().trim();

      // 1. Verificar caché en memoria
      if (!force && geocodeCache.has(cacheKey)) {
        const cached = geocodeCache.get(cacheKey)!;
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
          console.log(`Cache (memoria): ${address}`);
          results.push({
            id,
            success: true,
            lat: cached.lat,
            lng: cached.lng,
            cached: true,
            source: "memory",
          });
          continue;
        }
      }

      // 2. Verificar si ya existe en base de datos
      if (!force) {
        try {
          const existingQuery = `
            SELECT lat, lng 
            FROM empresa 
            WHERE id = $1 
              AND lat IS NOT NULL 
              AND lng IS NOT NULL
          `;
          const existing = await pool.query(existingQuery, [id]);

          if (existing.rows.length > 0) {
            const { lat, lng } = existing.rows[0];
            const coords = {
              lat: parseFloat(lat),
              lng: parseFloat(lng),
            };

            console.log(`Cache (DB): empresa ${id}`);

            // Guardar en caché de memoria
            geocodeCache.set(cacheKey, {
              ...coords,
              timestamp: Date.now(),
            });

            results.push({
              id,
              success: true,
              ...coords,
              cached: true,
              source: "database",
            });
            continue;
          }
        } catch (dbError) {
          console.error(`Error consultando DB para empresa ${id}:`, dbError);
          // Continuar con el proceso normal
        }
      }

      // 3. Marcar para geocodificación por el cliente
      results.push({
        id,
        address: fullAddress,
        needsGeocoding: true,
        success: false,
        source: "pending",
      });
    }

    // Estadísticas
    const stats = {
      total: results.length,
      cached: results.filter((r) => r.cached).length,
      database: results.filter((r) => r.source === "database").length,
      memory: results.filter((r) => r.source === "memory").length,
      pending: results.filter((r) => r.needsGeocoding).length,
    };

    console.log(`[Geocoding] Stats:`, stats);

    return NextResponse.json({
      results,
      stats,
      success: true,
    });
  } catch (error) {
    console.error("[Geocoding] Error en POST:", error);
    return NextResponse.json(
      {
        error: "Error procesando geocodificación",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { updates } = await req.json();

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: "Se requiere array de updates" },
        { status: 400 }
      );
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "El array de updates está vacío" },
        { status: 400 }
      );
    }

    console.log(`[Geocoding] Guardando ${updates.length} coordenadas...`);

    const savedCount = [];
    const errors = [];

    for (const update of updates) {
      const { id, lat, lng, address } = update;

      if (!id || lat == null || lng == null) {
        errors.push({ id, error: "Datos incompletos" });
        continue;
      }

      // Validar coordenadas
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        errors.push({ id, error: "Coordenadas inválidas" });
        continue;
      }

      try {
        // Guardar en base de datos
        const updateQuery = `
          UPDATE empresa 
          SET lat = $1, lng = $2 
          WHERE id = $3 
          RETURNING id, nombre
        `;

        const result = await pool.query(updateQuery, [lat, lng, id]);

        if (result.rows.length > 0) {
          savedCount.push({
            id,
            nombre: result.rows[0].nombre,
          });

          // Actualizar caché de memoria
          if (address) {
            const cacheKey = address.toLowerCase().trim();
            geocodeCache.set(cacheKey, {
              lat,
              lng,
              timestamp: Date.now(),
            });
          }

          console.log(`Guardado: empresa ${id}`);
        } else {
          errors.push({
            id,
            error: "Empresa no encontrada o ya tenía coordenadas",
          });
        }
      } catch (dbError) {
        console.error(`Error guardando empresa ${id}:`, dbError);
        errors.push({
          id,
          error: dbError instanceof Error ? dbError.message : "Error DB",
        });
      }
    }

    console.log(
      `[Geocoding] ${savedCount.length}/${updates.length} actualizadas`
    );

    return NextResponse.json({
      success: true,
      updated: savedCount.length,
      companies: savedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[Geocoding] Error en PATCH:", error);
    return NextResponse.json(
      {
        error: "Error guardando coordenadas",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const query = `
      SELECT id, nombre, direccion, localidad, provincia
      FROM empresa 
      WHERE habilitado = true 
        AND (lat IS NULL OR lng IS NULL)
        AND direccion IS NOT NULL
        AND direccion != ''
      ORDER BY destacado DESC, fecha_creacion DESC
      LIMIT 50
    `;

    const { rows } = await pool.query(query);

    console.log(
      `[Geocoding] ${rows.length} empresas necesitan geocodificación`
    );

    return NextResponse.json({
      success: true,
      pending: rows,
      count: rows.length,
    });
  } catch (error) {
    console.error("[Geocoding] Error en GET:", error);
    return NextResponse.json(
      {
        error: "Error obteniendo empresas pendientes",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
