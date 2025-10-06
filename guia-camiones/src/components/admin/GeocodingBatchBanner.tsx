// src/components/admin/GeocodingBatchBanner.tsx
"use client";

import { MapPin, RefreshCw } from "lucide-react";

interface GeocodingBatchBannerProps {
  empresasSinCoordenadas: number;
  geocodificando: boolean;
  resultadoGeocodificacion: {
    total: number;
    exitosas: number;
    fallidas: number;
  } | null;
  onExecute: () => void;
}

export default function GeocodingBatchBanner({
  empresasSinCoordenadas,
  geocodificando,
  resultadoGeocodificacion,
  onExecute,
}: GeocodingBatchBannerProps) {
  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <MapPin size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Geocodificación Automática
          </h3>
          <p className="text-sm text-green-700 mb-4">
            Geocodifica automáticamente todas las empresas que tienen dirección
            pero no tienen coordenadas. Se procesarán {empresasSinCoordenadas}{" "}
            empresas.
          </p>

          <button
            onClick={onExecute}
            disabled={geocodificando || empresasSinCoordenadas === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 ${
              geocodificando || empresasSinCoordenadas === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700 hover:scale-105"
            }`}
          >
            {geocodificando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Geocodificando...
              </>
            ) : (
              <>
                <RefreshCw size={20} />
                Geocodificar {empresasSinCoordenadas} empresas
              </>
            )}
          </button>

          {resultadoGeocodificacion && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-green-300">
              <p className="text-sm font-semibold text-green-900 mb-2">
                ✅ Geocodificación completada
              </p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total procesadas:</span>
                  <span className="ml-2 font-bold text-blue-600">
                    {resultadoGeocodificacion.total}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Exitosas:</span>
                  <span className="ml-2 font-bold text-green-600">
                    {resultadoGeocodificacion.exitosas}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Fallidas:</span>
                  <span className="ml-2 font-bold text-red-600">
                    {resultadoGeocodificacion.fallidas}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
