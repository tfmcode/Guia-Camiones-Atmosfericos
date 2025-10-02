// src/hooks/useOptimizedGeocoding.ts
import { useState, useCallback, useRef, useEffect } from "react";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";

interface Coordinates {
  lat: number;
  lng: number;
}

interface EmpresaWithCoords {
  id: number;
  nombre: string;
  direccion: string;
  provincia?: string;
  localidad?: string;
  lat?: number;
  lng?: number;
  distancia?: number;
  distanciaTexto?: string;
  destacado: boolean;
}

interface GeocodingState {
  isGeocoding: boolean;
  progress: number;
  error: string | null;
  completed: number;
  total: number;
}

// ✅ Cache local con SessionStorage
const GEOCODING_CACHE_KEY = "geocoding_cache_v1";
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 horas

class GeocodingCache {
  private cache: Map<string, { coords: Coordinates; timestamp: number }> =
    new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = sessionStorage.getItem(GEOCODING_CACHE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.cache = new Map(data);
      }
    } catch (error) {
      console.warn("Error cargando caché de geocodificación:", error);
    }
  }

  private saveToStorage() {
    try {
      sessionStorage.setItem(
        GEOCODING_CACHE_KEY,
        JSON.stringify(Array.from(this.cache.entries()))
      );
    } catch (error) {
      console.warn("Error guardando caché de geocodificación:", error);
    }
  }

  get(address: string): Coordinates | null {
    const key = address.toLowerCase().trim();
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.coords;
    }

    if (cached) {
      this.cache.delete(key); // Limpiar caché expirado
    }

    return null;
  }

  set(address: string, coords: Coordinates) {
    const key = address.toLowerCase().trim();
    this.cache.set(key, { coords, timestamp: Date.now() });
    this.saveToStorage();
  }

  clear() {
    this.cache.clear();
    sessionStorage.removeItem(GEOCODING_CACHE_KEY);
  }
}

// ✅ Instancia singleton del caché
const geocodingCache = new GeocodingCache();

export function useOptimizedGeocoding() {
  const { isLoaded, google } = useGoogleMaps({
    libraries: ["places", "geometry"],
  });
  const [state, setState] = useState<GeocodingState>({
    isGeocoding: false,
    progress: 0,
    error: null,
    completed: 0,
    total: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // ✅ Inicializar geocoder cuando Google Maps esté listo
  useEffect(() => {
    if (isLoaded && google && !geocoderRef.current) {
      geocoderRef.current = new google.maps.Geocoder();
      console.log("✅ [Geocoding] Geocoder inicializado");
    }
  }, [isLoaded, google]);

  // ✅ Función para geocodificar una sola dirección
  const geocodeSingleAddress = useCallback(
    async (
      address: string,
      signal?: AbortSignal
    ): Promise<Coordinates | null> => {
      if (!geocoderRef.current) {
        throw new Error("Geocoder no disponible");
      }

      // ✅ Verificar caché primero
      const cached = geocodingCache.get(address);
      if (cached) {
        console.log(`💾 [Geocoding] Cache hit: ${address}`);
        return cached;
      }

      return new Promise((resolve, reject) => {
        if (signal?.aborted) {
          reject(new Error("Geocodificación cancelada"));
          return;
        }

        const abortListener = () => {
          reject(new Error("Geocodificación cancelada"));
        };

        signal?.addEventListener("abort", abortListener);

        geocoderRef.current!.geocode(
          {
            address: `${address}, Argentina`,
            region: "AR",
          },
          (results, status) => {
            signal?.removeEventListener("abort", abortListener);

            if (signal?.aborted) {
              reject(new Error("Geocodificación cancelada"));
              return;
            }

            if (status === "OK" && results && results[0]) {
              const location = results[0].geometry.location;
              const coords = {
                lat: location.lat(),
                lng: location.lng(),
              };

              // ✅ Guardar en caché
              geocodingCache.set(address, coords);
              console.log(`🌍 [Geocoding] Geocodificado: ${address}`);
              resolve(coords);
            } else {
              console.warn(`❌ [Geocoding] Falló: ${address} - ${status}`);
              resolve(null);
            }
          }
        );
      });
    },
    []
  );

  // ✅ Función principal para geocodificar empresas con optimizaciones
  const geocodeEmpresas = useCallback(
    async (
      empresas: EmpresaWithCoords[],
      userLocation?: Coordinates,
      onProgress?: (progress: number) => void
    ): Promise<EmpresaWithCoords[]> => {
      if (!isLoaded || !geocoderRef.current) {
        throw new Error("Google Maps no está cargado");
      }

      // ✅ Cancelar geocodificación previa
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // ✅ Filtrar empresas que ya tienen coordenadas
      const empresasSinCoords = empresas.filter((e) => !e.lat || !e.lng);
      const empresasConCoords = empresas.filter((e) => e.lat && e.lng);

      console.log(
        `🌍 [Geocoding] Total: ${empresas.length}, Con coords: ${empresasConCoords.length}, Sin coords: ${empresasSinCoords.length}`
      );

      setState({
        isGeocoding: true,
        progress: 0,
        error: null,
        completed: 0,
        total: empresasSinCoords.length,
      });

      const empresasGeocoded: EmpresaWithCoords[] = [...empresasConCoords];

      try {
        // ✅ Procesar en lotes pequeños para evitar rate limits
        const BATCH_SIZE = 3;
        const DELAY_BETWEEN_BATCHES = 800; // 800ms entre lotes

        for (let i = 0; i < empresasSinCoords.length; i += BATCH_SIZE) {
          if (signal.aborted) break;

          const batch = empresasSinCoords.slice(i, i + BATCH_SIZE);
          const batchPromises = batch.map(async (empresa) => {
            try {
              if (signal.aborted) return empresa;

              const fullAddress = `${empresa.direccion}, ${empresa.localidad}, ${empresa.provincia}`;
              const coords = await geocodeSingleAddress(fullAddress, signal);

              if (coords) {
                // ✅ Calcular distancia si tenemos ubicación del usuario
                let distancia: number | undefined;
                let distanciaTexto: string | undefined;

                if (userLocation) {
                  distancia = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    coords.lat,
                    coords.lng
                  );
                  distanciaTexto = formatDistance(distancia);
                }

                // ✅ Guardar coordenadas en la base de datos de forma asíncrona
                saveCoordsToDatabase(empresa.id, coords.lat, coords.lng);

                return {
                  ...empresa,
                  lat: coords.lat,
                  lng: coords.lng,
                  distancia,
                  distanciaTexto,
                };
              }

              return empresa;
            } catch (error) {
              console.warn(
                `⚠️ [Geocoding] Error geocodificando ${empresa.nombre}:`,
                error
              );
              return empresa;
            }
          });

          const batchResults = await Promise.all(batchPromises);
          empresasGeocoded.push(...batchResults);

          // ✅ Actualizar progreso
          const completed = Math.min(i + BATCH_SIZE, empresasSinCoords.length);
          const progress = (completed / empresasSinCoords.length) * 100;

          setState((prev) => ({
            ...prev,
            progress,
            completed,
          }));

          onProgress?.(progress);

          // ✅ Delay entre lotes si no es el último
          if (i + BATCH_SIZE < empresasSinCoords.length && !signal.aborted) {
            await new Promise((resolve) =>
              setTimeout(resolve, DELAY_BETWEEN_BATCHES)
            );
          }
        }

        // ✅ Ordenar por distancia si tenemos ubicación del usuario
        let finalResults = empresasGeocoded;
        if (userLocation) {
          finalResults = empresasGeocoded
            .filter((e) => e.lat && e.lng) // Solo empresas geocodificadas
            .sort((a, b) => {
              // Destacadas primero
              if (a.destacado && !b.destacado) return -1;
              if (!a.destacado && b.destacado) return 1;

              // Luego por distancia
              return (a.distancia || Infinity) - (b.distancia || Infinity);
            });
        }

        setState((prev) => ({
          ...prev,
          isGeocoding: false,
          progress: 100,
        }));

        return finalResults;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isGeocoding: false,
          error: error instanceof Error ? error.message : "Error desconocido",
        }));
        throw error;
      }
    },
    [isLoaded, geocodeSingleAddress]
  );

  // ✅ Función para cancelar geocodificación
  const cancelGeocoding = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState((prev) => ({
        ...prev,
        isGeocoding: false,
        error: "Geocodificación cancelada",
      }));
    }
  }, []);

  // ✅ Función para limpiar caché
  const clearCache = useCallback(() => {
    geocodingCache.clear();
    console.log("🗑️ [Geocoding] Caché limpiado");
  }, []);

  return {
    geocodeEmpresas,
    geocodeSingleAddress,
    cancelGeocoding,
    clearCache,
    ...state,
    isReady: isLoaded && !!geocoderRef.current,
  };
}

// ✅ Funciones auxiliares
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`;
  } else {
    return `${Math.round(distanceKm)}km`;
  }
}

// ✅ Función para guardar coordenadas de forma asíncrona
async function saveCoordsToDatabase(id: number, lat: number, lng: number) {
  try {
    await fetch("/api/geocoding/batch", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        updates: [{ id, lat, lng }],
      }),
    });
  } catch (error) {
    console.warn("⚠️ Error guardando coordenadas en DB:", error);
  }
}
