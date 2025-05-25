"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import EmpresaCard from "@/components/empresas/EmpresasCard";
import { getEmpresas } from "@/lib/api/empresaService";
import type { Empresa } from "@/types/empresa";
import { ChevronLeft, ChevronRight } from "lucide-react";

const EmpresasPage = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [provincias, setProvincias] = useState<string[]>([]);
  const [localidades, setLocalidades] = useState<string[]>([]);
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

  useEffect(() => {
    getEmpresas().then(setEmpresas);
  }, []);

  useEffect(() => {
    fetch("https://apis.datos.gob.ar/georef/api/provincias?campos=nombre")
      .then((res) => res.json())
      .then((data) =>
        setProvincias(
          data.provincias.map((p: { nombre: string }) => p.nombre)
        )
      );
  }, []);

  useEffect(() => {
    if (filtro.provincia) {
      fetch(
        `https://apis.datos.gob.ar/georef/api/municipios?provincia=${filtro.provincia}&campos=nombre&max=1000`
      )
        .then((res) => res.json())
        .then((data) =>
          setLocalidades(data.municipios.map((m: { nombre: string }) => m.nombre))
        );
    } else {
      setLocalidades([]);
    }
  }, [filtro.provincia]);

  const filtrar = (empresa: Empresa) => {
    const matchProvincia = filtro.provincia
      ? empresa.provincia === filtro.provincia
      : true;
    const matchLocalidad = filtro.localidad
      ? empresa.localidad === filtro.localidad
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
      if (value === "") query.delete(key);
      else query.set(key, value);
    });
    router.push(`/empresas?${query.toString()}`);
  };

  return (
    <div className="p-6 space-y-12">
      <h1 className="text-3xl font-bold text-gray-800 text-center">
        Empresas Registradas
      </h1>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-xl shadow ring-1 ring-gray-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Provincia
          </label>
          <select
            value={filtro.provincia}
            onChange={(e) =>
              actualizarQuery({ provincia: e.target.value, pagina: "1" })
            }
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="">Seleccioná una provincia</option>
            {provincias.map((prov) => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Localidad
          </label>
          <select
            value={filtro.localidad}
            onChange={(e) =>
              actualizarQuery({ localidad: e.target.value, pagina: "1" })
            }
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="">Seleccioná una localidad</option>
            {localidades.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Servicio
          </label>
          <input
            type="text"
            placeholder="Ej: Desagote"
            value={filtro.servicio}
            onChange={(e) =>
              actualizarQuery({ servicio: e.target.value, pagina: "1" })
            }
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ordenar por
          </label>
          <select
            value={orden}
            onChange={(e) =>
              actualizarQuery({ orden: e.target.value, pagina: "1" })
            }
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="destacadas">Destacadas primero</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() =>
              actualizarQuery({
                soloDestacadas: soloDestacadas ? "" : "true",
                pagina: "1",
              })
            }
            className={`w-full px-3 py-2 rounded-full text-sm font-semibold transition shadow-sm focus:outline-none ${
              soloDestacadas
                ? "bg-rose-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {soloDestacadas ? "Ver todas" : "Solo destacadas"}
          </button>
        </div>
      </div>

      {/* Resultados */}
      {empresasPaginadas.length === 0 ? (
        <p className="text-gray-500 text-center">
          No se encontraron empresas con esos filtros.
        </p>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 mt-4">
            {empresasPaginadas.map((empresa) => (
              <EmpresaCard key={empresa.id} empresa={empresa} />
            ))}
          </div>

          <div className="flex justify-center gap-2 mt-10 flex-wrap">
            {paginaActual > 1 && (
              <button
                onClick={() =>
                  actualizarQuery({ pagina: String(paginaActual - 1) })
                }
                className="flex items-center gap-1 px-3 py-2 rounded-md bg-white border border-gray-300 hover:bg-gray-100 text-sm"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
            )}

            {Array.from({ length: totalPaginas }, (_, i) => (
              <button
                key={i}
                onClick={() => actualizarQuery({ pagina: String(i + 1) })}
                className={`px-4 py-2 rounded-md text-sm font-medium border transition ${
                  paginaActual === i + 1
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                {i + 1}
              </button>
            ))}

            {paginaActual < totalPaginas && (
              <button
                onClick={() =>
                  actualizarQuery({ pagina: String(paginaActual + 1) })
                }
                className="flex items-center gap-1 px-3 py-2 rounded-md bg-white border border-gray-300 hover:bg-gray-100 text-sm"
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default EmpresasPage;
