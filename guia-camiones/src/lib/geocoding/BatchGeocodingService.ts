// src/lib/geocoding/BatchGeocodingService.ts
import pool from "@/lib/db";
import { geocodingCache } from "./CacheManager";

interface GeocodingRequest {
  id: number;
  address: string;
  provincia?: string;
  localidad?: string;
}

interface GeocodingResult {
  id: number;
  success: boolean;
  lat?: number;
  lng?: number;
  cached?: boolean;
  error?: string;
}

export class BatchGeocodingService {
  private readonly MAX_REQUESTS_PER_SECOND = 10; // Límite de Google
  private readonly MAX_REQUESTS_PER_DAY = 2500; // Tu límite diario gratuito
  private readonly BATCH_SIZE = 5; // Procesar de a 5
  private readonly DELAY_BETWEEN_BATCHES = 1200; // 1.2 segundos

  private requestCount = 0;
  private lastResetTime = Date.now();
  private geocoder: google.maps.Geocoder | null = null;
  private isProcessing = false;
  private abortController: AbortController | null = null;

  constructor() {
    this.loadDailyCount();
    this.initGeocoder();
  }

  private async initGeocoder() {
    // Esperar a que Google Maps esté disponible
    if (typeof google !== "undefined" && google.maps) {
      this.geocoder = new google.maps.Geocoder();
    }
  }

  private async loadDailyCount() {
    try {
      const result = await pool.query(`
        SELECT COUNT(*) as count
        FROM geocoding_log
        WHERE created_at > NOW() - INTERVAL '24 hours'
        AND source = 'google_api'
      `);
      this.requestCount = parseInt(result.rows[0]?.count || 0);
      console.log(
        `📊 Requests hoy: ${this.requestCount}/${this.MAX_REQUESTS_PER_DAY}`
      );
    } catch {
      // La tabla puede no existir aún
      await this.createLogTable();
    }
  }

  private async createLogTable() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS geocoding_log (
          id SERIAL PRIMARY KEY,
          empresa_id INT,
          source VARCHAR(20),
          success BOOLEAN,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_geocoding_log_date 
        ON geocoding_log(created_at DESC);
      `);
    } catch (error) {
      console.error("Error creando tabla de log:", error);
    }
  }

  private async logRequest(
    empresaId: number,
    source: string,
    success: boolean
  ) {
    try {
      await pool.query(
        `
        INSERT INTO geocoding_log (empresa_id, source, success)
        VALUES ($1, $2, $3)
      `,
        [empresaId, source, success]
      );
    } catch (error) {
      console.error("Error guardando log:", error);
    }
  }

  public canMakeRequest(): boolean {
    // Verificar límite diario
    if (this.requestCount >= this.MAX_REQUESTS_PER_DAY) {
      console.warn(
        `⚠️ Límite diario alcanzado: ${this.requestCount}/${this.MAX_REQUESTS_PER_DAY}`
      );
      return false;
    }

    // Reset contador cada 24 horas
    if (Date.now() - this.lastResetTime > 24 * 60 * 60 * 1000) {
      this.requestCount = 0;
      this.lastResetTime = Date.now();
    }

    return true;
  }

  public async geocodeSingle(
    address: string,
    signal?: AbortSignal
  ): Promise<{ lat: number; lng: number } | null> {
    // 1. Verificar caché primero
    const cached = await geocodingCache.get(address);
    if (cached) {
      console.log(`💾 Cache hit: ${address.substring(0, 30)}...`);
      return cached;
    }

    // 2. Verificar límites
    if (!this.canMakeRequest()) {
      throw new Error("Límite de requests alcanzado");
    }

    // 3. Verificar que el geocoder esté listo
    if (!this.geocoder) {
      throw new Error("Geocoder no inicializado");
    }

    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(new Error("Geocodificación cancelada"));
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error("Timeout en geocodificación"));
      }, 10000);

      this.geocoder!.geocode(
        {
          address: `${address}, Argentina`,
          region: "AR",
          bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(-55.0, -73.5),
            new google.maps.LatLng(-22.0, -53.5)
          ),
        },
        async (results, status) => {
          clearTimeout(timeoutId);

          if (signal?.aborted) {
            reject(new Error("Geocodificación cancelada"));
            return;
          }

          if (status === "OK" && results?.[0]) {
            const location = results[0].geometry.location;
            const coords = {
              lat: location.lat(),
              lng: location.lng(),
            };

            // Guardar en caché
            await geocodingCache.set(address, coords.lat, coords.lng);

            // Incrementar contador
            this.requestCount++;

            console.log(
              `✅ Geocodificado (${this.requestCount}/${
                this.MAX_REQUESTS_PER_DAY
              }): ${address.substring(0, 30)}...`
            );
            resolve(coords);
          } else if (status === "OVER_QUERY_LIMIT") {
            console.error("⚠️ Límite de API alcanzado");
            this.requestCount = this.MAX_REQUESTS_PER_DAY; // Marcar como límite alcanzado
            reject(new Error("Límite de API alcanzado"));
          } else if (status === "ZERO_RESULTS") {
            console.warn(`❌ Sin resultados: ${address}`);
            resolve(null);
          } else {
            console.error(`❌ Error geocodificando: ${status}`);
            resolve(null);
          }
        }
      );
    });
  }

  public async geocodeBatch(
    requests: GeocodingRequest[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<GeocodingResult[]> {
    if (this.isProcessing) {
      throw new Error("Ya hay un proceso de geocodificación en curso");
    }

    this.isProcessing = true;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const results: GeocodingResult[] = [];
    const pendingRequests: GeocodingRequest[] = [];

    try {
      // 1. Primero verificar caché y coordenadas existentes en DB
      for (const req of requests) {
        // Verificar DB primero
        const dbResult = await pool.query(
          `
          SELECT lat, lng FROM empresa
          WHERE id = $1 AND lat IS NOT NULL AND lng IS NOT NULL
        `,
          [req.id]
        );

        if (dbResult.rows.length > 0) {
          results.push({
            id: req.id,
            success: true,
            lat: parseFloat(dbResult.rows[0].lat),
            lng: parseFloat(dbResult.rows[0].lng),
            cached: true,
          });
          continue;
        }

        // Verificar caché
        const fullAddress = `${req.address}, ${req.localidad}, ${req.provincia}`;
        const cached = await geocodingCache.get(fullAddress);

        if (cached) {
          results.push({
            id: req.id,
            success: true,
            lat: cached.lat,
            lng: cached.lng,
            cached: true,
          });

          // Guardar en DB de forma asíncrona
          this.saveToDatabase(req.id, cached.lat, cached.lng);
        } else {
          pendingRequests.push(req);
        }
      }

      console.log(
        `📊 Geocodificación batch: ${results.length} desde caché, ${pendingRequests.length} pendientes`
      );

      // 2. Procesar pendientes en lotes
      for (let i = 0; i < pendingRequests.length; i += this.BATCH_SIZE) {
        if (signal.aborted || !this.canMakeRequest()) break;

        const batch = pendingRequests.slice(i, i + this.BATCH_SIZE);

        const batchPromises = batch.map(async (req) => {
          try {
            const fullAddress = `${req.address}, ${req.localidad}, ${req.provincia}`;
            const coords = await this.geocodeSingle(fullAddress, signal);

            if (coords) {
              await this.saveToDatabase(req.id, coords.lat, coords.lng);
              await this.logRequest(req.id, "google_api", true);

              return {
                id: req.id,
                success: true,
                lat: coords.lat,
                lng: coords.lng,
                cached: false,
              };
            } else {
              await this.logRequest(req.id, "google_api", false);
              return {
                id: req.id,
                success: false,
                error: "No se pudo geocodificar",
              };
            }
          } catch (error) {
            return {
              id: req.id,
              success: false,
              error:
                error instanceof Error ? error.message : "Error desconocido",
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Reportar progreso
        if (onProgress) {
          const completed = results.length;
          const total = requests.length;
          onProgress(completed, total);
        }

        // Delay entre lotes
        if (i + this.BATCH_SIZE < pendingRequests.length && !signal.aborted) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.DELAY_BETWEEN_BATCHES)
          );
        }
      }

      return results;
    } finally {
      this.isProcessing = false;
      this.abortController = null;
    }
  }

  private async saveToDatabase(empresaId: number, lat: number, lng: number) {
    try {
      await pool.query(
        `
        UPDATE empresa
        SET lat = $1, lng = $2
        WHERE id = $3
      `,
        [lat, lng, empresaId]
      );

      console.log(`💾 Coordenadas guardadas para empresa ${empresaId}`);
    } catch (error) {
      console.error(
        `Error guardando coordenadas para empresa ${empresaId}:`,
        error
      );
    }
  }

  public cancel() {
    if (this.abortController) {
      this.abortController.abort();
      console.log("🛑 Geocodificación cancelada");
    }
  }

  public async getStats() {
    const cacheStats = await geocodingCache.getStats();

    return {
      ...cacheStats,
      dailyRequests: this.requestCount,
      dailyLimit: this.MAX_REQUESTS_PER_DAY,
      remainingRequests: Math.max(
        0,
        this.MAX_REQUESTS_PER_DAY - this.requestCount
      ),
      canMakeRequests: this.canMakeRequest(),
    };
  }

  public async prefetchArea(
    provincia: string,
    localidad?: string,
    limit: number = 20
  ): Promise<number> {
    // Pre-cargar empresas de un área específica
    try {
      let query = `
        SELECT id, direccion, provincia, localidad
        FROM empresa
        WHERE lat IS NULL AND lng IS NULL
        AND provincia = $1
      `;

      const params: (string | number)[] = [provincia];

      if (localidad) {
        query += ` AND localidad = $2`;
        params.push(localidad);
      }

      query += ` LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await pool.query(query, params);

      if (result.rows.length > 0) {
        const requests = result.rows.map((row) => ({
          id: row.id,
          address: row.direccion,
          provincia: row.provincia,
          localidad: row.localidad,
        }));

        await this.geocodeBatch(requests);
        return result.rows.length;
      }

      return 0;
    } catch (error) {
      console.error("Error en prefetch:", error);
      return 0;
    }
  }
}

// Singleton
export const batchGeocodingService = new BatchGeocodingService();
