// src/lib/geocoding/ClientGeocodingService.ts
// ⚠️ IMPORTANTE: Este archivo NO debe importar 'pg' ni 'pool' ni nada del servidor

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

interface ApiStats {
  dailyRequests: number;
  dailyLimit: number;
  remainingRequests: number;
  memoryCacheSize: number;
  dbCacheSize: number;
  canMakeRequests: boolean;
  hitRate?: number;
}

/**
 * Servicio de geocodificación para el lado del cliente
 * NO importa módulos de Node.js, solo usa APIs y Google Maps
 */
export class ClientGeocodingService {
  private readonly MAX_REQUESTS_PER_DAY = 2500;
  private readonly BATCH_SIZE = 5;
  private readonly DELAY_BETWEEN_BATCHES = 1200;

  private geocoder: google.maps.Geocoder | null = null;
  private isProcessing = false;
  private abortController: AbortController | null = null;
  private localCache = new Map<
    string,
    { lat: number; lng: number; timestamp: number }
  >();

  constructor() {
    this.initGeocoder();
  }

  private async initGeocoder() {
    // Esperar a que Google Maps esté disponible
    if (typeof google !== "undefined" && google.maps) {
      this.geocoder = new google.maps.Geocoder();
    }
  }

  /**
   * Obtiene estadísticas desde la API
   */
  public async getStats(): Promise<ApiStats> {
    try {
      const response = await fetch("/api/geocoding/stats");
      const stats = await response.json();

      // Agregar tamaño del caché local
      stats.memoryCacheSize = this.localCache.size;

      return stats;
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error);
      return {
        dailyRequests: 0,
        dailyLimit: this.MAX_REQUESTS_PER_DAY,
        remainingRequests: this.MAX_REQUESTS_PER_DAY,
        memoryCacheSize: this.localCache.size,
        dbCacheSize: 0,
        canMakeRequests: true,
        hitRate: 0,
      };
    }
  }

  /**
   * Geocodifica una dirección usando Google Maps
   */
  private async geocodeSingleWithGoogle(
    address: string,
    signal?: AbortSignal
  ): Promise<{ lat: number; lng: number } | null> {
    // Verificar caché local primero
    const cacheKey = this.normalizeAddress(address);
    const cached = this.localCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < 2 * 60 * 60 * 1000) {
      console.log(`💾 Cache local hit: ${address.substring(0, 30)}...`);
      return { lat: cached.lat, lng: cached.lng };
    }

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
        (results, status) => {
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

            // Guardar en caché local
            this.localCache.set(cacheKey, {
              ...coords,
              timestamp: Date.now(),
            });

            console.log(`✅ Geocodificado: ${address.substring(0, 30)}...`);
            resolve(coords);
          } else if (status === "OVER_QUERY_LIMIT") {
            console.error("⚠️ Límite de API alcanzado");
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

  /**
   * Geocodifica un lote de direcciones
   */
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

    try {
      // 1. Primero consultar el caché del servidor
      const serverCacheResponse = await fetch("/api/geocoding/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests }),
      });

      const serverCacheData = await serverCacheResponse.json();
      const results: GeocodingResult[] = [];
      const pendingRequests: GeocodingRequest[] = [];

      // Separar los que ya están en caché de los pendientes
      for (const result of serverCacheData.results) {
        if (result.cached) {
          results.push(result);
        } else if (result.needsGeocoding) {
          const req = requests.find((r) => r.id === result.id);
          if (req) pendingRequests.push(req);
        } else {
          results.push(result);
        }
      }

      console.log(
        `📊 Geocodificación: ${results.length} desde caché, ${pendingRequests.length} pendientes`
      );

      // 2. Geocodificar los pendientes con Google Maps
      for (let i = 0; i < pendingRequests.length; i += this.BATCH_SIZE) {
        if (signal.aborted) break;

        const batch = pendingRequests.slice(i, i + this.BATCH_SIZE);

        const batchPromises = batch.map(async (req) => {
          try {
            const fullAddress = `${req.address}, ${req.localidad}, ${req.provincia}`;
            const coords = await this.geocodeSingleWithGoogle(
              fullAddress,
              signal
            );

            if (coords) {
              return {
                id: req.id,
                success: true,
                lat: coords.lat,
                lng: coords.lng,
                address: fullAddress,
                cached: false,
              };
            } else {
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

        // 3. Guardar las coordenadas exitosas en el servidor
        const successfulResults = batchResults.filter((r) => r.success);
        if (successfulResults.length > 0) {
          await fetch("/api/geocoding/batch", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              updates: successfulResults.map((r) => ({
                id: r.id,
                lat: r.lat,
                lng: r.lng,
                address: r.address,
              })),
            }),
          });
        }

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

  /**
   * Cancela la geocodificación en curso
   */
  public cancel() {
    if (this.abortController) {
      this.abortController.abort();
      console.log("🛑 Geocodificación cancelada");
    }
  }

  /**
   * Normaliza una dirección para usar como clave de caché
   */
  private normalizeAddress(address: string): string {
    return address
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[,\.\-]/g, "")
      .replace(/argentina$/i, "")
      .trim();
  }
}

// Singleton para usar en toda la aplicación
export const clientGeocodingService = new ClientGeocodingService();
