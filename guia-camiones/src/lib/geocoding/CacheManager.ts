// src/lib/geocoding/CacheManager.ts
import pool from "@/lib/db";

interface CacheEntry {
  lat: number;
  lng: number;
  timestamp: number;
  hits: number;
}

export class GeocodingCacheManager {
  private memoryCache = new Map<string, CacheEntry>();
  private readonly MEMORY_CACHE_SIZE = 500; // Límite de entradas en memoria
  private readonly CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 días
  private readonly DB_CACHE_TABLE = "geocoding_cache";

  constructor() {
    this.initializeCache();
  }

  private async initializeCache() {
    // Crear tabla de caché si no existe
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ${this.DB_CACHE_TABLE} (
          address_hash VARCHAR(64) PRIMARY KEY,
          lat NUMERIC(10, 8) NOT NULL,
          lng NUMERIC(11, 8) NOT NULL,
          full_address TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          last_used TIMESTAMP DEFAULT NOW(),
          hits INT DEFAULT 1,
          CONSTRAINT valid_coordinates CHECK (
            lat >= -90 AND lat <= 90 AND 
            lng >= -180 AND lng <= 180
          )
        );

        CREATE INDEX IF NOT EXISTS idx_cache_last_used 
        ON ${this.DB_CACHE_TABLE}(last_used DESC);
      `);

      // Cargar las entradas más frecuentes en memoria
      await this.loadFrequentEntries();
    } catch (error) {
      console.error("Error inicializando caché:", error);
    }
  }

  private async loadFrequentEntries() {
    try {
      const result = await pool.query(`
        SELECT address_hash, lat, lng, hits 
        FROM ${this.DB_CACHE_TABLE}
        WHERE last_used > NOW() - INTERVAL '7 days'
        ORDER BY hits DESC
        LIMIT ${this.MEMORY_CACHE_SIZE}
      `);

      result.rows.forEach((row) => {
        const key = row.address_hash;
        this.memoryCache.set(key, {
          lat: parseFloat(row.lat),
          lng: parseFloat(row.lng),
          timestamp: Date.now(),
          hits: row.hits,
        });
      });

      console.log(
        `✅ Cargadas ${result.rows.length} entradas frecuentes en memoria`
      );
    } catch (error) {
      console.error("Error cargando caché frecuente:", error);
    }
  }

  private normalizeAddress(address: string): string {
    return address
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[,\.\-]/g, "")
      .replace(/argentina$/i, "")
      .trim();
  }

  private hashAddress(address: string): string {
    // Crear hash simple pero efectivo para la dirección
    const normalized = this.normalizeAddress(address);
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `addr_${Math.abs(hash).toString(36)}`;
  }

  async get(address: string): Promise<{ lat: number; lng: number } | null> {
    const key = this.hashAddress(address);

    // 1. Verificar caché en memoria (más rápido)
    const memoryEntry = this.memoryCache.get(key);
    if (
      memoryEntry &&
      Date.now() - memoryEntry.timestamp < this.CACHE_DURATION_MS
    ) {
      memoryEntry.hits++;
      console.log(`💾 Cache hit (memoria): ${address.substring(0, 30)}...`);
      return { lat: memoryEntry.lat, lng: memoryEntry.lng };
    }

    // 2. Verificar caché en base de datos
    try {
      const result = await pool.query(
        `
        UPDATE ${this.DB_CACHE_TABLE} 
        SET last_used = NOW(), hits = hits + 1
        WHERE address_hash = $1 
        AND created_at > NOW() - INTERVAL '7 days'
        RETURNING lat, lng
      `,
        [key]
      );

      if (result.rows.length > 0) {
        const coords = {
          lat: parseFloat(result.rows[0].lat),
          lng: parseFloat(result.rows[0].lng),
        };

        // Agregar a memoria si es frecuente
        this.addToMemoryCache(key, coords);
        console.log(`💾 Cache hit (DB): ${address.substring(0, 30)}...`);
        return coords;
      }
    } catch (error) {
      console.error("Error consultando caché DB:", error);
    }

    return null;
  }

  async set(address: string, lat: number, lng: number): Promise<void> {
    const key = this.hashAddress(address);

    // 1. Guardar en memoria
    this.addToMemoryCache(key, { lat, lng });

    // 2. Guardar en base de datos (asíncrono)
    try {
      await pool.query(
        `
        INSERT INTO ${this.DB_CACHE_TABLE} (address_hash, lat, lng, full_address)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (address_hash) 
        DO UPDATE SET 
          lat = EXCLUDED.lat,
          lng = EXCLUDED.lng,
          last_used = NOW(),
          hits = ${this.DB_CACHE_TABLE}.hits + 1
      `,
        [key, lat, lng, address]
      );

      console.log(`💾 Guardado en caché: ${address.substring(0, 30)}...`);
    } catch (error) {
      console.error("Error guardando en caché DB:", error);
    }
  }

  private addToMemoryCache(key: string, coords: { lat: number; lng: number }) {
    // Limitar tamaño del caché en memoria
    if (this.memoryCache.size >= this.MEMORY_CACHE_SIZE) {
      // Eliminar las entradas más antiguas
      const oldestKeys = Array.from(this.memoryCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 50)
        .map(([key]) => key);

      oldestKeys.forEach((key) => this.memoryCache.delete(key));
    }

    this.memoryCache.set(key, {
      ...coords,
      timestamp: Date.now(),
      hits: 1,
    });
  }

  async cleanupOldEntries(): Promise<void> {
    try {
      const result = await pool.query(`
        DELETE FROM ${this.DB_CACHE_TABLE}
        WHERE created_at < NOW() - INTERVAL '30 days'
      `);
      console.log(
        `🗑️ Limpieza: ${result.rowCount} entradas antiguas eliminadas`
      );
    } catch (error) {
      console.error("Error limpiando caché:", error);
    }
  }

  async getStats(): Promise<{
    memoryCacheSize: number;
    dbCacheSize: number;
    hitRate: number;
  }> {
    try {
      const dbStats = await pool.query(`
        SELECT 
          COUNT(*) as total,
          AVG(hits) as avg_hits
        FROM ${this.DB_CACHE_TABLE}
        WHERE created_at > NOW() - INTERVAL '7 days'
      `);

      return {
        memoryCacheSize: this.memoryCache.size,
        dbCacheSize: parseInt(dbStats.rows[0]?.total || 0),
        hitRate: parseFloat(dbStats.rows[0]?.avg_hits || 0),
      };
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error);
      return {
        memoryCacheSize: this.memoryCache.size,
        dbCacheSize: 0,
        hitRate: 0,
      };
    }
  }
}

// Singleton
export const geocodingCache = new GeocodingCacheManager();
