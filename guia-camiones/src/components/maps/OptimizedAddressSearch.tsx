// src/components/maps/OptimizedAddressSearch.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  MapPin,
  Search,
  Navigation,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface AddressSearchProps {
  onLocationSelect: (coords: {
    lat: number;
    lng: number;
    address: string;
    provincia: string;
    localidad: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

// ✅ BARRIOS DE CABA para detección automática
const BARRIOS_CABA = [
  "Palermo",
  "Recoleta",
  "Belgrano",
  "Caballito",
  "Villa Urquiza",
  "Villa Crespo",
  "Almagro",
  "Flores",
  "San Telmo",
  "La Boca",
  "Puerto Madero",
  "Retiro",
  "Constitución",
  "San Nicolás",
  "Montserrat",
  "Balvanera",
  "San Cristóbal",
  "Boedo",
  "Parque Patricios",
  "Nueva Pompeya",
  "Barracas",
  "Liniers",
  "Mataderos",
  "Parque Chacabuco",
  "Villa Soldati",
  "Villa Riachuelo",
  "Villa Lugano",
  "Versalles",
  "Villa Luro",
  "Vélez Sarsfield",
  "Floresta",
  "Monte Castro",
  "Villa Real",
  "Villa Devoto",
  "Villa del Parque",
  "Villa Santa Rita",
  "Coghlan",
  "Saavedra",
  "Villa Pueyrredón",
  "Villa General Mitre",
  "Agronomía",
  "Parque Chas",
  "Paternal",
  "Chacarita",
  "Villa Ortúzar",
  "Colegiales",
  "Núñez",
];

export default function OptimizedAddressSearch({
  onLocationSelect,
  placeholder = "Buscar dirección o usar tu ubicación",
  className = "",
}: AddressSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [geolocating, setGeolocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleReady, setIsGoogleReady] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteService =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const sessionToken =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const searchCache = useRef<
    Map<string, google.maps.places.AutocompletePrediction[]>
  >(new Map());

  // ✅ FUNCIÓN DE NORMALIZACIÓN: Detectar si Buenos Aires es CABA o Provincia
  const normalizarUbicacion = (
    provincia: string,
    localidad: string
  ): { provincia: string; localidad: string } => {
    // Si NO es "Buenos Aires", devolver tal cual
    if (provincia !== "Buenos Aires") {
      return { provincia, localidad };
    }

    // Si es "Buenos Aires", detectar si es CABA o Provincia

    // 1. Si la localidad empieza con "Comuna" → es CABA
    if (localidad.startsWith("Comuna")) {
      return {
        provincia: "Ciudad Autónoma de Buenos Aires",
        localidad: localidad,
      };
    }

    // 2. Si la localidad es un barrio conocido de CABA → es CABA
    if (BARRIOS_CABA.includes(localidad)) {
      return {
        provincia: "Ciudad Autónoma de Buenos Aires",
        localidad: localidad,
      };
    }

    // 3. Si dice "Ciudad Autónoma de Buenos Aires" en la localidad → es CABA
    if (
      localidad.includes("Ciudad Autónoma") ||
      localidad.includes("CABA") ||
      localidad.includes("Capital Federal")
    ) {
      return {
        provincia: "Ciudad Autónoma de Buenos Aires",
        localidad: localidad
          .replace(/Ciudad Autónoma de Buenos Aires,?\s*/gi, "")
          .trim(),
      };
    }

    // 4. Si no es ninguna de las anteriores → es Provincia de Buenos Aires
    return {
      provincia: "Buenos Aires",
      localidad: localidad,
    };
  };

  // ✅ FUNCIÓN: Extraer provincia y localidad de address_components
  const extractLocationData = (
    addressComponents: google.maps.GeocoderAddressComponent[]
  ): { provincia: string; localidad: string } => {
    let provincia = "";
    let localidad = "";

    for (const component of addressComponents) {
      const types = component.types;

      // Provincia - administrative_area_level_1
      if (types.includes("administrative_area_level_1")) {
        provincia = component.long_name;
      }

      // Localidad - priorizar locality, luego administrative_area_level_2
      if (types.includes("locality")) {
        localidad = component.long_name;
      } else if (types.includes("administrative_area_level_2") && !localidad) {
        localidad = component.long_name;
      }

      // Para CABA, buscar el barrio
      if (
        types.includes("sublocality") ||
        types.includes("sublocality_level_1")
      ) {
        if (
          provincia === "Ciudad Autónoma de Buenos Aires" ||
          provincia === "Buenos Aires"
        ) {
          localidad = component.long_name;
        }
      }
    }

    console.log("📍 Datos extraídos de Google Maps (RAW):", {
      provincia,
      localidad,
    });

    // ✅ NORMALIZAR para que coincida con georef.gob.ar
    const normalizado = normalizarUbicacion(provincia, localidad);

    console.log("🔄 Datos normalizados para georef:", normalizado);

    return normalizado;
  };

  // Verificar si Google Maps está disponible
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (
        typeof window !== "undefined" &&
        typeof google !== "undefined" &&
        google.maps &&
        google.maps.places
      ) {
        console.log("✅ Google Maps está listo");
        setIsGoogleReady(true);
        return true;
      }
      return false;
    };

    if (checkGoogleMaps()) return;

    const interval = setInterval(() => {
      if (checkGoogleMaps()) {
        clearInterval(interval);
      }
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!isGoogleReady) {
        setError(
          "Error cargando Google Maps. Verifica que las APIs estén habilitadas."
        );
        console.error("❌ Google Maps no se cargó correctamente");
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isGoogleReady]);

  // Inicializar servicios de Google Maps
  useEffect(() => {
    if (!isGoogleReady || autocompleteService.current) return;

    try {
      autocompleteService.current =
        new google.maps.places.AutocompleteService();
      const div = document.createElement("div");
      placesService.current = new google.maps.places.PlacesService(div);
      sessionToken.current = new google.maps.places.AutocompleteSessionToken();
      console.log("✅ Servicios de Google Maps inicializados");
    } catch (error) {
      console.error("❌ Error inicializando servicios:", error);
      setError(
        "Error inicializando Google Maps. Verifica la configuración de tu API."
      );
    }
  }, [isGoogleReady]);

  // Obtener detalles de un lugar CON address_components
  const getPlaceDetails = useCallback(
    (placeId: string, description: string) => {
      if (!placesService.current || !isGoogleReady) {
        setError("Servicios de Google Maps no disponibles");
        return;
      }

      setIsLoading(true);
      setError(null);

      const request: google.maps.places.PlaceDetailsRequest = {
        placeId,
        fields: ["geometry", "formatted_address", "address_components"],
      };

      if (sessionToken.current) {
        request.sessionToken = sessionToken.current;
      }

      placesService.current.getDetails(request, (place, status) => {
        setIsLoading(false);

        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          place?.geometry?.location &&
          place?.address_components
        ) {
          // ✅ Extraer provincia y localidad NORMALIZADOS
          const { provincia, localidad } = extractLocationData(
            place.address_components
          );

          const coords = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address || description,
            provincia,
            localidad,
          };

          sessionToken.current =
            new google.maps.places.AutocompleteSessionToken();
          onLocationSelect(coords);
          setQuery(coords.address);
          setShowSuggestions(false);
          setSuggestions([]);
          console.log("📍 Lugar seleccionado:", coords);
        } else {
          console.error("Error obteniendo detalles del lugar:", status);
          setError("No se pudo obtener la ubicación del lugar seleccionado");
        }
      });
    },
    [onLocationSelect, isGoogleReady]
  );

  // Búsqueda con debounce y caché
  const searchPlaces = useCallback(
    (input: string) => {
      if (
        !input ||
        !autocompleteService.current ||
        input.length < 3 ||
        !isGoogleReady
      ) {
        setSuggestions([]);
        return;
      }

      const cached = searchCache.current.get(input.toLowerCase());
      if (cached) {
        console.log("💾 Usando resultados en caché");
        setSuggestions(cached);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const request: google.maps.places.AutocompletionRequest = {
        input,
        componentRestrictions: { country: "ar" },
        types: ["geocode", "establishment"],
        locationBias: {
          center: new google.maps.LatLng(-34.603722, -58.381592),
          radius: 50000,
        },
      };

      if (sessionToken.current) {
        request.sessionToken = sessionToken.current;
      }

      autocompleteService.current.getPlacePredictions(
        request,
        (predictions, status) => {
          setIsLoading(false);

          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            const limitedPredictions = predictions.slice(0, 5);
            setSuggestions(limitedPredictions);
            searchCache.current.set(input.toLowerCase(), limitedPredictions);

            if (searchCache.current.size > 50) {
              const firstKey = searchCache.current.keys().next().value;
              if (firstKey) searchCache.current.delete(firstKey);
            }

            console.log(
              `🔍 ${limitedPredictions.length} sugerencias encontradas`
            );
          } else if (
            status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS
          ) {
            setSuggestions([]);
            setError("No se encontraron resultados para tu búsqueda");
          } else if (
            status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED
          ) {
            setSuggestions([]);
            setError(
              "API no habilitada. Ve a Google Cloud Console y habilita Places API (Legacy)"
            );
            console.error(
              "❌ Places API no habilitada. Habilita en: https://console.cloud.google.com/apis/library/places-backend.googleapis.com"
            );
          } else {
            setSuggestions([]);
            setError("Error al buscar direcciones");
            console.error("Error en búsqueda:", status);
          }
        }
      );
    },
    [isGoogleReady]
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value);
      setSelectedIndex(-1);

      if (value.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        setError(null);
        return;
      }

      setShowSuggestions(true);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        searchPlaces(value);
      }, 300);
    },
    [searchPlaces]
  );

  // Geolocalización con extracción de provincia/localidad
  const handleGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización");
      return;
    }

    if (!isGoogleReady) {
      setError("Google Maps aún no está listo");
      return;
    }

    setGeolocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        try {
          const geocoder = new google.maps.Geocoder();
          const response = await geocoder.geocode({ location: coords });

          if (response.results[0]) {
            const result = response.results[0];
            const address = result.formatted_address;

            // ✅ Extraer provincia y localidad NORMALIZADOS
            const { provincia, localidad } = extractLocationData(
              result.address_components
            );

            onLocationSelect({ ...coords, address, provincia, localidad });
            setQuery(address);
            console.log(
              "📍 Ubicación actual obtenida con provincia y localidad normalizadas"
            );
          } else {
            onLocationSelect({
              ...coords,
              address: "Mi ubicación",
              provincia: "",
              localidad: "",
            });
          }
        } catch (error) {
          console.error("Error en geocodificación inversa:", error);
          onLocationSelect({
            ...coords,
            address: "Mi ubicación",
            provincia: "",
            localidad: "",
          });
        }

        setGeolocating(false);
      },
      (error) => {
        setGeolocating(false);
        console.error("Error de geolocalización:", error);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError(
              "Permiso de ubicación denegado. Habilítalo en la configuración del navegador."
            );
            break;
          case error.POSITION_UNAVAILABLE:
            setError("No se pudo determinar tu ubicación");
            break;
          case error.TIMEOUT:
            setError("Tiempo de espera agotado al obtener ubicación");
            break;
          default:
            setError("Error al obtener tu ubicación");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [onLocationSelect, isGoogleReady]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showSuggestions || suggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && suggestions[selectedIndex]) {
            const suggestion = suggestions[selectedIndex];
            getPlaceDetails(suggestion.place_id, suggestion.description);
          }
          break;
        case "Escape":
          setShowSuggestions(false);
          setSelectedIndex(-1);
          break;
      }
    },
    [showSuggestions, suggestions, selectedIndex, getPlaceDetails]
  );

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  if (!isGoogleReady) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              disabled
              value=""
              placeholder="Cargando Google Maps..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          </div>
          <button
            disabled
            className="px-4 py-3 rounded-lg bg-gray-200 text-gray-400 cursor-not-allowed"
          >
            <Navigation className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length >= 3 && setShowSuggestions(true)}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            aria-label="Buscar dirección"
          />

          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {query && (
            <button
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                setShowSuggestions(false);
                setError(null);
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <button
          onClick={handleGeolocation}
          disabled={geolocating}
          className={`px-4 py-3 rounded-lg font-medium transition-all ${
            geolocating
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
          }`}
          title="Usar mi ubicación actual"
          aria-label="Obtener ubicación actual"
        >
          {geolocating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Navigation className="w-5 h-5" />
          )}
        </button>
      </div>

      {error && (
        <div className="absolute mt-2 w-full bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 z-40 flex items-start gap-2 shadow-sm">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => {
            const parts = suggestion.structured_formatting;
            return (
              <li
                key={suggestion.place_id}
                className={`px-4 py-3 cursor-pointer transition-colors ${
                  selectedIndex === index
                    ? "bg-blue-50 text-blue-900"
                    : "hover:bg-gray-50"
                }`}
                onClick={() =>
                  getPlaceDetails(suggestion.place_id, suggestion.description)
                }
              >
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {parts?.main_text || suggestion.description.split(",")[0]}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {parts?.secondary_text || suggestion.description}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-2 text-xs text-gray-500">
        Escribe al menos 3 caracteres para buscar o usa el botón de ubicación
      </div>
    </div>
  );
}
