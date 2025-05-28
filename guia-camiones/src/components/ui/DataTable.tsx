"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface Props<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}

export default function DataTable<T extends { nombre?: string }>({
  data,
  columns,
  onEdit,
  onDelete,
}: Props<T>) {
  const hasActions = !!onEdit || !!onDelete;

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(data.length / rowsPerPage);

  // Buscador por nombre
  const [busqueda, setBusqueda] = useState("");

  const datosFiltrados = data.filter((item) =>
    item.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const paginatedData = datosFiltrados.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="space-y-2">
      {/* Buscador */}
      <div className="flex items-center justify-end">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1 text-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 shadow-sm bg-white">
        <div className="relative">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-zinc-100 text-zinc-600 uppercase text-xs tracking-wide sticky top-0 z-10">
              <tr>
                {columns.map((col) => (
                  <th key={String(col.key)} className="px-4 py-3">
                    {col.label}
                  </th>
                ))}
                {hasActions && (
                  <th className="px-4 py-3 text-center">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (hasActions ? 1 : 0)}
                    className="text-center py-6 text-zinc-500"
                  >
                    No se encontraron datos.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-zinc-50 transition-colors duration-150"
                  >
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        className="px-4 py-3 text-zinc-700 whitespace-nowrap"
                      >
                        {col.render ? col.render(item) : String(item[col.key])}
                      </td>
                    ))}
                    {hasActions && (
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="inline-flex gap-3 items-center justify-center">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(item)}
                              className="text-rose-600 hover:text-rose-800 transition"
                              title="Editar"
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(item)}
                              className="text-gray-500 hover:text-red-600 transition"
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
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 py-4 text-sm">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            Anterior
          </button>
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
