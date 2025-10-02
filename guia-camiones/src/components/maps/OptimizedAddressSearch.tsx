// src/components/maps/OptimizedAddressSearch.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { MapPin, Search, Navigation, X, Loader2 } from "lucide-react";

interface AddressSearchProps {
  onLocationSelect: (coords: {
    lat: number;
    lng: number;
    address: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

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

  // Referencias para optimización
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

  // Inicializar servicios de Google
  useEffect(() => {
    if (typeof google !== "undefined" && google.maps) {
      autocompleteService.current =
        new google.maps.places.AutocompleteService();
      const div = document.createElement("div");
      placesService.current = new google.maps.places.PlacesService(div);
      sessionToken.current = new google.maps.places.AutocompleteSessionToken();

      console.log("✅ Servicios de Google Maps inicializados");
    }
  }, []);

  // Función para obtener detalles de un lugar (consume 1 sesión)
  const getPlaceDetails = useCallback(
    (placeId: string, description: string) => {
      if (!placesService.current) return;

      setIsLoading(true);
      setError(null);

      // Construir request con manejo correcto del sessionToken
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId,
        fields: ["geometry", "formatted_address"],
      };

      // Agregar sessionToken solo si existe
      if (sessionToken.current) {
        request.sessionToken = sessionToken.current;
      }

      placesService.current.getDetails(request, (place, status) => {
        setIsLoading(false);

        if (status === "OK" && place?.geometry?.location) {
          const coords = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address || description,
          };

          // Resetear el token de sesión (importante para el billing)
          sessionToken.current =
            new google.maps.places.AutocompleteSessionToken();

          onLocationSelect(coords);
          setQuery(coords.address);
          setShowSuggestions(false);
          setSuggestions([]);

          console.log("📍 Lugar seleccionado:", coords);
        } else {
          setError("No se pudo obtener la ubicación");
        }
      });
    },
    [onLocationSelect]
  );

  // Búsqueda con debounce y caché
  const searchPlaces = useCallback((input: string) => {
    if (!input || !autocompleteService.current || input.length < 3) {
      setSuggestions([]);
      return;
    }

    // Verificar caché primero
    const cached = searchCache.current.get(input.toLowerCase());
    if (cached) {
      console.log("💾 Sugerencias desde caché:", input);
      setSuggestions(cached);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Construir request
    const request: google.maps.places.AutocompletionRequest = {
      input,
      componentRestrictions: { country: "ar" }, // Restringir a Argentina
      types: ["geocode", "establishment"], // Solo direcciones y lugares
      bounds: new google.maps.LatLngBounds(
        new google.maps.LatLng(-55.0, -73.5), // Sur-Oeste Argentina
        new google.maps.LatLng(-22.0, -53.5) // Norte-Este Argentina
      ),
    };

    // Agregar sessionToken solo si existe
    if (sessionToken.current) {
      request.sessionToken = sessionToken.current;
    }

    autocompleteService.current.getPlacePredictions(
      request,
      (predictions, status) => {
        setIsLoading(false);

        if (status === "OK" && predictions) {
          // Limitar a 5 sugerencias para reducir costo
          const limitedPredictions = predictions.slice(0, 5);
          setSuggestions(limitedPredictions);

          // Guardar en caché
          searchCache.current.set(input.toLowerCase(), limitedPredictions);

          // Limpiar caché antigua si es muy grande
          if (searchCache.current.size > 50) {
            const firstKey = searchCache.current.keys().next().value;
            if (firstKey) {
              searchCache.current.delete(firstKey);
            }
          }

          console.log(
            `🔍 ${limitedPredictions.length} sugerencias encontradas`
          );
        } else if (status === "ZERO_RESULTS") {
          setSuggestions([]);
          setError("No se encontraron resultados");
        } else {
          setSuggestions([]);
          setError("Error buscando direcciones");
        }
      }
    );
  }, []);

  // Debounce para la búsqueda
  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value);
      setSelectedIndex(-1);

      if (value.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setShowSuggestions(true);

      // Cancelar búsqueda anterior
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Esperar 300ms antes de buscar (reduce llamadas a la API)
      debounceTimer.current = setTimeout(() => {
        searchPlaces(value);
      }, 300);
    },
    [searchPlaces]
  );

  // Geolocalización del usuario
  const handleGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización");
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

        // Geocodificación inversa para obtener la dirección
        try {
          const geocoder = new google.maps.Geocoder();
          const response = await geocoder.geocode({ location: coords });

          if (response.results[0]) {
            onLocationSelect({
              ...coords,
              address: response.results[0].formatted_address,
            });
            setQuery(response.results[0].formatted_address);
            console.log("📍 Ubicación actual obtenida");
          }
        } catch (error) {
          console.error("Error en geocodificación inversa:", error);
          onLocationSelect({ ...coords, address: "Mi ubicación" });
        }

        setGeolocating(false);
      },
      (error) => {
        setGeolocating(false);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError("Permiso de ubicación denegado");
            break;
          case error.POSITION_UNAVAILABLE:
            setError("Ubicación no disponible");
            break;
          case error.TIMEOUT:
            setError("Tiempo de espera agotado");
            break;
          default:
            setError("Error obteniendo ubicación");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [onLocationSelect]);

  // Navegación con teclado
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

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-2">
        {/* Input de búsqueda */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length >= 3 && setShowSuggestions(true)}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Buscar dirección"
            role="combobox"
            aria-autocomplete="list"
            aria-controls="address-suggestions"
            aria-expanded={showSuggestions}
          />

          {/* Icono de búsqueda */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {/* Botón limpiar */}
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                setShowSuggestions(false);
                setError(null);
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Botón de geolocalización */}
        <button
          onClick={handleGeolocation}
          disabled={geolocating}
          className={`px-4 py-3 rounded-lg font-medium transition-colors ${
            geolocating
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
          title="Usar mi ubicación actual"
          aria-label="Usar mi ubicación actual"
        >
          {geolocating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Navigation className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="absolute mt-2 w-full bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 z-40">
          {error}
        </div>
      )}

      {/* Lista de sugerencias */}
      {showSuggestions && suggestions.length > 0 && (
        <ul
          id="address-suggestions"
          className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          role="listbox"
        >
          {suggestions.map((suggestion, index) => {
            const parts = suggestion.structured_formatting;
            return (
              <li
                key={suggestion.place_id}
                role="option"
                aria-selected={selectedIndex === index}
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

      {/* Información de uso */}
      <div className="mt-2 text-xs text-gray-500">
        💡 Tip: Escribe al menos 3 caracteres para ver sugerencias o usa el
        botón de ubicación
      </div>
    </div>
  );
}
