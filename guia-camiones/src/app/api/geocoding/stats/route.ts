// src/app/api/geocoding/stats/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    // Obtener estadísticas del día
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM geocoding_log
      WHERE created_at > NOW() - INTERVAL '24 hours'
      AND source = 'google_api'
    `);

    const dailyRequests = parseInt(result.rows[0]?.count || 0);
    const dailyLimit = 2500;

    // Obtener estadísticas de caché
    const cacheResult = await pool.query(`
      SELECT COUNT(*) as total, AVG(hits) as avg_hits
      FROM geocoding_cache
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);

    return NextResponse.json({
      dailyRequests,
      dailyLimit,
      remainingRequests: Math.max(0, dailyLimit - dailyRequests),
      canMakeRequests: dailyRequests < dailyLimit,
      dbCacheSize: parseInt(cacheResult.rows[0]?.total || 0),
      hitRate: parseFloat(cacheResult.rows[0]?.avg_hits || 0),
      memoryCacheSize: 0, // Esto lo manejaremos desde el cliente
    });
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    // Si las tablas no existen, devolver valores por defecto
    return NextResponse.json({
      dailyRequests: 0,
      dailyLimit: 2500,
      remainingRequests: 2500,
      canMakeRequests: true,
      dbCacheSize: 0,
      hitRate: 0,
      memoryCacheSize: 0,
    });
  }
}
