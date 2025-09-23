"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  List,
  Map as MapIcon,
} from "lucide-react";
import Link from "next/link";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";

interface Empresa {
  id: number;
  nombre: string;
  slug: string;
  telefono: string;
  email?: string;
  direccion: string;
  provincia?: string;
  localidad?: string;
  web?: string;
  imagenes: string[];
  destacado: boolean;
  corrientes_de_residuos?: string;
  servicios?: Array<{ id: number; nombre: string }>;
  // Campos calculados para el mapa
  lat?: number;
  lng?: number;
  distancia?: number;
}

interface EmpresasMapViewProps {
  empresas: Empresa[];
}

const EmpresasMapView: React.FC<EmpresasMapViewProps> = ({ empresas }) => {
  // Estados esenciales
  const [filteredEmpresas, setFilteredEmpresas] = useState<Empresa[]>(empresas);
  const [viewMode, setViewMode] = useState<"map" | "list">("list");
  const [loading, setLoading] = useState(false);
  const [, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Hook de Google Maps
  const {
    isLoaded: isMapLoaded,
    loadError,
    google,
  } = useGoogleMaps({
    libraries: ["places", "geometry"],
    region: "AR",
    language: "es",
  });

  // Referencias solo las necesarias
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);

  // Coordenadas fijas para empresas (sin hacer requests)
  const addCoordinatesToEmpresas = useCallback(
    (empresasList: Empresa[]): Empresa[] => {
      console.log("📍 Agregando coordenadas fijas (sin geocodificación)");

      // Coordenadas fijas para empresas de prueba
      const coordenadasFijas: Record<number, { lat: number; lng: number }> = {
        9999: { lat: -34.6037, lng: -58.3816 }, // CABA - Centro
        9998: { lat: -34.9215, lng: -57.9545 }, // La Plata
        9997: { lat: -34.7203, lng: -58.2563 }, // Quilmes
        9996: { lat: -34.4587, lng: -58.8503 }, // Pilar
        9995: { lat: -34.6534, lng: -58.5593 }, // Morón
        9994: { lat: -34.4708, lng: -58.5109 }, // San Isidro
      };

      return empresasList.map((empresa) => {
        const coords = coordenadasFijas[empresa.id];
        if (coords) {
          return { ...empresa, ...coords };
        }

        // Para otras empresas, coordenadas aleatorias en Buenos Aires
        if (empresa.id < 9990) {
          return {
            ...empresa,
            lat: -34.6037 + (Math.random() - 0.5) * 0.5, // Radio ~25km de CABA
            lng: -58.3816 + (Math.random() - 0.5) * 0.7,
          };
        }

        return empresa;
      });
    },
    []
  );

  // Inicializar mapa
  const initializeMap = useCallback(() => {
    if (!isMapLoaded || !mapRef.current || !google || mapInstanceRef.current)
      return;

    console.log("🗺️ Inicializando mapa...");

    // Crear mapa
    const map = new google.maps.Map(mapRef.current, {
      center: { lat: -34.6037, lng: -58.3816 }, // Buenos Aires
      zoom: 11,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    });

    mapInstanceRef.current = map;

    // Agregar marcadores
    loadMarkers(map);
  }, [isMapLoaded, google]);

  // Cargar marcadores en el mapa
  const loadMarkers = useCallback(
    (map: google.maps.Map) => {
      if (!google) return;

      console.log("📌 Cargando marcadores...");

      // Limpiar marcadores existentes
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];

      // Agregar coordenadas a empresas
      const empresasConCoordenadas = addCoordinatesToEmpresas(filteredEmpresas);
      setFilteredEmpresas(empresasConCoordenadas);

      // Crear marcadores
      empresasConCoordenadas.forEach((empresa) => {
        if (empresa.lat && empresa.lng) {
          const marker = new google.maps.Marker({
            position: { lat: empresa.lat, lng: empresa.lng },
            map: map,
            title: empresa.nombre,
            icon: {
              url: empresa.destacado
                ? 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%23EAB308"%3E%3Cpath d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/%3E%3C/svg%3E'
                : 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="%233B82F6"%3E%3Cpath d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/%3E%3C/svg%3E',
              scaledSize: new google.maps.Size(
                empresa.destacado ? 32 : 28,
                empresa.destacado ? 32 : 28
              ),
            },
          });

          // Info window al hacer clic
          const infoWindow = new google.maps.InfoWindow({
            content: `
            <div class="p-3 max-w-xs">
              <h3 class="font-bold text-lg text-gray-900 mb-2">${
                empresa.nombre
              }</h3>
              ${
                empresa.destacado
                  ? '<div class="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full mb-2"><span>⭐</span> Destacada</div>'
                  : ""
              }
              <div class="space-y-2 text-sm">
                <div class="flex items-center gap-2">
                  <span class="text-blue-500">📞</span>
                  <a href="tel:${empresa.telefono}" class="hover:underline">${
              empresa.telefono
            }</a>
                </div>
                <div class="flex items-start gap-2">
                  <span class="text-red-500">📍</span>
                  <span class="text-gray-700">${empresa.direccion}</span>
                </div>
                ${
                  empresa.email
                    ? `<div class="flex items-center gap-2"><span class="text-green-500">✉️</span><a href="mailto:${empresa.email}" class="hover:underline text-blue-600">${empresa.email}</a></div>`
                    : ""
                }
              </div>
              <div class="flex gap-2 mt-3">
                <a href="/empresas/${
                  empresa.slug
                }" target="_blank" class="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors text-center">Ver detalles</a>
                <a href="tel:${
                  empresa.telefono
                }" class="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">📞</a>
              </div>
            </div>
          `,
            maxWidth: 300,
          });

          marker.addListener("click", () => {
            infoWindow.open(map, marker);
          });

          markersRef.current.push(marker);
        }
      });

      // Ajustar vista para mostrar todos los marcadores
      if (empresasConCoordenadas.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        empresasConCoordenadas.forEach((empresa) => {
          if (empresa.lat && empresa.lng) {
            bounds.extend({ lat: empresa.lat, lng: empresa.lng });
          }
        });
        map.fitBounds(bounds);
      }

      console.log(`✅ ${markersRef.current.length} marcadores cargados`);
    },
    [google, filteredEmpresas, addCoordinatesToEmpresas]
  );

  // Agregar marcador de usuario
  const addUserMarker = useCallback(
    (location: { lat: number; lng: number }) => {
      if (!mapInstanceRef.current || !google) return;

      // Remover marcador anterior
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
      }

      // Crear nuevo marcador de usuario
      userMarkerRef.current = new google.maps.Marker({
        position: location,
        map: mapInstanceRef.current,
        title: "Tu ubicación",
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="%23DC2626"%3E%3Ccircle cx="12" cy="12" r="10" stroke="white" stroke-width="2"/%3E%3Ccircle cx="12" cy="12" r="4" fill="white"/%3E%3C/svg%3E',
          scaledSize: new google.maps.Size(28, 28),
          anchor: new google.maps.Point(14, 14),
        },
        zIndex: 1000,
      });

      // Centrar en ubicación del usuario
      mapInstanceRef.current.setCenter(location);
      mapInstanceRef.current.setZoom(14);
    },
    [google]
  );

  // Obtener ubicación del usuario
  const getCurrentLocation = () => {
    setLoading(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);

          if (mapInstanceRef.current) {
            addUserMarker(location);
          }

          setLoading(false);
          console.log("📍 Ubicación obtenida:", location);
        },
        (error) => {
          console.error("❌ Error obteniendo ubicación:", error);
          alert("No se pudo obtener tu ubicación. Verifica los permisos.");
          setLoading(false);
        }
      );
    } else {
      alert("Tu navegador no soporta geolocalización.");
      setLoading(false);
    }
  };

  // Inicializar cuando esté listo
  useEffect(() => {
    if (viewMode === "map") {
      initializeMap();
    }
  }, [viewMode, initializeMap]);

  // Procesar empresas al cargar
  useEffect(() => {
    const empresasConCoordenadas = addCoordinatesToEmpresas(empresas);
    setFilteredEmpresas(empresasConCoordenadas);
  }, [empresas, addCoordinatesToEmpresas]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Alerta de modo de prueba */}
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
            <p className="text-sm">
              <strong>🧪 MODO PRUEBA:</strong> Mapa con coordenadas fijas - No
              se hacen requests de geocodificación.
              {loadError && (
                <span className="text-red-600 ml-2">Error: {loadError}</span>
              )}
            </p>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Búsqueda por Proximidad
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Empresas especializadas en pozos de desagote - Modo prueba con
                coordenadas fijas
              </p>
            </div>

            {/* Toggle Vista */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "map"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <MapIcon size={16} />
                Mapa {!isMapLoaded && "(Cargando...)"}
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <List size={16} />
                Lista
              </button>
            </div>
          </div>

          {/* Buscador simplificado */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Buscar empresas por nombre..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={getCurrentLocation}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
            >
              <MapPin size={20} />
              {loading ? "Obteniendo..." : "Mi ubicación"}
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {viewMode === "map" ? (
          // Vista de Mapa
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
            {/* Mapa */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
              {!isMapLoaded ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-500">Cargando mapa...</p>
                    {loadError && (
                      <p className="text-red-500 text-xs mt-2">{loadError}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div ref={mapRef} className="w-full h-full min-h-[400px]" />
              )}
            </div>

            {/* Listado lateral */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">
                  Empresas encontradas ({filteredEmpresas.length})
                </h3>
              </div>
              <div className="overflow-y-auto h-full max-h-[500px]">
                {filteredEmpresas.map((empresa, index) => (
                  <div
                    key={empresa.id}
                    className="p-4 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 truncate">
                            {empresa.nombre}
                          </h4>
                          {empresa.destacado && (
                            <Star
                              size={14}
                              className="text-yellow-500 fill-current"
                            />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {empresa.direccion}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Phone size={12} />
                            {empresa.telefono}
                          </span>
                          {empresa.lat && empresa.lng && (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} />
                              {empresa.lat.toFixed(3)}, {empresa.lng.toFixed(3)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                          {index + 1}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Vista de Lista (igual que antes)
          <div className="space-y-4">
            {filteredEmpresas.map((empresa, index) => (
              <div
                key={empresa.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                        {index + 1}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {empresa.nombre}
                      </h3>
                      {empresa.destacado && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                          <Star size={12} className="fill-current" />
                          Destacada
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <a
                        href={`tel:${empresa.telefono}`}
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <Phone size={16} className="text-blue-500" />
                        <span>{empresa.telefono}</span>
                      </a>

                      {empresa.email && (
                        <a
                          href={`mailto:${empresa.email}`}
                          className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
                        >
                          <Mail size={16} className="text-green-500" />
                          <span className="truncate">{empresa.email}</span>
                        </a>
                      )}

                      <div className="flex items-start gap-2 text-gray-600">
                        <MapPin size={16} className="text-red-500 mt-0.5" />
                        <span>{empresa.direccion}</span>
                      </div>

                      {empresa.web && (
                        <a
                          href={
                            empresa.web.startsWith("http")
                              ? empresa.web
                              : `https://${empresa.web}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
                        >
                          <Globe size={16} className="text-purple-500" />
                          <span className="truncate">{empresa.web}</span>
                        </a>
                      )}
                    </div>

                    {empresa.servicios && empresa.servicios.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {empresa.servicios.slice(0, 3).map((servicio) => (
                          <span
                            key={servicio.id}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                          >
                            {servicio.nombre}
                          </span>
                        ))}
                        {empresa.servicios.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                            +{empresa.servicios.length - 3} más
                          </span>
                        )}
                      </div>
                    )}

                    {empresa.corrientes_de_residuos && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {empresa.corrientes_de_residuos}
                      </p>
                    )}
                  </div>

                  <div className="ml-6 flex flex-col gap-2">
                    <Link
                      href={`/empresas/${empresa.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      Ver detalles
                    </Link>
                    <a
                      href={`tel:${empresa.telefono}`}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                    >
                      <Phone size={16} />
                      Llamar
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmpresasMapView;
