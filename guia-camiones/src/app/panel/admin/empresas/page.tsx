"use client";

import { useEffect, useState } from "react";
import type { Empresa } from "@/types/empresa";

export default function AdminEmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  useEffect(() => {
    // Simulación de fetch a backend
    setEmpresas([
      {
        id: 1,
        slug: "camion-norte",
        nombre: "Camión Norte",
        email: "norte@email.com",
        telefono: "1111-1111",
        direccion: "Calle 123",
        provincia: "Buenos Aires",
        localidad: "San Isidro",
        servicios: ["Desagote", "Pozos"],
        imagenes: [],
        destacado: true,
        habilitado: true,
        fechaCreacion: "2024-01-01",
        usuarioId: 1,
      },
      {
        id: 2,
        slug: "pozos-sur",
        nombre: "Pozos del Sur",
        email: "",
        telefono: "2222-2222",
        direccion: "Avenida 456",
        provincia: "Santa Fe",
        localidad: "Rosario",
        servicios: ["Limpieza"],
        imagenes: [],
        destacado: false,
        habilitado: false,
        fechaCreacion: "2024-02-10",
        usuarioId: 2,
      },
    ]);
  }, []);

  const toggleHabilitado = (id: number) => {
    setEmpresas((empresas) =>
      empresas.map((e) =>
        e.id === id ? { ...e, habilitado: !e.habilitado } : e
      )
    );
  };

  const toggleDestacado = (id: number) => {
    setEmpresas((empresas) =>
      empresas.map((e) => (e.id === id ? { ...e, destacado: !e.destacado } : e))
    );
  };

  const eliminarEmpresa = (id: number) => {
    if (confirm("¿Estás seguro de eliminar esta empresa?")) {
      setEmpresas((empresas) => empresas.filter((e) => e.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Empresas Registradas</h1>

      {empresas.length === 0 ? (
        <p className="text-gray-500">No hay empresas registradas.</p>
      ) : (
        <table className="w-full border text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">Nombre</th>
              <th className="p-2">Provincia</th>
              <th className="p-2">Habilitado</th>
              <th className="p-2">Destacado</th>
              <th className="p-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empresas.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-2">{e.nombre}</td>
                <td className="p-2">{e.provincia}</td>
                <td className="p-2">
                  <button
                    onClick={() => toggleHabilitado(e.id)}
                    className={`text-xs px-2 py-1 rounded ${
                      e.habilitado
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {e.habilitado ? "Sí" : "No"}
                  </button>
                </td>
                <td className="p-2">
                  <button
                    onClick={() => toggleDestacado(e.id)}
                    className={`text-xs px-2 py-1 rounded ${
                      e.destacado
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {e.destacado ? "★" : "☆"}
                  </button>
                </td>
                <td className="p-2 text-right">
                  <button
                    onClick={() => eliminarEmpresa(e.id)}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
