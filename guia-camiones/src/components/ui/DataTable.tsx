"use client";

import { Pencil, Trash2 } from "lucide-react";

interface Column<T> {
  key: keyof T;
  label: string;
}

interface Props<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}

export default function DataTable<T>({
  data,
  columns,
  onEdit,
  onDelete,
}: Props<T>) {
  const hasActions = !!onEdit || !!onDelete;

  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 shadow-sm bg-white">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-zinc-100 text-zinc-600 uppercase text-xs tracking-wide">
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} className="px-4 py-3">
                {col.label}
              </th>
            ))}
            {hasActions && <th className="px-4 py-3 text-center">Acciones</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (hasActions ? 1 : 0)}
                className="text-center py-6 text-zinc-500"
              >
                No hay datos disponibles.
              </td>
            </tr>
          ) : (
            data.map((item, idx) => (
              <tr
                key={idx}
                className="hover:bg-zinc-50 transition-colors duration-150"
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className="px-4 py-3 text-zinc-700 whitespace-nowrap"
                  >
                    {String(item[col.key])}
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
  );
}
