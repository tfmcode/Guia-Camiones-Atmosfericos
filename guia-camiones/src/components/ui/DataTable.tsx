"use client";

import { useState, useMemo } from "react";
import {
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";

interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

interface Props<T extends Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
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
  searchable = true,
  searchKeys = ["nombre" as keyof T],
  pageSize = 10,
  loading = false,
}: Props<T>) {
  const hasActions = !!onEdit || !!onDelete;

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
      <td colSpan={columns.length + (hasActions ? 1 : 0)} className="p-4">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-4 gap-4">
              {Array.from({
                length: columns.length + (hasActions ? 1 : 0),
              }).map((_, j) => (
                <div
                  key={j}
                  className="h-4 bg-gray-200 rounded animate-pulse"
                />
              ))}
            </div>
          ))}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-4">
      {/* Header con búsqueda y estadísticas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">
            {processedData.length}{" "}
            {processedData.length === 1 ? "resultado" : "resultados"}
          </span>
          {busqueda && (
            <span className="text-gray-500">
              de {data.length} total{data.length !== 1 ? "es" : ""}
            </span>
          )}
        </div>

        {searchable && (
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar..."
              value={busqueda}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
            />
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    onClick={() => handleSort(col.key)}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      col.sortable
                        ? "cursor-pointer hover:bg-gray-100 select-none"
                        : ""
                    } ${col.width || ""}`}
                  >
                    <div className="flex items-center gap-1">
                      <span>{col.label}</span>
                      {col.sortable && (
                        <div className="flex flex-col">
                          <span
                            className={`text-xs ${
                              sortKey === col.key && sortDirection === "asc"
                                ? "text-blue-600"
                                : "text-gray-300"
                            }`}
                          >
                            ▲
                          </span>
                          <span
                            className={`text-xs ${
                              sortKey === col.key && sortDirection === "desc"
                                ? "text-blue-600"
                                : "text-gray-300"
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
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <LoadingSkeleton />
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (hasActions ? 1 : 0)}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Search size={32} className="text-gray-300" />
                      <p className="text-lg font-medium">
                        No se encontraron resultados
                      </p>
                      {busqueda ? (
                        <p className="text-sm">
                          Intenta ajustar tu búsqueda o{" "}
                          <button
                            onClick={() => handleSearch("")}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            borrar filtros
                          </button>
                        </p>
                      ) : (
                        <p className="text-sm">No hay datos para mostrar</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {col.render
                          ? col.render(item)
                          : String(item[col.key] || "-")}
                      </td>
                    ))}
                    {hasActions && (
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(item)}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                              title="Editar"
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(item)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
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

      {/* Paginación */}
      {totalPages > 1 && !loading && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            Mostrando{" "}
            {Math.min((currentPage - 1) * pageSize + 1, processedData.length)} a{" "}
            {Math.min(currentPage * pageSize, processedData.length)} de{" "}
            {processedData.length} resultados
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} />
            </button>

            {getVisiblePages().map((page, idx) => (
              <button
                key={idx}
                onClick={() =>
                  typeof page === "number" ? goToPage(page) : undefined
                }
                disabled={page === "..."}
                className={`px-3 py-2 text-sm rounded-lg transition-all ${
                  page === currentPage
                    ? "bg-blue-600 text-white"
                    : page === "..."
                    ? "text-gray-400 cursor-default"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {page === "..." ? <MoreHorizontal size={16} /> : page}
              </button>
            ))}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
