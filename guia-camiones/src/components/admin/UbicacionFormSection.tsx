// src/components/admin/UbicacionFormSection.tsx
"use client";

import { MapPin } from "lucide-react";
import OptimizedAddressSearch from "@/components/maps/OptimizedAddressSearch";
import { esCaba } from "@/constants/barrios";

interface UbicacionFormSectionProps {
  direccion: string;
  provincia: string | undefined;
  localidad: string | undefined;
  lat: number | null | undefined;
  lng: number | null | undefined;
  provincias: { id: string; nombre: string }[];
  localidades: { id: string; nombre: string }[];
  onDireccionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onProvinciaChange: (provincia: string) => void;
  onLocalidadChange: (localidad: string) => void;
  onLocationSelect: (coords: {
    address: string;
    lat: number;
    lng: number;
  }) => void;
}

export default function UbicacionFormSection({
  direccion,
  provincia,
  localidad,
  lat,
  lng,
  provincias,
  localidades,
  onDireccionChange,
  onProvinciaChange,
  onLocalidadChange,
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
            Geocodifica la dirección para que aparezca en el mapa
          </p>
        </div>
      </div>

      {/* Buscador de direcciones */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Buscar y seleccionar dirección con Google Maps
        </label>
        <OptimizedAddressSearch
          onLocationSelect={onLocationSelect}
          placeholder="Buscar dirección exacta (ej: Av. Corrientes 1234, CABA)"
        />
        <p className="text-xs text-gray-500 mt-1">
          💡 Al seleccionar una dirección, las coordenadas se guardan
          automáticamente
        </p>
      </div>

      {/* Campo manual de dirección */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          O escribir dirección manualmente
        </label>
        <input
          name="direccion"
          value={direccion}
          onChange={onDireccionChange}
          className="block w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Av. Principal 1234"
        />
      </div>

      {/* Provincia y Localidad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Provincia
          </label>
          <select
            name="provincia"
            value={provincia}
            onChange={(e) => onProvinciaChange(e.target.value)}
            className="block w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccione una provincia</option>
            {provincias.map((prov) => (
              <option key={prov.id} value={prov.nombre}>
                {prov.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {esCaba(provincia || "") ? "Barrio" : "Localidad"}
          </label>
          <select
            name="localidad"
            value={localidad}
            onChange={(e) => onLocalidadChange(e.target.value)}
            className="block w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!provincia}
          >
            <option value="">
              {esCaba(provincia || "")
                ? "Seleccione un barrio"
                : "Seleccione una localidad"}
            </option>
            {localidades.map((loc) => (
              <option key={loc.id} value={loc.nombre}>
                {loc.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Indicador de geocodificación */}
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

      {!lat && !lng && (
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
                Usa el buscador de Google Maps arriba para que la empresa
                aparezca en el mapa de proximidad
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
