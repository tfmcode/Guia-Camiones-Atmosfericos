// src/components/maps/OptimizedPozosMapView.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Phone, Navigation, AlertCircle, Info, X } from "lucide-react";
import OptimizedAddressSearch from "@/components/maps/OptimizedAddressSearch";
import type { EmpresaWithCoords } from "@/types/empresa";

// ===== TIPOS =====
interface Props {
  empresas?: EmpresaWithCoords[];
}

// ===== CONSTANTES =====
const ICONS = {
  userLocation: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="11" fill="#10B981" stroke="#fff" stroke-width="2"/>
      <path d="M12 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 8c-3 0-6 1.5-6 3v1h12v-1c0-1.5-3-3-6-3z" fill="#fff"/>
    </svg>
  `)}`,
  truckBlue: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24">
      <rect x="1" y="8" width="22" height="10" rx="2" fill="#2563EB" stroke="#fff" stroke-width="1.5"/>
      <rect x="2" y="6" width="12" height="8" rx="1" fill="#1E40AF"/>
      <circle cx="7" cy="18" r="2" fill="#1F2937" stroke="#fff" stroke-width="1"/>
      <circle cx="17" cy="18" r="2" fill="#1F2937" stroke="#fff" stroke-width="1"/>
      <path d="M14 6h4l3 4v2h-2" stroke="#fff" stroke-width="1.2" fill="none"/>
      <rect x="4" y="9" width="6" height="4" rx="0.5" fill="#60A5FA" opacity="0.6"/>
    </svg>
  `)}`,
  starGold: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="11" fill="#FCD34D" stroke="#B45309" stroke-width="2"/>
      <path d="M12 2l2.5 7.5H22l-6 5 2.5 7.5L12 17l-6.5 5 2.5-7.5-6-5h7.5z" fill="#B45309" stroke="#92400E" stroke-width="0.5"/>
      <circle cx="12" cy="12" r="2" fill="#FEF3C7"/>
    </svg>
  `)}`,
};

const BUENOS_AIRES = { lat: -34.6037, lng: -58.3816 };
const DEFAULT_ZOOM = 12;

// ===== SUBCOMPONENTES =====

// Empresa Card Component
const EmpresaCard: React.FC<{
  empresa: EmpresaWithCoords;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}> = ({ empresa, index, isSelected, onClick }) => (
  <div
    id={`empresa-${empresa.id}`}
    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
      isSelected
        ? "bg-blue-50 border-2 border-blue-400 shadow-md"
        : "bg-gray-50 hover:bg-gray-100 hover:shadow border border-transparent"
    }`}
    onClick={onClick}
  >
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-xs font-bold text-gray-500 bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
          {index + 1}
        </span>
        <h4 className="font-medium text-sm truncate">{empresa.nombre}</h4>
      </div>
      {empresa.destacado && (
        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2">
          ⭐
        </span>
      )}
    </div>

    {empresa.distanciaTexto && (
      <div className="flex items-center gap-1 text-xs text-green-600 font-medium mb-2">
        <Navigation className="w-3 h-3" />
        <span>{empresa.distanciaTexto}</span>
      </div>
    )}

    <div className="space-y-1 mb-2">
      <div className="flex items-start gap-2 text-xs text-gray-600">
        <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
        <span className="line-clamp-1">{empresa.direccion}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <Phone className="w-3 h-3 flex-shrink-0" />
        <span>{empresa.telefono}</span>
      </div>
    </div>

    <div className="flex gap-2">
      <a
        href={`tel:${empresa.telefono}`}
        className="flex-1 text-center py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors font-medium"
        onClick={(e) => e.stopPropagation()}
      >
        Llamar
      </a>
      <a
        href={`/empresas/${empresa.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-center py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors font-medium"
        onClick={(e) => e.stopPropagation()}
      >
        Ver más
      </a>
    </div>
  </div>
);

// Map Legend Component
const MapLegend: React.FC = () => (
  <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200 z-10 hidden md:block">
    <p className="text-xs font-semibold text-gray-700 mb-2">📍 Leyenda</p>
    <div className="space-y-1.5 text-xs">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
          <span className="text-xs">👤</span>
        </div>
        <span className="text-gray-700">Tu ubicación</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-blue-600 rounded" />
        <span className="text-gray-700">Empresa</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
          ⭐
        </div>
        <span className="text-gray-700">Destacada</span>
      </div>
    </div>
  </div>
);

// ===== COMPONENTE PRINCIPAL =====
export default function OptimizedPozosMapView({
  empresas: empresasIniciales = [],
}: Props) {
  // Estados
  const [empresas, setEmpresas] = useState<EmpresaWithCoords[]>(
    Array.isArray(empresasIniciales) ? empresasIniciales : []
  );
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedEmpresa, setSelectedEmpresa] =
    useState<EmpresaWithCoords | null>(null);

  // Refs
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<number, google.maps.Marker>>(new Map());
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);

  // ===== FUNCIONES AUXILIARES =====
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

  // Crear contenido del InfoWindow
  const createInfoWindow = useCallback((empresa: EmpresaWithCoords) => {
    return `
      <div style="padding: 12px; max-width: 280px; font-family: system-ui, -apple-system, sans-serif;">
        <div style="display: flex; align-items: start; justify-content: space-between; margin-bottom: 8px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1F2937; flex: 1;">
            ${empresa.nombre}
          </h3>
          ${
            empresa.destacado
              ? '<span style="background: #FCD34D; color: #92400E; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; white-space: nowrap;">⭐ Destacada</span>'
              : ""
          }
        </div>
        
        ${
          empresa.distanciaTexto
            ? `
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; color: #059669; font-weight: 500; font-size: 13px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4"></path>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
            </svg>
            <span>A ${empresa.distanciaTexto}</span>
          </div>
        `
            : ""
        }
        
        <div style="border-top: 1px solid #E5E7EB; padding-top: 10px; margin-top: 10px;">
          <div style="display: flex; align-items: start; gap: 8px; margin-bottom: 8px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" style="margin-top: 2px; flex-shrink: 0;">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span style="color: #4B5563; font-size: 13px; line-height: 1.4;">${
              empresa.direccion
            }</span>
          </div>
          
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" style="flex-shrink: 0;">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"></path>
            </svg>
            <a href="tel:${
              empresa.telefono
            }" style="color: #2563EB; text-decoration: none; font-size: 14px; font-weight: 500;">
              ${empresa.telefono}
            </a>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px;">
          <a href="tel:${
            empresa.telefono
          }" style="display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; background: #10B981; color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 500;">
            Llamar
          </a>
          <a href="/empresas/${
            empresa.slug
          }" target="_blank" style="display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; background: #2563EB; color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 500;">
            Ver más
          </a>
        </div>
      </div>
    `;
  }, []);

  // Centrar mapa con animación suave
  const centerMapOnLocation = useCallback(
    (lat: number, lng: number, zoom: number = 15) => {
      if (!mapRef.current) return;
      mapRef.current.panTo({ lat, lng });
      const currentZoom = mapRef.current.getZoom() || DEFAULT_ZOOM;
      if (Math.abs(currentZoom - zoom) > 2) {
        mapRef.current.setZoom(zoom);
      }
    },
    []
  );

  // Actualizar marcadores
  const updateMarkers = useCallback(() => {
    if (!mapRef.current || !Array.isArray(empresas)) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();

    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow();
    }

    empresas.forEach((empresa) => {
      if (!empresa.lat || !empresa.lng) return;

      const position = { lat: empresa.lat, lng: empresa.lng };

      const icon = empresa.destacado
        ? {
            url: ICONS.starGold,
            scaledSize: new google.maps.Size(42, 42),
            anchor: new google.maps.Point(21, 21),
          }
        : {
            url: ICONS.truckBlue,
            scaledSize: new google.maps.Size(36, 36),
            anchor: new google.maps.Point(18, 18),
          };

      const marker = new google.maps.Marker({
        position,
        map: mapRef.current!,
        title: empresa.nombre,
        icon,
        zIndex: empresa.destacado ? 1000 : 100,
      });

      marker.addListener("click", () => {
        setSelectedEmpresa(empresa);
        const content = createInfoWindow(empresa);
        infoWindowRef.current!.setContent(content);
        infoWindowRef.current!.open(mapRef.current!, marker);
        centerMapOnLocation(empresa.lat!, empresa.lng!, 15);
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => marker.setAnimation(null), 1500);
      });

      markersRef.current.set(empresa.id, marker);
    });

    if (!userLocation && empresas.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      let hasValidBounds = false;

      empresas.forEach((e) => {
        if (e.lat && e.lng) {
          bounds.extend({ lat: e.lat, lng: e.lng });
          hasValidBounds = true;
        }
      });

      if (hasValidBounds) {
        mapRef.current.fitBounds(bounds);
      }
    }
  }, [empresas, createInfoWindow, centerMapOnLocation, userLocation]);

  // Handle location select
  const handleLocationSelect = useCallback(
    async (coords: { lat: number; lng: number; address: string }) => {
      setUserLocation(coords);

      if (mapRef.current) {
        centerMapOnLocation(coords.lat, coords.lng, 13);

        if (userMarkerRef.current) {
          userMarkerRef.current.setMap(null);
        }

        userMarkerRef.current = new google.maps.Marker({
          position: coords,
          map: mapRef.current,
          icon: {
            url: ICONS.userLocation,
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20),
          },
          title: "Tu ubicación",
          zIndex: 2000,
        });

        const userInfoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; font-family: system-ui; text-align: center;">
              <strong style="color: #059669;">📍 Tu ubicación</strong>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #6B7280;">${coords.address}</p>
            </div>
          `,
        });

        userMarkerRef.current.addListener("click", () => {
          userInfoWindow.open(mapRef.current!, userMarkerRef.current!);
        });
      }

      const empresasConDistancia: EmpresaWithCoords[] = empresas
        .map((empresa) => {
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
    },
    [empresas, centerMapOnLocation]
  );

  // Handle empresa click from list
  const handleEmpresaClick = useCallback(
    (empresa: EmpresaWithCoords) => {
      if (!empresa.lat || !empresa.lng || !mapRef.current) return;

      setSelectedEmpresa(empresa);
      centerMapOnLocation(empresa.lat, empresa.lng, 16);

      const marker = markersRef.current.get(empresa.id);
      if (marker) {
        const content = createInfoWindow(empresa);
        infoWindowRef.current!.setContent(content);
        infoWindowRef.current!.open(mapRef.current, marker);
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => marker.setAnimation(null), 1500);
      }

      const empresaElement = document.getElementById(`empresa-${empresa.id}`);
      if (empresaElement) {
        empresaElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    },
    [createInfoWindow, centerMapOnLocation]
  );

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current || !window.google) return;

    const map = new google.maps.Map(mapContainerRef.current, {
      center: BUENOS_AIRES,
      zoom: DEFAULT_ZOOM,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
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
      markersRef.current.clear();
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
      }
    };
  }, []);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  // ===== RENDER =====
  if (empresas.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No hay empresas disponibles
          </h2>
          <p className="text-gray-600">
            No se encontraron empresas en esta categoría.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Compacto */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          

          <OptimizedAddressSearch
            onLocationSelect={handleLocationSelect}
            placeholder="Buscá tu dirección o usá GPS"
          />
        </div>
      </header>

      {/* Layout Principal - Optimizado */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row h-[calc(100vh-180px)]">
          {/* Lista - Lateral */}
          <aside className="w-full lg:w-96 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 shadow-sm flex flex-col max-h-[300px] lg:max-h-none">
            <div className="p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-gray-900">
                  {userLocation ? "🎯 Por distancia" : "📋 Empresas"}
                </h3>
                {selectedEmpresa && (
                  <button
                    onClick={() => {
                      setSelectedEmpresa(null);
                      infoWindowRef.current?.close();
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Limpiar selección"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {empresas
                .filter((e) => e.lat && e.lng)
                .map((empresa, idx) => (
                  <EmpresaCard
                    key={empresa.id}
                    empresa={empresa}
                    index={idx}
                    isSelected={selectedEmpresa?.id === empresa.id}
                    onClick={() => handleEmpresaClick(empresa)}
                  />
                ))}

              {empresas.filter((e) => e.lat && e.lng).length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium text-sm">Sin empresas activas</p>
                </div>
              )}
            </div>
          </aside>

          {/* Mapa - Principal */}
          <main className="flex-1 relative bg-gray-100">
            <div ref={mapContainerRef} className="w-full h-full" />

            {!userLocation && (
              <div className="absolute top-4 left-4 right-4 lg:max-w-sm bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-blue-200 z-10">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-medium text-gray-900 mb-1">
                      💡 Ingresá tu ubicación
                    </p>
                    <p className="text-gray-600">
                      Buscá o usá GPS para ver empresas por distancia
                    </p>
                  </div>
                </div>
              </div>
            )}

            <MapLegend />
          </main>
        </div>
      </div>
    </div>
  );
}
