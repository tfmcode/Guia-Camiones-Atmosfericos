// src/hooks/useGoogleMaps.ts
import { useState, useEffect, useCallback } from "react";

interface UseGoogleMapsOptions {
  libraries?: string[];
  region?: string;
  language?: string;
}

interface UseGoogleMapsReturn {
  isLoaded: boolean;
  loadError: string | null;
  google: typeof google | null;
}

// Extender la interfaz Window para evitar usar 'any'
declare global {
  interface Window {
    [key: string]: unknown;
  }
}

export const useGoogleMaps = (
  options: UseGoogleMapsOptions = {}
): UseGoogleMapsReturn => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    libraries = ["places", "geometry"],
    region = "AR",
    language = "es",
  } = options;

  const loadGoogleMaps = useCallback(() => {
    // Si ya está cargado
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    // Si ya hay un script cargándose
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setLoadError(
        "Google Maps API key no está configurada. Agregá NEXT_PUBLIC_GOOGLE_MAPS_API_KEY a tu .env.local"
      );
      return;
    }

    // Crear función de callback global
    const callbackName = `initGoogleMaps${Date.now()}`;

    // Función de callback tipada
    const initCallback = () => {
      setIsLoaded(true);
      setLoadError(null);
      delete window[callbackName];
    };

    // Asignar callback al objeto window
    window[callbackName] = initCallback;

    // Crear script
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: apiKey,
      libraries: libraries.join(","),
      callback: callbackName,
      region,
      language,
      v: "weekly",
    });

    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      setLoadError(
        "Error al cargar Google Maps API. Verifica tu API key y que las APIs estén habilitadas."
      );
      delete window[callbackName];
    };

    document.head.appendChild(script);
  }, [libraries, region, language]);

  useEffect(() => {
    loadGoogleMaps();
  }, [loadGoogleMaps]);

  return {
    isLoaded,
    loadError,
    google: isLoaded ? window.google : null,
  };
};
