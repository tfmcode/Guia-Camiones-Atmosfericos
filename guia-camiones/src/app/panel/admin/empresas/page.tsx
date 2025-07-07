"use client";

import { useEffect, useState, ChangeEvent } from "react";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import type { Empresa, EmpresaInput } from "@/types/empresa";
import axios from "axios";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/20/solid";

export default function EmpresasAdminPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [empresaIdEditar, setEmpresaIdEditar] = useState<number | null>(null);
  
/*   
  const [todosLosServicios, setTodosLosServicios] = useState<
    { id: number; nombre: string }[]
  >([]);
 */

  const [provincias, setProvincias] = useState<
    { id: string; nombre: string }[]
  >([]);
  const [localidades, setLocalidades] = useState<
    { id: string; nombre: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<Omit<EmpresaInput, "slug">>({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    provincia: "",
    localidad: "",
/*     servicios: [],
 */    imagenes: [],
    destacado: false,
    habilitado: true,
    web: "",
    corrientes_de_residuos: "",
  });

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        fetchEmpresas();

        const provinciasRes = await fetch(
          "https://apis.datos.gob.ar/georef/api/provincias?campos=id,nombre"
        );
        const provinciasData = await provinciasRes.json();
        setProvincias(provinciasData.provincias);

      } catch (err) {
        console.error("Error al cargar datos iniciales:", err);
      }
    };

    cargarDatos();
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

  const fetchEmpresas = async () => {
    try {
      const res = await fetch("/api/empresa/admin");
      const data = await res.json();
      setEmpresas(data);
    } catch (error) {
      console.error("Error al cargar empresas:", error);
      alert("Error al cargar empresas.");
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const abrirNuevo = () => {
    setForm({
      nombre: "",
      email: "",
      telefono: "",
      direccion: "",
      provincia: "",
      localidad: "",
/*       servicios: [],
 */      imagenes: [],

      destacado: false,
      habilitado: true,
      web: "",
      corrientes_de_residuos: "",
    });
    setEmpresaIdEditar(null);
    setModoEdicion(false);
    setError("");
    setModalAbierto(true);
  };

  const abrirEditar = (empresa: Empresa) => {
    setForm({
      nombre: empresa.nombre,
      email: empresa.email || "",
      telefono: empresa.telefono,
      direccion: empresa.direccion,
      provincia: empresa.provincia || "",
      localidad: empresa.localidad || "",
      imagenes: empresa.imagenes || [],
      destacado: empresa.destacado,
      habilitado: empresa.habilitado,
      web: empresa.web || "",
      corrientes_de_residuos: empresa.corrientes_de_residuos || "",
    });
    setEmpresaIdEditar(empresa.id);
    setModoEdicion(true);
    setError("");
    setModalAbierto(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim() || !form.telefono.trim()) {
      setError("El nombre y teléfono son obligatorios.");
      return;
    }

    setLoading(true);
    try {
      if (modoEdicion && empresaIdEditar !== null) {
        await axios.put(`/api/empresa/admin/${empresaIdEditar}`, form);
      } else {
        await axios.post("/api/empresa/admin", form);
      }
      setModalAbierto(false);
      fetchEmpresas();
    } catch (error) {
      console.error("Error al guardar empresa:", error);
      alert("Error al guardar empresa.");
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async (empresa: Empresa) => {
    if (!confirm(`¿Eliminar a ${empresa.nombre}?`)) return;
    setLoading(true);
    try {
      await axios.delete(`/api/empresa/admin/${empresa.id}`);
      fetchEmpresas();
    } catch (error) {
      console.error("Error al eliminar empresa:", error);
      alert("Error al eliminar empresa.");
    } finally {
      setLoading(false);
    }
  };

  const renderBooleanIcon = (value: boolean) =>
    value ? (
      <CheckCircleIcon className="h-5 w-5 text-green-500" />
    ) : (
      <XCircleIcon className="h-5 w-5 text-red-500" />
    );

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Empresas</h1>
        <button
          onClick={abrirNuevo}
          disabled={loading}
          className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          Nueva Empresa
        </button>
      </div>

      <DataTable
        data={empresas}
        columns={[
          { key: "nombre", label: "Nombre" },
          { key: "email", label: "Email" },
          { key: "direccion", label: "Dirección" },
          { key: "telefono", label: "Teléfono" },
          {
            key: "destacado",
            label: "Destacada",
            render: (empresa) => renderBooleanIcon(empresa.destacado),
          },
          {
            key: "habilitado",
            label: "Habilitada",
            render: (empresa) => renderBooleanIcon(empresa.habilitado),
          },
        ]}
        onEdit={abrirEditar}
        onDelete={eliminar}
      />

      <Modal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={modoEdicion ? "Editar Empresa" : "Nueva Empresa"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            guardar();
          }}
          className="space-y-4"
        >
          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded text-sm text-center">
              {error}
            </div>
          )}

          <FormField
            label="Nombre"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
          />
          <FormField
            label="Email"
            name="email"
            value={form.email || ""}
            onChange={handleChange}
            type="email"
          />
          <FormField
            label="Teléfono"
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
          />
          <FormField
            label="Dirección"
            name="direccion"
            value={form.direccion}
            onChange={handleChange}
          />
          <FormField
            label="Web"
            name="web"
            value={form.web || ""}
            onChange={handleChange}
          />
          <FormField
            label="Corriente de Residuos"
            name="corrientes_de_residuos"
            value={form.corrientes_de_residuos || ""}
            onChange={handleChange}
          />

          {/* Provincia */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Provincia
            </label>
            <select
              name="provincia"
              value={form.provincia}
              onChange={(e) =>
                setForm({ ...form, provincia: e.target.value, localidad: "" })
              }
              className="block w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Seleccione una provincia</option>
              {provincias.map((prov) => (
                <option key={prov.id} value={prov.nombre}>
                  {prov.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Localidad */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Localidad
            </label>
            <select
              name="localidad"
              value={form.localidad}
              onChange={(e) => setForm({ ...form, localidad: e.target.value })}
              className="block w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Seleccione una localidad</option>
              {localidades.map((loc) => (
                <option key={loc.id} value={loc.nombre}>
                  {loc.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Servicios */}
      {/*     <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Servicios ofrecidos
            </label>
            <select
              multiple
              name="servicios"
              value={form.servicios.map(String)}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, (opt) =>
                  parseInt(opt.value)
                );
                setForm({ ...form, servicios: selected });
              }}
              className="block w-full border border-gray-300 rounded px-3 py-2 h-32"
            >
              {todosLosServicios.map((servicio) => (
                <option key={servicio.id} value={servicio.id}>
                  {servicio.nombre}
                </option>
              ))}
            </select>
          </div> */}

          {/* Checkboxes */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.destacado}
                onChange={(e) =>
                  setForm({ ...form, destacado: e.target.checked })
                }
              />
              Destacada
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.habilitado}
                onChange={(e) =>
                  setForm({ ...form, habilitado: e.target.checked })
                }
              />
              Habilitada
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
