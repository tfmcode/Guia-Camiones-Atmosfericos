// src/components/maps/AddressSearch.tsx
"use client";

import React, { useRef, useEffect, useState } from "react";
import { Search, MapPin, Crosshair, X } from "lucide-react";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";

interface AddressSearchProps {
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    address: string;
    placeId?: string;
  }) => void;
  onUserLocationRequest: () => void;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
}

export const AddressSearch: React.FC<AddressSearchProps> = ({
  onLocationSelect,
  onUserLocationRequest,
  placeholder = "Buscar dirección...",
  className = "",
  isLoading = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isAutocompleteLoaded, setIsAutocompleteLoaded] = useState(false);

  const { isLoaded, google } = useGoogleMaps({
    libraries: ["places", "geometry"],
  });

  useEffect(() => {
    if (isLoaded && google && inputRef.current && !isAutocompleteLoaded) {
      console.log("🚀 Inicializando Google Places Autocomplete...");

      try {
        // Configurar autocomplete con restricciones para Argentina
        autocompleteRef.current = new google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ["address"],
            componentRestrictions: { country: "ar" },
            fields: [
              "place_id",
              "formatted_address",
              "geometry.location",
              "address_components",
            ],
          }
        );

        // Listener para cuando se selecciona un lugar
        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace();

          if (place && place.geometry && place.geometry.location) {
            const location = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              address: place.formatted_address || "",
              placeId: place.place_id,
            };

            console.log("📍 Lugar seleccionado:", location);
            onLocationSelect(location);
          } else {
            console.warn("⚠️ Lugar seleccionado sin geometría válida");
          }
        });

        setIsAutocompleteLoaded(true);
        console.log("✅ Google Places Autocomplete inicializado");
      } catch (error) {
        console.error("❌ Error inicializando Autocomplete:", error);
      }
    }

    return () => {
      if (autocompleteRef.current) {
        google?.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, google, onLocationSelect, isAutocompleteLoaded]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleClearInput = () => {
    setInputValue("");
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Si el usuario presiona Enter sin seleccionar de la lista,
      // podríamos hacer una búsqueda manual con Geocoder
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input principal */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={20} className="text-gray-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={!isLoaded || isLoading}
          className={`
            w-full pl-12 pr-24 py-4 text-sm
            border border-gray-300 rounded-xl
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            placeholder-gray-500
            ${isLoading ? "bg-gray-50" : "bg-white"}
          `}
        />

        {/* Botones del lado derecho */}
        <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
          {inputValue && (
            <button
              onClick={handleClearInput}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="Limpiar búsqueda"
            >
              <X size={16} />
            </button>
          )}

          <button
            onClick={onUserLocationRequest}
            disabled={isLoading}
            className={`
              p-2 rounded-lg transition-all duration-200
              ${
                isLoading
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              }
            `}
            title="Usar mi ubicación actual"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Crosshair size={16} />
            )}
          </button>
        </div>
      </div>

      {/* Indicador de carga de Google Maps */}
      {!isLoaded && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Cargando búsqueda inteligente...
          </div>
        </div>
      )}

      {/* Consejos de uso */}
      <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
        <MapPin size={12} />
        <span>Escribí tu dirección y seleccioná de las sugerencias</span>
      </div>
    </div>
  );
};
