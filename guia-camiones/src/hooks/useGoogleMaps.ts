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
  geocoder: google.maps.Geocoder | null;
  placesService: google.maps.places.PlacesService | null;
}

declare global {
  interface Window {
    [key: string]: unknown;
    google: typeof google;
  }
}

export const useGoogleMaps = (
  options: UseGoogleMapsOptions = {}
): UseGoogleMapsReturn => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const [placesService, setPlacesService] =
    useState<google.maps.places.PlacesService | null>(null);

  const {
    libraries = ["places", "geometry"],
    region = "AR",
    language = "es",
  } = options;

  const loadGoogleMaps = useCallback(() => {
    if (window.google?.maps) {
      setIsLoaded(true);
      setGeocoder(new window.google.maps.Geocoder());

      // Crear un div temporal para PlacesService
      const div = document.createElement("div");
      setPlacesService(new window.google.maps.places.PlacesService(div));

      return;
    }

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

    const callbackName = `initGoogleMaps${Date.now()}`;

    const initCallback = () => {
      setIsLoaded(true);
      setLoadError(null);
      setGeocoder(new window.google.maps.Geocoder());

      const div = document.createElement("div");
      setPlacesService(new window.google.maps.places.PlacesService(div));

      delete window[callbackName];
    };

    window[callbackName] = initCallback;

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
    geocoder,
    placesService,
  };
};
