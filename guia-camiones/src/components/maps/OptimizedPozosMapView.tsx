// src/components/maps/OptimizedPozosMapView.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MapPin,
  Phone,
  Navigation,
  AlertCircle,
  Info,
  DollarSign,
} from "lucide-react";
import OptimizedAddressSearch from "@/components/maps/OptimizedAddressSearch";
import { clientGeocodingService } from "@/lib/geocoding/ClientGeocodingService";
import type { EmpresaWithCoords } from "@/types/empresa";

interface ApiStats {
  dailyRequests: number;
  dailyLimit: number;
  remainingRequests: number;
  memoryCacheSize: number;
  dbCacheSize: number;
  canMakeRequests: boolean;
  hitRate?: number;
}

interface Props {
  empresas?: EmpresaWithCoords[];
}

export default function OptimizedPozosMapView({
  empresas: empresasIniciales = [],
}: Props) {
  // Asegurarse de que siempre tengamos un array válido
  const [empresas, setEmpresas] = useState<EmpresaWithCoords[]>(
    Array.isArray(empresasIniciales) ? empresasIniciales : []
  );
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedEmpresa, setSelectedEmpresa] =
    useState<EmpresaWithCoords | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState(0);
  const [apiStats, setApiStats] = useState<ApiStats | null>(null);
  const [showCostWarning, setShowCostWarning] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Función updateMarkers con useCallback para evitar warning de dependencias
  const updateMarkers = useCallback(() => {
    if (!mapRef.current || !Array.isArray(empresas)) return;

    // Limpiar marcadores existentes
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasMarkers = false;

    // Crear nuevos marcadores solo para empresas con coordenadas
    empresas.forEach((empresa) => {
      // Verificar que lat y lng no sean null ni undefined
      if (!empresa.lat || !empresa.lng) return;

      const position = { lat: empresa.lat, lng: empresa.lng };
      bounds.extend(position);
      hasMarkers = true;

      const marker = new google.maps.Marker({
        position,
        map: mapRef.current!,
        title: empresa.nombre,
        icon: {
          url: empresa.destacado
            ? "data:image/svg+xml;charset=UTF-8," +
              encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill="#FFD700" stroke="#333" stroke-width="2"/>
                  <path d="M12 2L14 8L20 9L16 13L17 19L12 16L7 19L8 13L4 9L10 8Z" fill="#333"/>
                </svg>`)
            : "data:image/svg+xml;charset=UTF-8," +
              encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="8" fill="#2563EB" stroke="#fff" stroke-width="2"/>
                </svg>`),
          scaledSize: new google.maps.Size(32, 32),
        },
        animation: empresa.destacado ? google.maps.Animation.BOUNCE : undefined,
      });

      // Click en marcador
      marker.addListener("click", () => {
        setSelectedEmpresa(empresa);
        mapRef.current?.panTo(position);
        mapRef.current?.setZoom(15);
      });

      markersRef.current.push(marker);
    });

    // Ajustar vista si hay marcadores
    if (hasMarkers && mapRef.current) {
      mapRef.current.fitBounds(bounds);

      // Limitar zoom máximo
      const listener = google.maps.event.addListener(
        mapRef.current,
        "idle",
        () => {
          if (mapRef.current && mapRef.current.getZoom()! > 15) {
            mapRef.current.setZoom(15);
          }
          google.maps.event.removeListener(listener);
        }
      );
    }
  }, [empresas, selectedEmpresa]);

  // Cargar estadísticas de API
  const loadApiStats = useCallback(async () => {
    try {
      const stats = await clientGeocodingService.getStats();
      setApiStats(stats);

      // Mostrar advertencia si se acerca al límite
      if (stats.remainingRequests < 100) {
        setShowCostWarning(true);
      }
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  }, []);

  useEffect(() => {
    loadApiStats();
    const interval = setInterval(loadApiStats, 30000);
    return () => clearInterval(interval);
  }, [loadApiStats]);

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current || !window.google) return;

    const map = new google.maps.Map(mapContainerRef.current, {
      center: { lat: -34.6037, lng: -58.3816 }, // Buenos Aires
      zoom: 11,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: "poi.business",
          stylers: [{ visibility: "off" }],
        },
      ],
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };
  }, []);

  // Actualizar marcadores cuando cambian las empresas
  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  // Manejar selección de ubicación
  const handleLocationSelect = async (coords: {
    lat: number;
    lng: number;
    address: string;
  }) => {
    setUserLocation(coords);

    // Centrar mapa
    if (mapRef.current) {
      mapRef.current.setCenter(coords);
      mapRef.current.setZoom(13);

      // Agregar marcador de usuario
      new google.maps.Marker({
        position: coords,
        map: mapRef.current,
        icon: {
          url:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" fill="#10B981" stroke="#fff" stroke-width="3"/>
              <circle cx="12" cy="12" r="3" fill="#fff"/>
            </svg>`),
          scaledSize: new google.maps.Size(32, 32),
        },
        title: "Tu ubicación",
      });
    }

    // Calcular distancias y ordenar
    const empresasConDistancia: EmpresaWithCoords[] = empresas
      .map((empresa) => {
        // Verificar que las coordenadas no sean null
        if (empresa.lat && empresa.lng) {
          const distancia = calculateDistance(
            coords.lat,
            coords.lng,
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
      .sort((a, b) => {
        if (a.destacado && !b.destacado) return -1;
        if (!a.destacado && b.destacado) return 1;
        return (a.distancia || 999) - (b.distancia || 999);
      });

    setEmpresas(empresasConDistancia);
  };

  // Geocodificar empresas pendientes (con límites)
  const geocodePendingEmpresas = async () => {
    const pendientes = empresas.filter((e) => !e.lat || !e.lng);

    if (pendientes.length === 0) {
      alert("Todas las empresas ya están geocodificadas");
      return;
    }

    if (apiStats && apiStats.remainingRequests < pendientes.length) {
      const confirmar = confirm(
        `⚠️ Advertencia de límite de API:\n\n` +
          `Empresas pendientes: ${pendientes.length}\n` +
          `Requests disponibles hoy: ${apiStats.remainingRequests}\n\n` +
          `Si continúas, podrías alcanzar el límite gratuito.\n` +
          `¿Deseas continuar?`
      );

      if (!confirmar) return;
    }

    setIsGeocoding(true);
    setGeocodingProgress(0);

    try {
      const requests = pendientes.map((e) => ({
        id: e.id,
        address: e.direccion,
        provincia: e.provincia,
        localidad: e.localidad,
      }));

      const results = await clientGeocodingService.geocodeBatch(
        requests,
        (completed, total) => {
          setGeocodingProgress(Math.round((completed / total) * 100));
        }
      );

      // Actualizar empresas con coordenadas
      const empresasActualizadas: EmpresaWithCoords[] = empresas.map(
        (empresa) => {
          const result = results.find((r) => r.id === empresa.id);
          if (result && result.success && result.lat && result.lng) {
            return {
              ...empresa,
              lat: result.lat,
              lng: result.lng,
            };
          }
          return empresa;
        }
      );

      setEmpresas(empresasActualizadas);
      await loadApiStats(); // Actualizar estadísticas

      const exitosas = results.filter((r) => r.success).length;
      alert(
        `✅ Geocodificación completada:\n${exitosas} de ${results.length} empresas geocodificadas`
      );
    } catch (error) {
      console.error("Error en geocodificación:", error);
      alert(
        "Error durante la geocodificación. Revisa la consola para más detalles."
      );
    } finally {
      setIsGeocoding(false);
      setGeocodingProgress(0);
    }
  };

  // Funciones auxiliares
  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatDistance = (km: number): string => {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  // Estadísticas de empresas - con validación para evitar errores
  const stats = {
    total: Array.isArray(empresas) ? empresas.length : 0,
    conCoordenadas: Array.isArray(empresas)
      ? empresas.filter((e) => e.lat && e.lng).length
      : 0,
    sinCoordenadas: Array.isArray(empresas)
      ? empresas.filter((e) => !e.lat || !e.lng).length
      : 0,
    destacadas: Array.isArray(empresas)
      ? empresas.filter((e) => e.destacado).length
      : 0,
  };

  // Si no hay empresas, mostrar mensaje
  if (!Array.isArray(empresas) || empresas.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No hay empresas para mostrar
          </h2>
          <p className="text-gray-600">
            No se encontraron empresas especializadas en pozos de desagote.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con estadísticas */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Pozos de Desagotes - Búsqueda por Proximidad
          </h1>

          {/* Panel de control de API */}
          {apiStats && (
            <div
              className={`mb-4 p-4 rounded-lg border ${
                apiStats.remainingRequests < 100
                  ? "bg-red-50 border-red-300"
                  : "bg-green-50 border-green-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  <span className="font-medium">
                    Estado de API de Google Maps
                  </span>
                </div>
                <div className="flex gap-4 text-sm">
                  <span>
                    Requests hoy:{" "}
                    <strong>
                      {apiStats.dailyRequests}/{apiStats.dailyLimit}
                    </strong>
                  </span>
                  <span>
                    Disponibles: <strong>{apiStats.remainingRequests}</strong>
                  </span>
                  <span>
                    Cache hits:{" "}
                    <strong>
                      {apiStats.memoryCacheSize + apiStats.dbCacheSize}
                    </strong>
                  </span>
                </div>
              </div>
              {showCostWarning && (
                <div className="mt-2 text-sm text-red-700">
                  ⚠️ Te acercas al límite diario gratuito. Usa con precaución
                  para evitar cargos.
                </div>
              )}
            </div>
          )}

          {/* Búsqueda optimizada */}
          <div className="mb-4">
            <OptimizedAddressSearch
              onLocationSelect={handleLocationSelect}
              placeholder="Ingresá tu dirección o usá tu ubicación actual"
            />
          </div>

          {/* Estadísticas de empresas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-600">Total</div>
              <div className="text-2xl font-bold text-blue-900">
                {stats.total}
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-green-600">Geocodificadas</div>
              <div className="text-2xl font-bold text-green-900">
                {stats.conCoordenadas}
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-sm text-yellow-600">Pendientes</div>
              <div className="text-2xl font-bold text-yellow-900">
                {stats.sinCoordenadas}
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm text-purple-600">Destacadas</div>
              <div className="text-2xl font-bold text-purple-900">
                {stats.destacadas}
              </div>
            </div>
          </div>

          {/* Botón de geocodificación manual (con protección) */}
          {stats.sinCoordenadas > 0 && (
            <div className="mt-4">
              <button
                onClick={geocodePendingEmpresas}
                disabled={isGeocoding || !apiStats?.canMakeRequests}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isGeocoding || !apiStats?.canMakeRequests
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isGeocoding
                  ? `Geocodificando... ${geocodingProgress}%`
                  : `Geocodificar ${stats.sinCoordenadas} empresas pendientes`}
              </button>
              {!apiStats?.canMakeRequests && (
                <p className="text-sm text-red-600 mt-2">
                  Límite diario alcanzado. Intenta mañana.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contenedor del mapa y lista */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-250px)]">
        {/* Mapa */}
        <div className="flex-1 relative">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Info overlay */}
          {!userLocation && (
            <div className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur p-4 rounded-lg shadow-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">
                    Ingresá tu ubicación para ver empresas cercanas
                  </p>
                  <p className="text-gray-600">
                    Podés buscar una dirección o usar tu ubicación actual con el
                    botón GPS
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lista de empresas */}
        <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Empresas{" "}
              {userLocation ? "ordenadas por distancia" : "disponibles"}
            </h3>

            {empresas
              .filter((e) => e.lat && e.lng)
              .map((empresa, idx) => (
                <div
                  key={empresa.id}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                    selectedEmpresa?.id === empresa.id
                      ? "bg-blue-50 border border-blue-300"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                  onClick={() => {
                    setSelectedEmpresa(empresa);
                    if (empresa.lat && empresa.lng && mapRef.current) {
                      mapRef.current.panTo({
                        lat: empresa.lat,
                        lng: empresa.lng,
                      });
                      mapRef.current.setZoom(15);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500">
                        #{idx + 1}
                      </span>
                      <h4 className="font-medium text-sm">{empresa.nombre}</h4>
                    </div>
                    {empresa.destacado && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        ⭐ Destacada
                      </span>
                    )}
                  </div>

                  {empresa.distanciaTexto && (
                    <div className="flex items-center gap-1 text-sm text-green-600 mb-1">
                      <Navigation className="w-3 h-3" />
                      <span className="font-medium">
                        {empresa.distanciaTexto}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <MapPin className="w-3 h-3" />
                      <span>{empresa.direccion}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Phone className="w-3 h-3" />
                      <a
                        href={`tel:${empresa.telefono}`}
                        className="hover:text-blue-600"
                      >
                        {empresa.telefono}
                      </a>
                    </div>
                  </div>

                  <div className="mt-2 flex gap-2">
                    <a
                      href={`tel:${empresa.telefono}`}
                      className="flex-1 text-center py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Llamar
                    </a>
                    <a
                      href={`/empresas/${empresa.slug}`}
                      target="_blank"
                      className="flex-1 text-center py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Ver más
                    </a>
                  </div>
                </div>
              ))}

            {empresas.filter((e) => e.lat && e.lng).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3" />
                <p>No hay empresas geocodificadas aún</p>
                <p className="text-sm mt-2">
                  Usa el botón de geocodificación arriba
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
