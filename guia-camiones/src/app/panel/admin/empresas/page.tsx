"use client";

import { useEffect, useState, ChangeEvent } from "react";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import type { Empresa, EmpresaInput } from "@/types/empresa";
import axios from "axios";

export default function EmpresasAdminPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [empresaIdEditar, setEmpresaIdEditar] = useState<number | null>(null);

  const [form, setForm] = useState<EmpresaInput>({
    nombre: "",
    slug: "",
    email: "",
    telefono: "",
    direccion: "",
    provincia: "",
    localidad: "",
    servicios: [],
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

  useEffect(() => {
    fetchEmpresas();
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

  const fetchEmpresas = async () => {
    const res = await fetch("/api/empresa/admin");
    const data = await res.json();
    setEmpresas(data);
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const abrirNuevo = () => {
    setForm({
      nombre: "",
      slug: "",
      email: "",
      telefono: "",
      direccion: "",
      provincia: "",
      localidad: "",
      servicios: [],
      imagenes: [],
      destacado: false,
      habilitado: true,
    });
    setEmpresaIdEditar(null);
    setModoEdicion(false);
    setModalAbierto(true);
  };

  const abrirEditar = (empresa: Empresa) => {
    setForm({
      nombre: empresa.nombre,
      slug: empresa.slug,
      email: empresa.email || "",
      telefono: empresa.telefono,
      direccion: empresa.direccion,
      provincia: empresa.provincia || "",
      localidad: empresa.localidad || "",
      servicios: empresa.servicios,
      imagenes: empresa.imagenes,
      destacado: empresa.destacado,
      habilitado: empresa.habilitado,
    });
    setEmpresaIdEditar(empresa.id);
    setModoEdicion(true);
    setModalAbierto(true);
  };

  const guardar = async () => {
    if (modoEdicion && empresaIdEditar !== null) {
      await axios.put(`/api/empresa/admin/${empresaIdEditar}`, form);
    } else {
      await axios.post("/api/empresa/admin", form);
    }
    setModalAbierto(false);
    fetchEmpresas();
  };

  const eliminar = async (empresa: Empresa) => {
    if (confirm(`¿Eliminar a ${empresa.nombre}?`)) {
      await axios.delete(`/api/empresa/admin/${empresa.id}`);
      fetchEmpresas();
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Empresas</h1>
        <button
          onClick={abrirNuevo}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Nueva Empresa
        </button>
      </div>

      <DataTable
        data={empresas}
        columns={[
          { key: "nombre", label: "Nombre" },
          { key: "provincia", label: "Provincia" },
          { key: "localidad", label: "Localidad" },
          { key: "telefono", label: "Teléfono" },
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

          {/* Select de provincia */}
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

          {/* Select de localidad */}
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
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Guardar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
