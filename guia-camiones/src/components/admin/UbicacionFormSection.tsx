"use client";

import { MapPin, Info } from "lucide-react";
import OptimizedAddressSearch from "@/components/maps/OptimizedAddressSearch";

interface UbicacionFormSectionProps {
  direccion: string;
  provincia: string | undefined;
  localidad: string | undefined;
  lat: number | null | undefined;
  lng: number | null | undefined;
  onLocationSelect: (coords: {
    address: string;
    lat: number;
    lng: number;
    provincia: string;
    localidad: string;
  }) => void;
}

export default function UbicacionFormSection({
  direccion,
  provincia,
  localidad,
  lat,
  lng,
  onLocationSelect,
}: UbicacionFormSectionProps) {
  return (
    <div className="space-y-4 bg-gray-50 rounded-xl p-6 border border-gray-200">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
          <MapPin size={16} className="text-white" />
        </div>
        <div>
          <label className="block text-lg font-semibold text-gray-900">
            Ubicación
          </label>
          <p className="text-sm text-gray-600">
            Busca la dirección completa para obtener coordenadas y ubicación
            automáticamente
          </p>
        </div>
      </div>

      {/* ✅ ÚNICO INPUT: Buscador de Google Maps */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Buscar dirección con Google Maps
        </label>
        <OptimizedAddressSearch
          onLocationSelect={onLocationSelect}
          placeholder="Buscar dirección exacta (ej: Av. Corrientes 1234, CABA)"
        />
        <p className="text-xs text-gray-500 mt-1">
          💡 Selecciona una dirección de la lista. La provincia, localidad y
          coordenadas se completarán automáticamente.
        </p>
      </div>

      {/* ✅ INFORMACIÓN READ-ONLY: Mostrar datos extraídos */}
      {direccion && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Info size={16} className="text-blue-500" />
            Datos extraídos de Google Maps
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600 block mb-1">📍 Dirección:</span>
              <span className="font-medium text-gray-900">{direccion}</span>
            </div>

            <div>
              <span className="text-gray-600 block mb-1">🗺️ Provincia:</span>
              <span className="font-medium text-gray-900">
                {provincia || (
                  <span className="text-red-500">No detectada</span>
                )}
              </span>
            </div>

            <div>
              <span className="text-gray-600 block mb-1">🏙️ Localidad:</span>
              <span className="font-medium text-gray-900">
                {localidad || (
                  <span className="text-red-500">No detectada</span>
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Indicador de geocodificación */}
      {lat && lng && typeof lat === "number" && typeof lng === "number" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900 mb-1">
                ✅ Dirección geocodificada correctamente
              </p>
              <p className="text-xs text-green-700 font-mono">
                Coordenadas: {lat.toFixed(6)}, {lng.toFixed(6)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Esta empresa aparecerá en el mapa de búsqueda por proximidad
              </p>
            </div>
          </div>
        </div>
      )}

      {!lat && !lng && direccion && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900 mb-1">
                ⚠️ Dirección sin geocodificar
              </p>
              <p className="text-xs text-amber-700">
                Usa el buscador de Google Maps para obtener las coordenadas
                exactas
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
