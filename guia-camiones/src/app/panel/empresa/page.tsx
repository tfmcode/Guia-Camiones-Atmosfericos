"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { EmpresaInput } from "@/types";
import { useRouter } from "next/navigation";

export default function PanelEmpresa() {
  const [form, setForm] = useState<EmpresaInput>({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    provincia: "",
    localidad: "",
    web: "",
    corrientes_de_residuos: "",
    imagenes: [],
    destacado: false,
    habilitado: true,
  });

  const [provincias, setProvincias] = useState<
    { id: string; nombre: string }[]
  >([]);
  const [localidades, setLocalidades] = useState<
    { id: string; nombre: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchEmpresa = async () => {
      try {
        const res = await axios.get<{ empresa: EmpresaInput }>("/api/empresa/me", {
          withCredentials: true,
        });
        const { empresa } = res.data;

        setForm({
          nombre: empresa.nombre ?? "",
          email: empresa.email ?? "",
          telefono: empresa.telefono ?? "",
          direccion: empresa.direccion ?? "",
          provincia: empresa.provincia ?? "",
          localidad: empresa.localidad ?? "",
          web: empresa.web ?? "",
          corrientes_de_residuos: empresa.corrientes_de_residuos ?? "",
          imagenes: empresa.imagenes ?? [],
          destacado: empresa.destacado ?? false,
          habilitado: empresa.habilitado ?? true,
        });
      } catch (error) {
        console.error("Error al obtener datos de empresa:", error);
        setError("Error al cargar los datos de la empresa.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmpresa();

    fetch("https://apis.datos.gob.ar/georef/api/provincias?campos=id,nombre")
      .then((res) => res.json())
      .then((data) => setProvincias(data.provincias));
  }, []);

  useEffect(() => {
    if (form.provincia) {
      fetch(
        `https://apis.datos.gob.ar/georef/api/municipios?provincia=${form.provincia}&campos=id,nombre&max=1000`
      )
        .then((res) => res.json())
        .then((data) => setLocalidades(data.municipios));
    }
  }, [form.provincia]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await axios.put("/api/empresa/me", form, { withCredentials: true });
      alert("Datos actualizados correctamente");
      router.refresh();
    } catch (error) {
      console.error("Error al actualizar los datos", error);
      setError("Error al actualizar los datos. Intente nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center py-8">Cargando datos...</p>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Mi Empresa</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-6 rounded shadow"
      >
        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded text-center text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Teléfono</label>
          <input
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Dirección</label>
          <input
            name="direccion"
            value={form.direccion}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Provincia</label>
            <select
              name="provincia"
              value={form.provincia}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Seleccioná una provincia</option>
              {provincias.map((prov) => (
                <option key={prov.id} value={prov.nombre}>
                  {prov.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Localidad</label>
            <select
              name="localidad"
              value={form.localidad}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Seleccioná una localidad</option>
              {localidades.map((loc) => (
                <option key={loc.id} value={loc.nombre}>
                  {loc.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Sitio web</label>
          <input
            name="web"
            value={form.web}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Corrientes de servicios
          </label>
          <textarea
            name="corrientes_de_residuos"
            value={form.corrientes_de_residuos}
            onChange={handleChange}
            placeholder="Detalle las corrientes de servicios que maneja su empresa..."
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className={`w-full bg-[#1c2e39] text-white px-6 py-2 rounded transition ${
            saving ? "opacity-50 cursor-not-allowed" : "hover:bg-[#14212f]"
          }`}
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
