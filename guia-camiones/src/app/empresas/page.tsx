"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import EmpresaCard from "@/components/empresas/EmpresasCard";
import { getEmpresas } from "@/lib/api/empresaService";
import type { Empresa } from "@/types/empresa";

const EmpresasPage = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Parámetros de búsqueda
  const filtro = {
    provincia: searchParams.get("provincia") || "",
    localidad: searchParams.get("localidad") || "",
    servicio: searchParams.get("servicio") || "",
  };

  const orden = searchParams.get("orden") || "destacadas";
  const soloDestacadas = searchParams.get("soloDestacadas") === "true";
  const paginaActual = parseInt(searchParams.get("pagina") || "1", 10);
  const empresasPorPagina = 9;

  // Cargar empresas
  useEffect(() => {
    getEmpresas().then(setEmpresas);
  }, []);

  // Lógica de filtrado
  const filtrar = (empresa: Empresa) => {
    const matchProvincia = filtro.provincia
      ? empresa.provincia
          ?.toLowerCase()
          .includes(filtro.provincia.toLowerCase())
      : true;
    const matchLocalidad = filtro.localidad
      ? empresa.localidad
          ?.toLowerCase()
          .includes(filtro.localidad.toLowerCase())
      : true;
    const matchServicio = filtro.servicio
      ? empresa.servicios?.some((s) =>
          s.toLowerCase().includes(filtro.servicio.toLowerCase())
        )
      : true;
    const matchDestacadas = soloDestacadas ? empresa.destacado : true;

    return matchProvincia && matchLocalidad && matchServicio && matchDestacadas;
  };

  const empresasFiltradas = empresas.filter(filtrar);

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
      if (value === "") {
        query.delete(key);
      } else {
        query.set(key, value);
      }
    });
    router.push(`/empresas?${query.toString()}`);
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Empresas Registradas</h1>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Provincia"
          value={filtro.provincia}
          onChange={(e) =>
            actualizarQuery({ provincia: e.target.value, pagina: "1" })
          }
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Localidad"
          value={filtro.localidad}
          onChange={(e) =>
            actualizarQuery({ localidad: e.target.value, pagina: "1" })
          }
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Servicio"
          value={filtro.servicio}
          onChange={(e) =>
            actualizarQuery({ servicio: e.target.value, pagina: "1" })
          }
          className="border p-2 rounded w-full"
        />

        <div className="md:col-span-1">
          <label className="text-sm block mb-1">Ordenar por</label>
          <select
            value={orden}
            onChange={(e) =>
              actualizarQuery({ orden: e.target.value, pagina: "1" })
            }
            className="border p-2 rounded w-full"
          >
            <option value="destacadas">Destacadas primero</option>
            <option value="nombre">Nombre A-Z</option>
          </select>
        </div>

        <div className="md:col-span-1 flex items-end">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={soloDestacadas}
              onChange={(e) =>
                actualizarQuery({
                  soloDestacadas: String(e.target.checked),
                  pagina: "1",
                })
              }
            />
            <span className="text-sm">Solo destacadas</span>
          </label>
        </div>
      </div>

      {/* Resultados */}
      {empresasPaginadas.length === 0 ? (
        <p className="text-gray-500">
          No se encontraron empresas con esos filtros.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {empresasPaginadas.map((empresa) => (
              <EmpresaCard key={empresa.id} empresa={empresa} />
            ))}
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalPaginas }, (_, i) => (
                <button
                  key={i}
                  onClick={() => actualizarQuery({ pagina: String(i + 1) })}
                  className={`px-3 py-1 border rounded ${
                    paginaActual === i + 1
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmpresasPage;
