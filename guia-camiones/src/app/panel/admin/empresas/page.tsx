"use client";

import { useEffect, useState, ChangeEvent } from "react";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import ServicioMultiSelect from "@/components/ui/ServicioMultiSelect";
import { ImageUploader } from "@/components/ui/ImageUploader";
import type { Empresa, EmpresaInput } from "@/types/empresa";
import axios from "axios";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/20/solid";

// Extender Empresa para que sea compatible con DataTable
type EmpresaWithIndex = Empresa & Record<string, unknown>;

export default function EmpresasAdminPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [usuariosEmpresa, setUsuariosEmpresa] = useState<
    { id: number; email: string }[]
  >([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [empresaIdEditar, setEmpresaIdEditar] = useState<number | null>(null);

  const [provincias, setProvincias] = useState<
    { id: string; nombre: string }[]
  >([]);
  const [localidades, setLocalidades] = useState<
    { id: string; nombre: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState<
    Omit<EmpresaInput, "slug"> & {
      servicios: number[];
      usuarioId: number | null;
    }
  >({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    provincia: "",
    localidad: "",
    imagenes: [],
    destacado: false,
    habilitado: true,
    web: "",
    corrientes_de_residuos: "",
    servicios: [],
    usuarioId: null,
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

        const usuariosRes = await fetch("/api/usuarios?rol=EMPRESA");
        const usuariosData = await usuariosRes.json();
        setUsuariosEmpresa(usuariosData);
      } catch (err: unknown) {
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
    setTableLoading(true);
    try {
      const res = await fetch("/api/empresa/admin");
      const data = await res.json();
      console.log("📊 Empresas cargadas desde API:", data); // Debug
      setEmpresas(data);
    } catch (err: unknown) {
      console.error("Error al cargar empresas:", err);
      setError("Error al cargar empresas.");
    } finally {
      setTableLoading(false);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
      imagenes: [],
      destacado: false,
      habilitado: true,
      web: "",
      corrientes_de_residuos: "",
      servicios: [],
      usuarioId: null,
    });
    setEmpresaIdEditar(null);
    setModoEdicion(false);
    setError("");
    setModalAbierto(true);
  };

  const abrirEditar = (empresa: EmpresaWithIndex) => {
    console.log("🔧 Abriendo empresa para editar:", empresa); // Debug
    console.log("🖼️ Imágenes de la empresa:", empresa.imagenes); // Debug

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
      servicios: Array.isArray(empresa.servicios)
        ? (empresa.servicios as { id: number; nombre: string }[]).map((s) =>
            typeof s === "object" ? s.id : s
          )
        : [],
      usuarioId: empresa.usuarioId ?? null,
    });
    setEmpresaIdEditar(empresa.id);
    setModoEdicion(true);
    setError("");
    setModalAbierto(true);
  };

  // ✅ FIX: Función específica para manejar cambios de imágenes
  const handleImagenesChange = async (nuevasImagenes: string[]) => {
    console.log("🔄 handleImagenesChange llamado con:", nuevasImagenes); // Debug

    // Actualizar el estado del formulario inmediatamente
    setForm((prev) => {
      const nuevoForm = { ...prev, imagenes: nuevasImagenes };
      console.log("📝 Form actualizado con nuevas imágenes:", nuevoForm); // Debug
      return nuevoForm;
    });

    // Si estamos en modo edición, actualizar en el servidor automáticamente
    if (modoEdicion && empresaIdEditar !== null) {
      try {
        console.log("🚀 Enviando actualización al servidor..."); // Debug

        // Crear el payload con todas las propiedades del formulario + nuevas imágenes
        const payload = {
          ...form,
          imagenes: nuevasImagenes,
        };

        console.log("📦 Payload a enviar:", payload); // Debug

        const response = await axios.put(
          `/api/empresa/admin/${empresaIdEditar}`,
          payload
        );
        console.log("✅ Respuesta del servidor:", response.data); // Debug

        // Refrescar la tabla para mostrar los cambios
        await fetchEmpresas();

        console.log("🔄 Tabla refrescada correctamente"); // Debug
      } catch (error) {
        console.error("❌ Error al actualizar imágenes en servidor:", error);
        setError("Error al actualizar las imágenes en el servidor.");
      }
    }
  };

  const guardar = async () => {
    if (!form.nombre.trim() || !form.telefono.trim()) {
      setError("El nombre y teléfono son obligatorios.");
      return;
    }

    console.log("💾 Guardando empresa con imagenes:", form.imagenes); // Debug

    setLoading(true);
    try {
      if (modoEdicion && empresaIdEditar !== null) {
        const response = await axios.put(
          `/api/empresa/admin/${empresaIdEditar}`,
          form
        );
        console.log("✅ Empresa actualizada exitosamente:", response.data); // Debug
      } else {
        const response = await axios.post("/api/empresa/admin", form);
        console.log("✅ Empresa creada:", response.data); // Debug

        // Si es una nueva empresa, obtener el ID de la respuesta para futuras ediciones
        if (
          response.data &&
          typeof response.data === "object" &&
          "id" in response.data
        ) {
          const empresaCreada = response.data as { id: number };
          setEmpresaIdEditar(empresaCreada.id);
          setModoEdicion(true);
        }
      }

      // ✅ FIX: Siempre refrescar la tabla después de guardar
      await fetchEmpresas();

      // No cerrar el modal inmediatamente si es una nueva empresa (para permitir agregar imágenes)
      if (modoEdicion) {
        setModalAbierto(false);
      }

      setError("");
    } catch (err: unknown) {
      console.error("❌ Error al guardar empresa:", err);

      let errorMessage = "Error al guardar empresa.";

      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data &&
        typeof err.response.data.message === "string"
      ) {
        errorMessage = err.response.data.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async (empresa: EmpresaWithIndex) => {
    if (!confirm(`¿Eliminar a ${empresa.nombre}?`)) return;
    setLoading(true);
    try {
      await axios.delete(`/api/empresa/admin/${empresa.id}`);
      fetchEmpresas();
    } catch (err: unknown) {
      console.error("Error al eliminar empresa:", err);

      let errorMessage = "Error al eliminar empresa.";

      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data &&
        typeof err.response.data.message === "string"
      ) {
        errorMessage = err.response.data.message;
      }

      alert(errorMessage);
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

  // Convertir empresas para compatibilidad con DataTable
  const empresasConIndex: EmpresaWithIndex[] = empresas.map((empresa) => ({
    ...empresa,
  }));

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <h1 className="text-2xl font-bold">Empresas</h1>
        <button
          onClick={abrirNuevo}
          disabled={loading || tableLoading}
          className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto ${
            loading || tableLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          Nueva Empresa
        </button>
      </div>

      {/* Mensajes globales */}
      {error && !modalAbierto && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={() => setError("")}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      <div className="-mx-4 sm:mx-0 overflow-x-auto">
        <DataTable<EmpresaWithIndex>
          data={empresasConIndex}
          loading={tableLoading}
          searchKeys={["nombre", "email", "direccion", "telefono"]}
          columns={[
            {
              key: "nombre",
              label: "Nombre",
              sortable: true,
              width: "w-1/4",
            },
            {
              key: "email",
              label: "Email",
              sortable: true,
              width: "w-1/4",
            },
            {
              key: "direccion",
              label: "Dirección",
              sortable: true,
              width: "w-1/4",
            },
            {
              key: "telefono",
              label: "Teléfono",
              sortable: true,
              width: "w-1/6",
            },
            {
              key: "destacado",
              label: "Destacada",
              sortable: true,
              render: (empresa: EmpresaWithIndex) =>
                renderBooleanIcon(empresa.destacado as boolean),
              width: "w-1/12",
            },
            {
              key: "habilitado",
              label: "Habilitada",
              sortable: true,
              render: (empresa: EmpresaWithIndex) =>
                renderBooleanIcon(empresa.habilitado as boolean),
              width: "w-1/12",
            },
          ]}
          onEdit={abrirEditar}
          onDelete={eliminar}
          pageSize={15}
        />
      </div>

      <Modal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={modoEdicion ? "Editar Empresa" : "Nueva Empresa"}
      >
        <div className="max-h-[80vh] overflow-y-auto p-1">
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

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Usuario EMPRESA asignado
              </label>
              <select
                name="usuarioId"
                value={form.usuarioId ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    usuarioId: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                className="block w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">Sin asignar</option>
                {usuariosEmpresa.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.email} (ID {usuario.id})
                  </option>
                ))}
              </select>
            </div>

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
                className="block w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">Seleccione una provincia</option>
                {provincias.map((prov) => (
                  <option key={prov.id} value={prov.nombre}>
                    {prov.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Localidad
              </label>
              <select
                name="localidad"
                value={form.localidad}
                onChange={(e) =>
                  setForm({ ...form, localidad: e.target.value })
                }
                className="block w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">Seleccione una localidad</option>
                {localidades.map((loc) => (
                  <option key={loc.id} value={loc.nombre}>
                    {loc.nombre}
                  </option>
                ))}
              </select>
            </div>

            <ServicioMultiSelect
              serviciosSeleccionados={form.servicios}
              onChange={(ids) => setForm({ ...form, servicios: ids })}
            />

            {/* ✅ FIX: ImageUploader con el handler correcto */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Imágenes de la empresa
              </label>
              {modoEdicion && empresaIdEditar ? (
                <ImageUploader
                  empresaId={empresaIdEditar}
                  imagenes={form.imagenes}
                  onChange={handleImagenesChange} // ✅ Usar la función específica
                />
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500 text-sm">
                  Las imágenes se pueden agregar después de crear la empresa
                </div>
              )}
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

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                disabled={loading}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>

              {!modoEdicion && (
                <button
                  type="submit"
                  disabled={loading}
                  className={`bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? "Creando..." : "Crear y Continuar Editando"}
                </button>
              )}

              {modoEdicion && (
                <button
                  type="submit"
                  disabled={loading}
                  className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </button>
              )}
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
