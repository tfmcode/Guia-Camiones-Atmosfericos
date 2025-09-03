"use client";

import { useState, useMemo } from "react";
import {
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Settings,
} from "lucide-react";

interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
  sticky?: boolean; // ✅ NUEVO: Para columnas fijas
}

interface Props<T extends Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void; // ✅ NUEVO: Opción para ver detalles
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  pageSize?: number;
  loading?: boolean;
}

type SortDirection = "asc" | "desc" | null;

export default function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  onEdit,
  onDelete,
  onView,
  searchable = true,
  searchKeys = ["nombre" as keyof T],
  pageSize = 10,
  loading = false,
}: Props<T>) {
  const hasActions = !!onEdit || !!onDelete || !!onView;

  const [currentPage, setCurrentPage] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Filtrado y ordenado
  const processedData = useMemo(() => {
    let filtered = data;

    // Filtrar por búsqueda
    if (busqueda.trim()) {
      filtered = data.filter((item) =>
        searchKeys.some((key) =>
          String(item[key] || "")
            .toLowerCase()
            .includes(busqueda.toLowerCase())
        )
      );
    }

    // Ordenar
    if (sortKey && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];

        if (aVal === bVal) return 0;

        const comparison = aVal < bVal ? -1 : 1;
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data, busqueda, searchKeys, sortKey, sortDirection]);

  // Paginación
  const totalPages = Math.ceil(processedData.length / pageSize);
  const paginatedData = processedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Manejar ordenamiento
  const handleSort = (key: keyof T) => {
    const column = columns.find((col) => col.key === key);
    if (!column?.sortable) return;

    if (sortKey === key) {
      setSortDirection((prev) =>
        prev === "asc" ? "desc" : prev === "desc" ? null : "asc"
      );
      if (sortDirection === "desc") {
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // Navegación de páginas
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Reset de página al buscar
  const handleSearch = (value: string) => {
    setBusqueda(value);
    setCurrentPage(1);
  };

  // Generar páginas visibles
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const LoadingSkeleton = () => (
    <tr>
      <td colSpan={columns.length + (hasActions ? 1 : 0)} className="p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="grid grid-cols-4 gap-4">
              {Array.from({
                length: columns.length + (hasActions ? 1 : 0),
              }).map((_, j) => (
                <div
                  key={j}
                  className="h-5 bg-gray-200 rounded animate-pulse"
                />
              ))}
            </div>
          ))}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* ✅ MEJORADO: Header más espacioso */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="font-medium text-gray-900">
              {processedData.length}{" "}
              {processedData.length === 1 ? "resultado" : "resultados"}
            </span>
            {busqueda && (
              <span className="text-gray-500 text-xs">
                de {data.length} total{data.length !== 1 ? "es" : ""}
              </span>
            )}
          </div>

          {searchable && (
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Buscar empresas..."
                value={busqueda}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full lg:w-80 bg-gray-50 focus:bg-white transition-all"
              />
            </div>
          )}
        </div>
      </div>

      {/* ✅ MEJORADO: Contenedor de tabla con mejor scroll */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
        {/* ✅ NUEVO: Scroll horizontal mejorado */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="min-w-full">
            <table className="w-full divide-y divide-gray-200">
              {/* ✅ MEJORADO: Header más visible */}
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={String(col.key)}
                      onClick={() => col.sortable && handleSort(col.key)}
                      className={`px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 last:border-r-0 ${
                        col.sortable
                          ? "cursor-pointer hover:bg-gray-200 select-none transition-colors"
                          : ""
                      } ${col.width || "min-w-[120px]"} ${
                        col.sticky ? "sticky left-0 bg-gray-50 z-20" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{col.label}</span>
                        {col.sortable && (
                          <div className="flex flex-col">
                            <span
                              className={`text-xs leading-none ${
                                sortKey === col.key && sortDirection === "asc"
                                  ? "text-blue-600"
                                  : "text-gray-400"
                              }`}
                            >
                              ▲
                            </span>
                            <span
                              className={`text-xs leading-none ${
                                sortKey === col.key && sortDirection === "desc"
                                  ? "text-blue-600"
                                  : "text-gray-400"
                              }`}
                            >
                              ▼
                            </span>
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                  {hasActions && (
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider bg-gray-50 sticky right-0 z-20 min-w-[140px] border-l border-gray-200">
                      <div className="flex items-center justify-center gap-1">
                        <Settings size={14} />
                        <span>Acciones</span>
                      </div>
                    </th>
                  )}
                </tr>
              </thead>

              {/* ✅ MEJORADO: Body con mejor espaciado */}
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <LoadingSkeleton />
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + (hasActions ? 1 : 0)}
                      className="px-6 py-16 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <Search size={24} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-gray-900 mb-2">
                            No se encontraron resultados
                          </p>
                          {busqueda ? (
                            <p className="text-sm text-gray-500">
                              Intenta ajustar tu búsqueda o{" "}
                              <button
                                onClick={() => handleSearch("")}
                                className="text-blue-600 hover:text-blue-700 font-medium underline"
                              >
                                limpiar filtros
                              </button>
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500">
                              No hay datos para mostrar
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-blue-50 transition-colors duration-200 group"
                    >
                      {columns.map((col) => (
                        <td
                          key={String(col.key)}
                          className={`px-6 py-4 text-sm text-gray-900 border-r border-gray-100 last:border-r-0 ${
                            col.sticky
                              ? "sticky left-0 bg-white group-hover:bg-blue-50 z-10"
                              : ""
                          }`}
                        >
                          <div className="max-w-xs overflow-hidden">
                            {col.render
                              ? col.render(item)
                              : String(item[col.key] || "-")}
                          </div>
                        </td>
                      ))}
                      {hasActions && (
                        <td className="px-4 py-4 text-center sticky right-0 bg-white group-hover:bg-blue-50 z-10 border-l border-gray-100">
                          <div className="flex items-center justify-center gap-2">
                            {onView && (
                              <button
                                onClick={() => onView(item)}
                                className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 group/btn"
                                title="Ver detalles"
                              >
                                <Eye size={16} />
                              </button>
                            )}
                            {onEdit && (
                              <button
                                onClick={() => onEdit(item)}
                                className="p-2.5 text-gray-500 hover:text-green-600 hover:bg-green-100 rounded-lg transition-all duration-200 group/btn"
                                title="Editar"
                              >
                                <Pencil size={16} />
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() => onDelete(item)}
                                className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 group/btn"
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ✅ MEJORADO: Paginación integrada */}
        {totalPages > 1 && !loading && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600 font-medium">
                Mostrando{" "}
                <span className="text-gray-900">
                  {Math.min(
                    (currentPage - 1) * pageSize + 1,
                    processedData.length
                  )}
                </span>{" "}
                a{" "}
                <span className="text-gray-900">
                  {Math.min(currentPage * pageSize, processedData.length)}
                </span>{" "}
                de{" "}
                <span className="text-gray-900 font-semibold">
                  {processedData.length}
                </span>{" "}
                resultados
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm border border-gray-200"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="flex items-center gap-1">
                  {getVisiblePages().map((page, idx) => (
                    <button
                      key={idx}
                      onClick={() =>
                        typeof page === "number" ? goToPage(page) : undefined
                      }
                      disabled={page === "..."}
                      className={`px-4 py-2 text-sm rounded-lg transition-all border ${
                        page === currentPage
                          ? "bg-blue-600 text-white border-blue-600 shadow-md"
                          : page === "..."
                          ? "text-gray-400 cursor-default border-transparent"
                          : "text-gray-700 hover:text-gray-900 hover:bg-white border-gray-200 shadow-sm"
                      }`}
                    >
                      {page === "..." ? <MoreHorizontal size={16} /> : page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm border border-gray-200"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ NUEVO: Estilos para scrollbar personalizado */}
      <style jsx global>{`
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 0.25rem;
        }
        .scrollbar-track-gray-100::-webkit-scrollbar-track {
          background-color: #f3f4f6;
        }
        .scrollbar-thin::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
      `}</style>
    </div>
  );
}
