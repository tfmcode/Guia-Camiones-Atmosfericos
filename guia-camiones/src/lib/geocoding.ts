// src/lib/geocoding.ts
interface Coordinates {
  lat: number;
  lng: number;
}

interface EmpresaWithCoordinates {
  id: number;
  nombre: string;
  slug: string;
  telefono: string;
  email?: string;
  direccion: string;
  provincia?: string;
  localidad?: string;
  web?: string;
  imagenes: string[];
  destacado: boolean;
  corrientes_de_residuos?: string;
  servicios?: Array<{ id: number; nombre: string }>;
  lat?: number;
  lng?: number;
  distancia?: number;
  distanciaTexto?: string;
}

/**
 * Geocodifica una dirección usando Google Maps Geocoding API
 */
export async function geocodeAddress(
  address: string,
  geocoder: google.maps.Geocoder
): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    geocoder.geocode(
      {
        address: `${address}, Argentina`,
        region: "AR",
      },
      (results, status) => {
        if (status === "OK" && results && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng(),
          });
        } else {
          console.warn(`❌ Geocoding falló para "${address}":`, status);
          resolve(null);
        }
      }
    );
  });
}

/**
 * Geocodifica múltiples direcciones en lotes para evitar límites de rate
 */
export async function geocodeEmpresas(
  empresas: EmpresaWithCoordinates[],
  geocoder: google.maps.Geocoder,
  onProgress?: (completed: number, total: number) => void
): Promise<EmpresaWithCoordinates[]> {
  console.log(`🌍 Iniciando geocodificación de ${empresas.length} empresas...`);

  const BATCH_SIZE = 5; // Procesar de a 5 para evitar rate limits
  const DELAY_BETWEEN_BATCHES = 1000; // 1 segundo entre lotes

  const empresasConCoordenadas: EmpresaWithCoordinates[] = [];

  for (let i = 0; i < empresas.length; i += BATCH_SIZE) {
    const batch = empresas.slice(i, i + BATCH_SIZE);

    const batchPromises = batch.map(async (empresa) => {
      // Si ya tiene coordenadas, no geocodificar
      if (empresa.lat && empresa.lng) {
        return empresa;
      }

      const fullAddress = `${empresa.direccion}, ${empresa.localidad}, ${empresa.provincia}`;
      const coordinates = await geocodeAddress(fullAddress, geocoder);

      if (coordinates) {
        console.log(
          `📍 Geocodificado: ${empresa.nombre} -> ${coordinates.lat}, ${coordinates.lng}`
        );
        return {
          ...empresa,
          lat: coordinates.lat,
          lng: coordinates.lng,
        };
      } else {
        console.warn(
          `⚠️ No se pudo geocodificar: ${empresa.nombre} (${fullAddress})`
        );
        return empresa;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    empresasConCoordenadas.push(...batchResults);

    // Reportar progreso
    if (onProgress) {
      onProgress(empresasConCoordenadas.length, empresas.length);
    }

    // Delay entre lotes si no es el último
    if (i + BATCH_SIZE < empresas.length) {
      await new Promise((resolve) =>
        setTimeout(resolve, DELAY_BETWEEN_BATCHES)
      );
    }
  }

  console.log(
    `✅ Geocodificación completada. ${
      empresasConCoordenadas.filter((e) => e.lat && e.lng).length
    }/${empresas.length} geocodificadas`
  );

  return empresasConCoordenadas;
}

/**
 * Calcula la distancia entre dos puntos usando la fórmula Haversine
 */
export function calculateDistance(
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
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Redondear a 2 decimales
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Formatea la distancia para mostrar al usuario
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`;
  } else {
    return `${Math.round(distanceKm)}km`;
  }
}

/**
 * Calcula distancias desde un punto de origen y ordena las empresas
 */
export function calculateDistancesAndSort(
  empresas: EmpresaWithCoordinates[],
  origin: Coordinates
): EmpresaWithCoordinates[] {
  console.log(`📏 Calculando distancias desde ${origin.lat}, ${origin.lng}...`);

  const empresasConDistancia = empresas
    .map((empresa) => {
      if (empresa.lat && empresa.lng) {
        const distancia = calculateDistance(
          origin.lat,
          origin.lng,
          empresa.lat,
          empresa.lng
        );

        return {
          ...empresa,
          distancia,
          distanciaTexto: formatDistance(distancia),
        };
      }
      return empresa;
    })
    .filter((empresa) => empresa.distancia !== undefined) // Solo empresas con coordenadas
    .sort((a, b) => {
      // Primero las destacadas, luego por distancia
      if (a.destacado && !b.destacado) return -1;
      if (!a.destacado && b.destacado) return 1;
      return (a.distancia || 0) - (b.distancia || 0);
    });

  console.log(
    `✅ ${empresasConDistancia.length} empresas ordenadas por distancia`
  );

  return empresasConDistancia;
}

/**
 * Obtiene la ubicación actual del usuario
 */
export function getCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalización no soportada"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        let message = "Error obteniendo ubicación";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Permiso de ubicación denegado";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Ubicación no disponible";
            break;
          case error.TIMEOUT:
            message = "Tiempo de espera agotado";
            break;
        }

        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutos
      }
    );
  });
}

/**
 * Iconos SVG para camiones en el mapa
 */
export const TRUCK_ICON_SVG = {
  destacado: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#FFD700">
    <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
  </svg>`,

  normal: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#2563EB">
    <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
  </svg>`,
};

export function createTruckIcon(destacado: boolean): string {
  const svg = destacado ? TRUCK_ICON_SVG.destacado : TRUCK_ICON_SVG.normal;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
