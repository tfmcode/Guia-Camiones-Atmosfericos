// src/app/api/geocoding/batch/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// ✅ Límites para evitar abuse
const MAX_ADDRESSES_PER_REQUEST = 5;
/* const RATE_LIMIT_PER_MINUTE = 20;
 */
// ✅ Cache en memoria para evitar geocodificar direcciones similares
const geocodeCache = new Map<
  string,
  { lat: number; lng: number; timestamp: number }
>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

export async function POST(req: NextRequest) {
  try {
    const { addresses, force = false } = await req.json();

    if (!Array.isArray(addresses) || addresses.length === 0) {
      return NextResponse.json(
        { error: "Se requiere array de direcciones" },
        { status: 400 }
      );
    }

    if (addresses.length > MAX_ADDRESSES_PER_REQUEST ) {
      return NextResponse.json(
        {
          error: `Máximo ${MAX_ADDRESSES_PER_REQUEST} direcciones por request`,
        },
        { status: 400 }
      );
    }

    console.log(`🌍 [Geocoding] Procesando ${addresses.length} direcciones...`);

    const results = [];

    for (const addressData of addresses) {
      const { id, address, provincia, localidad } = addressData;

      if (!address || !id) {
        results.push({ id, success: false, error: "Dirección o ID faltante" });
        continue;
      }

      // ✅ Verificar caché antes de hacer request
      const fullAddress = `${address}, ${localidad}, ${provincia}, Argentina`;
      const cacheKey = fullAddress.toLowerCase().trim();

      if (!force && geocodeCache.has(cacheKey)) {
        const cached = geocodeCache.get(cacheKey)!;
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
          console.log(`💾 [Geocoding] Cache hit para ${address}`);
          results.push({
            id,
            success: true,
            lat: cached.lat,
            lng: cached.lng,
            source: "cache",
          });
          continue;
        }
      }

      // ✅ Verificar si ya existe en base de datos
      if (!force) {
        const existingQuery =
          "SELECT lat, lng FROM empresa WHERE id = $1 AND lat IS NOT NULL AND lng IS NOT NULL";
        const existing = await pool.query(existingQuery, [id]);

        if (existing.rows.length > 0) {
          const { lat, lng } = existing.rows[0];
          console.log(`🗄️ [Geocoding] DB hit para empresa ${id}`);
          results.push({
            id,
            success: true,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            source: "database",
          });
          continue;
        }
      }

      // ✅ Marcar para geocodificación externa (cliente hará el request)
      results.push({
        id,
        address: fullAddress,
        needsGeocoding: true,
        source: "pending",
      });
    }

    // ✅ Estadísticas del proceso
    const stats = {
      total: results.length,
      cached: results.filter((r) => r.source === "cache").length,
      database: results.filter((r) => r.source === "database").length,
      pending: results.filter((r) => r.needsGeocoding).length,
    };

    console.log(`📊 [Geocoding] Stats:`, stats);

    return NextResponse.json({ results, stats });
  } catch (error) {
    console.error("❌ [Geocoding] Error:", error);
    return NextResponse.json(
      { error: "Error procesando geocodificación" },
      { status: 500 }
    );
  }
}

// ✅ Endpoint para guardar coordenadas geocodificadas
export async function PATCH(req: NextRequest) {
  try {
    const { updates } = await req.json();

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: "Se requiere array de updates" },
        { status: 400 }
      );
    }

    console.log(`💾 [Geocoding] Guardando ${updates.length} coordenadas...`);

    const savedCount = [];

    for (const update of updates) {
      const { id, lat, lng, address } = update;

      if (!id || !lat || !lng) {
        continue;
      }

      // ✅ Guardar en base de datos
      const updateQuery = `
        UPDATE empresa 
        SET lat = $1, lng = $2 
        WHERE id = $3 AND (lat IS NULL OR lng IS NULL)
        RETURNING id, nombre
      `;

      const result = await pool.query(updateQuery, [lat, lng, id]);

      if (result.rows.length > 0) {
        savedCount.push({ id, nombre: result.rows[0].nombre });

        // ✅ Actualizar caché
        if (address) {
          const cacheKey = address.toLowerCase().trim();
          geocodeCache.set(cacheKey, { lat, lng, timestamp: Date.now() });
        }
      }
    }

    console.log(`✅ [Geocoding] ${savedCount.length} empresas actualizadas`);

    return NextResponse.json({
      success: true,
      updated: savedCount.length,
      companies: savedCount,
    });
  } catch (error) {
    console.error("❌ [Geocoding] Error guardando:", error);
    return NextResponse.json(
      { error: "Error guardando coordenadas" },
      { status: 500 }
    );
  }
}

// ✅ Endpoint para obtener empresas que necesitan geocodificación
export async function GET() {
  try {
    const query = `
      SELECT id, nombre, direccion, localidad, provincia
      FROM empresa 
      WHERE habilitado = true 
        AND (lat IS NULL OR lng IS NULL)
        AND direccion IS NOT NULL
      ORDER BY destacado DESC, fecha_creacion DESC
      LIMIT 20
    `;

    const { rows } = await pool.query(query);

    console.log(
      `📋 [Geocoding] ${rows.length} empresas necesitan geocodificación`
    );

    return NextResponse.json({
      pending: rows,
      count: rows.length,
    });
  } catch (error) {
    console.error("❌ [Geocoding] Error:", error);
    return NextResponse.json(
      { error: "Error obteniendo empresas pendientes" },
      { status: 500 }
    );
  }

}


