"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import EmpresaCard from "@/components/empresas/EmpresasCard";
import { getEmpresas } from "@/lib/api/empresaService";
import type { Empresa } from "@/types/empresa";
import { ChevronLeft, ChevronRight, Filter, X } from "lucide-react";

export default function EmpresasContent() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [provincias, setProvincias] = useState<string[]>([]);
  const [localidades, setLocalidades] = useState<string[]>([]);
  const [serviciosDisponibles, setServiciosDisponibles] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const router = useRouter();

  const filtro = {
    provincia: searchParams.get("provincia") || "",
    localidad: searchParams.get("localidad") || "",
    servicio: searchParams.get("servicio") || "",
  };

  const orden = searchParams.get("orden") || "destacadas";
  const soloDestacadas = searchParams.get("soloDestacadas") === "true";
  const paginaActual = parseInt(searchParams.get("pagina") || "1", 10);
  const empresasPorPagina = 9;

  // ✅ FIX: useCallback para evitar warning de dependencias
  const loadEmpresas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEmpresas();
      
      // ✅ FIX: Verificar el formato de respuesta y manejar ambos casos
      if (Array.isArray(data)) {
        console.log("📊 Empresas cargadas (array directo):", data.length);
        setEmpresas(data);
      } else if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: Empresa[] }).data)) {
        // ✅ FIX: Type assertion para manejar el objeto con metadata
        const dataObj = data as { data: Empresa[]; timestamp?: string; count?: number };
        console.log("📊 Empresas cargadas (objeto con metadata):", dataObj.data.length);
        setEmpresas(dataObj.data);
      } else {
        console.error("❌ Formato de respuesta inesperado:", data);
        setEmpresas([]);
      }
    } catch (error) {
      console.error("❌ Error al cargar empresas:", error);
      setEmpresas([]);
    } finally {
      setLoading(false);
    }
  }, []); // ✅ FIX: Sin dependencias porque getEmpresas es estable

  useEffect(() => {
    loadEmpresas();
  }, [loadEmpresas]);

  useEffect(() => {
    fetch("https://apis.datos.gob.ar/georef/api/provincias?campos=nombre")
      .then((res) => res.json())
      .then((data) =>
        setProvincias(data.provincias.map((p: { nombre: string }) => p.nombre))
      )
      .catch((err: unknown) => console.error("Error al cargar provincias:", err));
  }, []);

  useEffect(() => {
    if (filtro.provincia) {
      fetch(
        `https://apis.datos.gob.ar/georef/api/municipios?provincia=${filtro.provincia}&campos=nombre&max=1000`
      )
        .then((res) => res.json())
        .then((data) =>
          setLocalidades(
            data.municipios.map((m: { nombre: string }) => m.nombre)
          )
        )
        .catch((err: unknown) => console.error("Error al cargar localidades:", err));
    } else {
      setLocalidades([]);
    }
  }, [filtro.provincia]);

  useEffect(() => {
    fetch("/api/servicios")
      .then((res) => res.json())
      .then((data) => {
        // ✅ FIX: Verificar que data sea array antes de mapear
        if (Array.isArray(data)) {
          setServiciosDisponibles(data.map((s: { nombre: string }) => s.nombre));
        } else {
          console.error("❌ Servicios no es un array:", data);
          setServiciosDisponibles([]);
        }
      })
      .catch((err: unknown) => {
        console.error("Error al cargar servicios:", err);
        setServiciosDisponibles([]);
      });
  }, []);

  const filtrar = (empresa: Empresa) => {
    const matchProvincia = filtro.provincia
      ? empresa.provincia === filtro.provincia
      : true;
    const matchLocalidad = filtro.localidad
      ? empresa.localidad === filtro.localidad
      : true;
    const matchServicio = filtro.servicio
      ? empresa.servicios?.some((s) =>
          s.nombre.toLowerCase().includes(filtro.servicio.toLowerCase())
        )
      : true;
    const matchDestacadas = soloDestacadas ? empresa.destacado : true;
    return matchProvincia && matchLocalidad && matchServicio && matchDestacadas;
  };

  // ✅ FIX: Asegurar que empresas sea array antes de filtrar
  const empresasFiltradas = Array.isArray(empresas) ? empresas.filter(filtrar) : [];
  
  const empresasOrdenadas = [...empresasFiltradas].sort((a, b) => {
    if (orden === "nombre") return a.nombre.localeCompare(b.nombre);
    if (orden === "destacadas")
      return Number(b.destacado) - Number(a.destacado);
    return 0;
  });

  const totalPaginas = Math.ceil(empresasOrdenadas.length / empresasPorPagina);
  const indiceInicial = (paginaActual - 1) * empresasPorPagina;
  const empresasPaginadas = empresasOrdenadas.slice(
    indiceInicial,
    indiceInicial + empresasPorPagina
  );

  const actualizarQuery = (nuevo: Record<string, string>) => {
    const query = new URLSearchParams(searchParams.toString());
    Object.entries(nuevo).forEach(([key, value]) => {
      if (value === "") query.delete(key);
      else query.set(key, value);
    });
    router.push(`/empresas?${query.toString()}`);
  };

  const limpiarFiltros = () => {
    router.push("/empresas");
  };

  const filtrosActivos =
    filtro.provincia || filtro.localidad || filtro.servicio || soloDestacadas;

  // Paginación móvil simplificada
  const renderPaginationMobile = () => {
    if (totalPaginas <= 1) return null;

    return (
      <div className="flex items-center justify-between sm:hidden px-4">
        <button
          onClick={() =>
            actualizarQuery({ pagina: String(Math.max(1, paginaActual - 1)) })
          }
          disabled={paginaActual === 1}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            paginaActual === 1
              ? "text-gray-400 bg-gray-100 cursor-not-allowed"
              : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
          }`}
        >
          <ChevronLeft size={16} />
          Anterior
        </button>

        <div className="flex items-center gap-1 text-sm font-medium text-gray-600">
          <span>{paginaActual}</span>
          <span>de</span>
          <span>{totalPaginas}</span>
        </div>

        <button
          onClick={() =>
            actualizarQuery({
              pagina: String(Math.min(totalPaginas, paginaActual + 1)),
            })
          }
          disabled={paginaActual === totalPaginas}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            paginaActual === totalPaginas
              ? "text-gray-400 bg-gray-100 cursor-not-allowed"
              : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
          }`}
        >
          Siguiente
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  // Paginación desktop
  const renderPaginationDesktop = () => {
    if (totalPaginas <= 1) return null;

    const pagesToShow = [];
    const maxPagesToShow = 5;
    const startPage = Math.max(
      1,
      paginaActual - Math.floor(maxPagesToShow / 2)
    );
    const endPage = Math.min(totalPaginas, startPage + maxPagesToShow - 1);

    for (let i = startPage; i <= endPage; i++) {
      pagesToShow.push(i);
    }

    return (
      <div className="hidden sm:flex justify-center items-center gap-2 flex-wrap">
        {paginaActual > 1 && (
          <button
            onClick={() =>
              actualizarQuery({ pagina: String(paginaActual - 1) })
            }
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-sm font-medium text-gray-700 transition"
          >
            <ChevronLeft size={16} />
            Anterior
          </button>
        )}

        {startPage > 1 && (
          <>
            <button
              onClick={() => actualizarQuery({ pagina: "1" })}
              className="px-4 py-2 rounded-lg text-sm font-medium border transition bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              1
            </button>
            {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
          </>
        )}

        {pagesToShow.map((page) => (
          <button
            key={page}
            onClick={() => actualizarQuery({ pagina: String(page) })}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
              paginaActual === page
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < totalPaginas && (
          <>
            {endPage < totalPaginas - 1 && (
              <span className="px-2 text-gray-400">...</span>
            )}
            <button
              onClick={() => actualizarQuery({ pagina: String(totalPaginas) })}
              className="px-4 py-2 rounded-lg text-sm font-medium border transition bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              {totalPaginas}
            </button>
          </>
        )}

        {paginaActual < totalPaginas && (
          <button
            onClick={() =>
              actualizarQuery({ pagina: String(paginaActual + 1) })
            }
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-sm font-medium text-gray-700 transition"
          >
            Siguiente
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    );
  };

  // ✅ AGREGADO: Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-6 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 animate-pulse">
                <div className="aspect-[4/3] bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Empresas Registradas
              </h1>
              <p className="text-gray-600 text-sm sm:text-base mt-1">
                {empresasFiltradas.length} empresa
                {empresasFiltradas.length !== 1 ? "s" : ""} encontrada
                {empresasFiltradas.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Botón filtros móvil */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
            >
              <Filter size={16} />
              Filtros
              {filtrosActivos && (
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div
        className={`bg-white border-b border-gray-200 ${
          showFilters || "hidden sm:block"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provincia
              </label>
              <select
                value={filtro.provincia}
                onChange={(e) => {
                  actualizarQuery({ provincia: e.target.value, pagina: "1" });
                  setShowFilters(false);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las provincias</option>
                {provincias.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localidad
              </label>
              <select
                value={filtro.localidad}
                onChange={(e) => {
                  actualizarQuery({ localidad: e.target.value, pagina: "1" });
                  setShowFilters(false);
                }}
                disabled={!filtro.provincia}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Todas las localidades</option>
                {localidades.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Servicio
              </label>
              <select
                value={filtro.servicio}
                onChange={(e) => {
                  actualizarQuery({ servicio: e.target.value, pagina: "1" });
                  setShowFilters(false);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los servicios</option>
                {serviciosDisponibles.map((nombre) => (
                  <option key={nombre} value={nombre}>
                    {nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordenar por
              </label>
              <select
                value={orden}
                onChange={(e) => {
                  actualizarQuery({ orden: e.target.value, pagina: "1" });
                  setShowFilters(false);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="destacadas">Destacadas primero</option>
                <option value="nombre">Nombre A-Z</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  actualizarQuery({
                    soloDestacadas: soloDestacadas ? "" : "true",
                    pagina: "1",
                  });
                  setShowFilters(false);
                }}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition ${
                  soloDestacadas
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {soloDestacadas ? "Ver todas" : "Solo destacadas"}
              </button>

              {filtrosActivos && (
                <button
                  onClick={() => {
                    limpiarFiltros();
                    setShowFilters(false);
                  }}
                  className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition flex items-center justify-center gap-2"
                >
                  <X size={14} />
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Resultados */}
        {empresasPaginadas.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No se encontraron empresas
            </h3>
            <p className="text-gray-600 mb-6">
              Intentá ajustar los filtros para obtener más resultados
            </p>
            {filtrosActivos && (
              <button
                onClick={limpiarFiltros}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                <X size={16} />
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Grid de empresas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {empresasPaginadas.map((empresa) => (
                <EmpresaCard key={empresa.id} empresa={empresa} />
              ))}
            </div>

            {/* Paginación */}
            <div className="space-y-4">
              {renderPaginationMobile()}
              {renderPaginationDesktop()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}