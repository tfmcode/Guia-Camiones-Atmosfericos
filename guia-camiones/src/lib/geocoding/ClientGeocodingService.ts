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
    if (
      typeof window !== "undefined" &&
      typeof google !== "undefined" &&
      google.maps
    ) {
      this.geocoder = new google.maps.Geocoder();
      console.log("✅ Geocoder inicializado");
    }
  }

  public async getStats(): Promise<ApiStats> {
    try {
      const response = await fetch("/api/geocoding/stats");

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      const stats = await response.json();
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

  private async geocodeSingleWithGoogle(
    address: string,
    signal?: AbortSignal
  ): Promise<{ lat: number; lng: number } | null> {
    const cacheKey = this.normalizeAddress(address);
    const cached = this.localCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < 2 * 60 * 60 * 1000) {
      console.log(`Cache local: ${address.substring(0, 30)}...`);
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
          componentRestrictions: {
            country: "AR",
          },
        },
        (results, status) => {
          clearTimeout(timeoutId);

          if (signal?.aborted) {
            reject(new Error("Geocodificación cancelada"));
            return;
          }

          if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
            const location = results[0].geometry.location;
            const coords = {
              lat: location.lat(),
              lng: location.lng(),
            };

            this.localCache.set(cacheKey, {
              ...coords,
              timestamp: Date.now(),
            });

            console.log(`Geocodificado: ${address.substring(0, 30)}...`);
            resolve(coords);
          } else if (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
            console.error("Límite de API alcanzado");
            reject(new Error("Límite de API alcanzado"));
          } else if (status === google.maps.GeocoderStatus.ZERO_RESULTS) {
            console.warn(`Sin resultados: ${address}`);
            resolve(null);
          } else if (status === google.maps.GeocoderStatus.REQUEST_DENIED) {
            console.error("API no habilitada o clave inválida");
            reject(new Error("Geocoding API no habilitada"));
          } else {
            console.error(`Error geocodificando (${status}): ${address}`);
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

    if (!requests || requests.length === 0) {
      console.warn("No hay direcciones para geocodificar");
      return [];
    }

    this.isProcessing = true;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    try {
      const serverCacheResponse = await fetch("/api/geocoding/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests }),
      });

      if (!serverCacheResponse.ok) {
        const errorText = await serverCacheResponse.text();
        console.error(
          `Error del servidor (${serverCacheResponse.status}):`,
          errorText
        );
        throw new Error(`Error en API: ${serverCacheResponse.status}`);
      }

      const serverCacheData = await serverCacheResponse.json();

      if (!serverCacheData || typeof serverCacheData !== "object") {
        console.error("Respuesta inválida:", serverCacheData);
        throw new Error("Formato de respuesta inválido");
      }

      if (!Array.isArray(serverCacheData.results)) {
        console.error("results no es un array:", serverCacheData);
        throw new Error("El servidor no devolvió un array válido");
      }

      const results: GeocodingResult[] = [];
      const pendingRequests: GeocodingRequest[] = [];

      for (const result of serverCacheData.results) {
        if (!result || typeof result !== "object") {
          console.warn("Resultado inválido:", result);
          continue;
        }

        if (result.cached && result.success) {
          results.push(result);
        } else if (result.needsGeocoding) {
          const req = requests.find((r) => r.id === result.id);
          if (req) {
            pendingRequests.push(req);
          }
        } else {
          results.push(result);
        }
      }

      console.log(
        `Geocodificación: ${results.length} en caché, ${pendingRequests.length} pendientes`
      );

      if (pendingRequests.length > 0) {
        for (let i = 0; i < pendingRequests.length; i += this.BATCH_SIZE) {
          if (signal.aborted) {
            console.log("Geocodificación cancelada");
            break;
          }

          const batch = pendingRequests.slice(i, i + this.BATCH_SIZE);

          const batchPromises = batch.map(async (req) => {
            try {
              const addressParts = [req.address];
              if (req.localidad) addressParts.push(req.localidad);
              if (req.provincia) addressParts.push(req.provincia);
              const fullAddress = addressParts.join(", ");

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
                  error: "No se encontraron coordenadas",
                };
              }
            } catch (error) {
              console.error(`Error geocodificando empresa ${req.id}:`, error);
              return {
                id: req.id,
                success: false,
                error:
                  error instanceof Error ? error.message : "Error desconocido",
              };
            }
          });

          const batchResults = await Promise.all(batchPromises);

          const successfulResults = batchResults.filter(
            (r) => r.success && r.lat && r.lng
          );

          if (successfulResults.length > 0) {
            try {
              const saveResponse = await fetch("/api/geocoding/batch", {
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

              if (!saveResponse.ok) {
                console.error(
                  "Error guardando resultados:",
                  saveResponse.status
                );
              }
            } catch (error) {
              console.error("Error guardando en el servidor:", error);
            }
          }

          results.push(...batchResults);

          if (onProgress) {
            onProgress(results.length, requests.length);
          }

          if (i + this.BATCH_SIZE < pendingRequests.length && !signal.aborted) {
            await new Promise((resolve) =>
              setTimeout(resolve, this.DELAY_BETWEEN_BATCHES)
            );
          }
        }
      }

      console.log(
        `Completado: ${results.filter((r) => r.success).length}/${
          results.length
        } exitosos`
      );

      return results;
    } catch (error) {
      console.error("Error en geocodeBatch:", error);
      throw error;
    } finally {
      this.isProcessing = false;
      this.abortController = null;
    }
  }

  public cancel() {
    if (this.abortController) {
      this.abortController.abort();
      console.log("Geocodificación cancelada");
    }
  }

  public isGeocoding(): boolean {
    return this.isProcessing;
  }

  public clearCache() {
    this.localCache.clear();
    console.log("Caché local limpiado");
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
}

export const clientGeocodingService = new ClientGeocodingService();
