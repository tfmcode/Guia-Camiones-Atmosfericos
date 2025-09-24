// src/components/empresas/EmpresasMapViewEnhanced.tsx
"use client";

import React, { useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  List,
  Map as MapIcon,
  Navigation,
  AlertCircle,
  Search,
  Filter,
} from "lucide-react";
import Link from "next/link";

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
  lat?: number;
  lng?: number;
  distancia?: number;
  distanciaTexto?: string;
}

interface EmpresasMapViewEnhancedProps {
  empresas: Empresa[];
}

const EmpresasMapViewEnhanced: React.FC<EmpresasMapViewEnhancedProps> = ({
  empresas: empresasIniciales,
}) => {
  const [filtroDestacadas, setFiltroDestacadas] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroUbicacion, setFiltroUbicacion] = useState("");

  // Filtrar empresas
  const empresasFiltradas = empresasIniciales.filter((empresa) => {
    // Filtro de destacadas
    if (filtroDestacadas && !empresa.destacado) return false;

    // Filtro de búsqueda por texto
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchNombre = empresa.nombre.toLowerCase().includes(search);
      const matchDireccion = empresa.direccion.toLowerCase().includes(search);
      const matchProvincia = empresa.provincia?.toLowerCase().includes(search);
      const matchLocalidad = empresa.localidad?.toLowerCase().includes(search);
      const matchServicios = empresa.servicios?.some((s) =>
        s.nombre.toLowerCase().includes(search)
      );
      const matchDescripcion = empresa.corrientes_de_residuos
        ?.toLowerCase()
        .includes(search);

      if (
        !matchNombre &&
        !matchDireccion &&
        !matchProvincia &&
        !matchLocalidad &&
        !matchServicios &&
        !matchDescripcion
      ) {
        return false;
      }
    }

    // Filtro de ubicación
    if (filtroUbicacion) {
      const ubicacion = filtroUbicacion.toLowerCase();
      const matchProvincia = empresa.provincia
        ?.toLowerCase()
        .includes(ubicacion);
      const matchLocalidad = empresa.localidad
        ?.toLowerCase()
        .includes(ubicacion);
      const matchDireccion = empresa.direccion
        .toLowerCase()
        .includes(ubicacion);

      if (!matchProvincia && !matchLocalidad && !matchDireccion) {
        return false;
      }
    }

    return true;
  });

  // Ordenar empresas (destacadas primero, luego por nombre)
  const empresasOrdenadas = empresasFiltradas.sort((a, b) => {
    // Primero destacadas
    if (a.destacado && !b.destacado) return -1;
    if (!a.destacado && b.destacado) return 1;

    // Luego por nombre
    return a.nombre.localeCompare(b.nombre);
  });

  // Estadísticas
  const totalEmpresas = empresasIniciales.length;
  const empresasDestacadas = empresasIniciales.filter(
    (e) => e.destacado
  ).length;
  const provincias = Array.from(
    new Set(empresasIniciales.map((e) => e.provincia).filter(Boolean))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Status */}
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p className="text-sm">
              <strong>VERSIÓN ESTABLE:</strong> Lista completa sin dependencias
              complejas de Google Maps. Búsqueda, filtros y contacto directo
              funcionando perfectamente.
            </p>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Pozos de Desagotes Ciegos - Empresas Especializadas
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                {empresasOrdenadas.length} de {totalEmpresas} empresas
                encontradas
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-500">Vista: Lista completa</div>
            </div>
          </div>

          {/* Filtros mejorados */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Búsqueda general */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre, servicios, descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={20} className="text-gray-400" />
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Filtro por ubicación */}
            <div className="relative">
              <input
                type="text"
                placeholder="Filtrar por provincia, localidad..."
                value={filtroUbicacion}
                onChange={(e) => setFiltroUbicacion(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin size={20} className="text-gray-400" />
              </div>
            </div>

            {/* Filtro destacadas */}
            <div className="flex items-center">
              <button
                onClick={() => setFiltroDestacadas(!filtroDestacadas)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors w-full justify-center ${
                  filtroDestacadas
                    ? "bg-yellow-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Star size={16} />
                {filtroDestacadas ? "Mostrar todas" : "Solo destacadas"}
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <List size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {totalEmpresas}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Star size={20} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-yellow-600 font-medium">
                    Destacadas
                  </p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {empresasDestacadas}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Filter size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">
                    Filtradas
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {empresasOrdenadas.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <MapPin size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">
                    Provincias
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {provincias.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {empresasOrdenadas.length > 0 ? (
          <div className="space-y-4">
            {empresasOrdenadas.map((empresa, index) => (
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
                        <span className="font-medium">{empresa.telefono}</span>
                      </a>

                      <div className="flex items-start gap-2 text-gray-600">
                        <MapPin
                          size={16}
                          className="text-red-500 mt-0.5 flex-shrink-0"
                        />
                        <span>{empresa.direccion}</span>
                      </div>

                      {empresa.email && (
                        <a
                          href={`mailto:${empresa.email}`}
                          className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
                        >
                          <Mail size={16} className="text-green-500" />
                          <span className="truncate">{empresa.email}</span>
                        </a>
                      )}

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

                      {empresa.provincia && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Navigation size={16} className="text-gray-400" />
                          <span>
                            {empresa.provincia}
                            {empresa.localidad ? `, ${empresa.localidad}` : ""}
                          </span>
                        </div>
                      )}
                    </div>

                    {empresa.servicios && empresa.servicios.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {empresa.servicios.slice(0, 5).map((servicio) => (
                          <span
                            key={servicio.id}
                            className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                          >
                            {servicio.nombre}
                          </span>
                        ))}
                        {empresa.servicios.length > 5 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                            +{empresa.servicios.length - 5} servicios más
                          </span>
                        )}
                      </div>
                    )}

                    {empresa.corrientes_de_residuos && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {empresa.corrientes_de_residuos}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="ml-6 flex flex-col gap-3 flex-shrink-0">
                    <Link
                      href={`/empresas/${empresa.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm text-center"
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
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(
                        empresa.direccion +
                          ", " +
                          (empresa.provincia || "Argentina")
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
                    >
                      <MapIcon size={16} />
                      Maps
                    </a>
                    <a
                      href={`https://wa.me/549${empresa.telefono.replace(
                        /[^0-9]/g,
                        ""
                      )}?text=Hola, me interesa consultar sobre servicios de desagote`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-sm"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron empresas
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filtroUbicacion
                ? "No hay resultados para los filtros aplicados. Intenta con términos diferentes."
                : "Intenta ajustar los filtros de búsqueda."}
            </p>
            <div className="flex gap-4 justify-center">
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  Limpiar búsqueda
                </button>
              )}
              {filtroUbicacion && (
                <button
                  onClick={() => setFiltroUbicacion("")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
                >
                  Limpiar ubicación
                </button>
              )}
              {filtroDestacadas && (
                <button
                  onClick={() => setFiltroDestacadas(false)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium text-sm"
                >
                  Mostrar todas
                </button>
              )}
            </div>
          </div>
        )}

        {/* Información adicional */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Información sobre el directorio
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Qué encontrarás aquí:
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Empresas especializadas en desagote de pozos ciegos</li>
                <li>• Servicios de limpieza y mantenimiento de pozos</li>
                <li>• Camiones atmosféricos y equipos especializados</li>
                <li>• Cobertura en múltiples provincias de Argentina</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Cómo contactar:
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Llamá directamente desde los botones de teléfono</li>
                <li>• Enviá WhatsApp con consulta pre-armada</li>
                <li>• Visitá el perfil completo de cada empresa</li>
                <li>• Ubicá la empresa más cercana en Google Maps</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmpresasMapViewEnhanced;
