"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface Servicio {
  id: number;
  nombre: string;
}

interface Props {
  serviciosSeleccionados: number[];
  onChange: (ids: number[]) => void;
}

export default function ServicioMultiSelect({
  serviciosSeleccionados,
  onChange,
}: Props) {
  const [query, setQuery] = useState("");
  const [sugerencias, setSugerencias] = useState<Servicio[]>([]);

  useEffect(() => {
    const fetchServicios = async () => {
      if (query.length < 2) {
        setSugerencias([]);
        return;
      }
      try {
        const res = await axios.get<Servicio[]>(`/api/servicios?q=${query}`);
        setSugerencias(res.data);
      } catch (error) {
        console.error("Error al buscar servicios:", error);
      }
    };

    const timeout = setTimeout(fetchServicios, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const agregarServicio = (servicio: Servicio) => {
    if (!serviciosSeleccionados.includes(servicio.id)) {
      onChange([...serviciosSeleccionados, servicio.id]);
    }
    setQuery("");
    setSugerencias([]);
  };

  const quitarServicio = (id: number) => {
    onChange(serviciosSeleccionados.filter((sid) => sid !== id));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium mb-1">
        Servicios brindados
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar servicios..."
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1c2e39] transition"
      />
      {sugerencias.length > 0 && (
        <ul className="border border-gray-300 rounded-lg bg-white max-h-40 overflow-auto">
          {sugerencias.map((s) => (
            <li
              key={s.id}
              onClick={() => agregarServicio(s)}
              className="px-3 py-2 hover:bg-zinc-100 cursor-pointer text-sm"
            >
              {s.nombre}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2 mt-2">
        {serviciosSeleccionados.map((id) => {
          const servicio = sugerencias.find((s) => s.id === id) || {
            id,
            nombre: `ID: ${id}`,
          };
          return (
            <span
              key={id}
              className="bg-blue-100 text-blue-800 px-2 py-1.5 rounded-full flex items-center gap-1 text-sm"
            >
              {servicio.nombre}
              <button
                onClick={() => quitarServicio(id)}
                className="text-blue-500 hover:text-blue-700 p-1 rounded focus:outline-none"
                aria-label="Quitar servicio"
              >
                &times;
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}
