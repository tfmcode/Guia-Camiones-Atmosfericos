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
import { Building2, Plus, Eye, MapPin, Phone } from "lucide-react";
import { esCaba, getBarriosFormateados } from "@/constants/barrios";

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
    const cargarLocalidades = async () => {
      if (!form.provincia) {
        setLocalidades([]);
        return;
      }

      try {
        // ✅ Detectar si es CABA
        if (esCaba(form.provincia)) {
          console.log("🏙️ Cargando barrios de CABA...");
          const barrios = getBarriosFormateados();
          setLocalidades(barrios);
          console.log(`✅ ${barrios.length} barrios de CABA cargados`);
          return;
        }

        // ✅ Para el resto de provincias usar la API normal
        console.log(`🌎 Cargando municipios de ${form.provincia}...`);

        const response = await fetch(
          `https://apis.datos.gob.ar/georef/api/municipios?provincia=${encodeURIComponent(
            form.provincia
          )}&campos=id,nombre&max=1000`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const municipios = data.municipios || [];

        setLocalidades(municipios);
        console.log(
          `✅ ${municipios.length} municipios cargados para ${form.provincia}`
        );
      } catch (error) {
        console.error("❌ Error cargando localidades:", error);
        setLocalidades([]);

        // Fallback para CABA
        if (esCaba(form.provincia)) {
          console.log("🔄 Usando fallback para barrios de CABA...");
          setLocalidades(getBarriosFormateados());
        }
      }
    };

    cargarLocalidades();
  }, [form.provincia]);

  const fetchEmpresas = async () => {
    setTableLoading(true);
    try {
      const res = await fetch("/api/empresa/admin");
      const data = await res.json();
      console.log("📊 Empresas cargadas desde API:", data);
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
    console.log("🔧 Abriendo empresa para editar:", empresa);

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

  // ✅ NUEVO: Función para ver detalles (perfil público)
  const verDetalles = (empresa: EmpresaWithIndex) => {
    window.open(`/empresas/${empresa.slug}`, "_blank");
  };

  const handleImagenesChange = async (nuevasImagenes: string[]) => {
    console.log("🔄 handleImagenesChange llamado con:", nuevasImagenes);

    setForm((prev) => {
      const nuevoForm = { ...prev, imagenes: nuevasImagenes };
      console.log("📝 Form actualizado con nuevas imágenes:", nuevoForm);
      return nuevoForm;
    });

    if (modoEdicion && empresaIdEditar !== null) {
      try {
        console.log("🚀 Enviando actualización al servidor...");

        const payload = {
          ...form,
          imagenes: nuevasImagenes,
        };

        console.log("📦 Payload a enviar:", payload);

        const response = await axios.put(
          `/api/empresa/admin/${empresaIdEditar}`,
          payload
        );
        console.log("✅ Respuesta del servidor:", response.data);

        await fetchEmpresas();
        console.log("🔄 Tabla refrescada correctamente");
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

    console.log("💾 Guardando empresa con imagenes:", form.imagenes);

    setLoading(true);
    try {
      if (modoEdicion && empresaIdEditar !== null) {
        const response = await axios.put(
          `/api/empresa/admin/${empresaIdEditar}`,
          form
        );
        console.log("✅ Empresa actualizada exitosamente:", response.data);
      } else {
        const response = await axios.post("/api/empresa/admin", form);
        console.log("✅ Empresa creada:", response.data);

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

      await fetchEmpresas();

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

  // ✅ MEJORADO: Render de estados con mejor diseño
  const renderBooleanIcon = (value: boolean) =>
    value ? (
      <div className="flex items-center gap-2">
        <CheckCircleIcon className="h-5 w-5 text-green-500" />
        <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
          Activa
        </span>
      </div>
    ) : (
      <div className="flex items-center gap-2">
        <XCircleIcon className="h-5 w-5 text-red-500" />
        <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full">
          Inactiva
        </span>
      </div>
    );

  // ✅ NUEVO: Render de ubicación optimizado
  const renderUbicacion = (empresa: EmpresaWithIndex) => (
    <div className="space-y-1">
      {empresa.direccion && (
        <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
          {empresa.direccion}
        </div>
      )}
      {(empresa.localidad || empresa.provincia) && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <MapPin size={12} />
          <span className="truncate">
            {[empresa.localidad, empresa.provincia].filter(Boolean).join(", ")}
          </span>
        </div>
      )}
    </div>
  );

  // ✅ NUEVO: Render de contacto optimizado
  const renderContacto = (empresa: EmpresaWithIndex) => (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
        <Phone size={12} />
        <span className="truncate">{empresa.telefono}</span>
      </div>
      {empresa.email && (
        <div className="text-xs text-gray-500 truncate max-w-[180px]">
          {empresa.email}
        </div>
      )}
    </div>
  );

  // ✅ NUEVO: Render del nombre con servicios
  const renderNombreConServicios = (empresa: EmpresaWithIndex) => (
    <div className="space-y-2">
      <div className="font-semibold text-gray-900 text-sm leading-tight max-w-[200px]">
        {empresa.nombre}
      </div>
    </div>
  );

  // Convertir empresas para compatibilidad con DataTable
  const empresasConIndex: EmpresaWithIndex[] = empresas.map((empresa) => ({
    ...empresa,
  }));

  return (
    <div className="space-y-6">
      {/* ✅ MEJORADO: Header más profesional */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Building2 size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestión de Empresas
              </h1>
              <p className="text-gray-600 mt-1">
                Administra todas las empresas registradas en la plataforma
              </p>
            </div>
          </div>

          <button
            onClick={abrirNuevo}
            disabled={loading || tableLoading}
            className={`flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 ${
              loading || tableLoading
                ? "opacity-50 cursor-not-allowed transform-none"
                : "hover:bg-blue-700 hover:scale-105"
            }`}
          >
            <Plus size={20} />
            Nueva Empresa
          </button>
        </div>
      </div>

      {/* Mensajes globales */}
      {error && !modalAbierto && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">!</span>
          </div>
          <p className="text-red-700 text-sm font-medium flex-1">{error}</p>
          <button
            onClick={() => setError("")}
            className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg p-1 transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* ✅ NUEVO: DataTable con columnas optimizadas y función onView */}
      <DataTable<EmpresaWithIndex>
        data={empresasConIndex}
        loading={tableLoading}
        searchKeys={["nombre", "email", "direccion", "telefono"]}
        columns={[
          {
            key: "nombre",
            label: "Empresa y Servicios",
            sortable: true,
            render: renderNombreConServicios,
            width: "min-w-[280px]",
            sticky: true, // ✅ Columna fija para mejor navegación
          },
          {
            key: "telefono",
            label: "Contacto",
            sortable: true,
            render: renderContacto,
            width: "min-w-[200px]",
          },
          {
            key: "direccion",
            label: "Ubicación",
            sortable: true,
            render: renderUbicacion,
            width: "min-w-[220px]",
          },
          {
            key: "destacado",
            label: "Destacada",
            sortable: true,
            render: (empresa: EmpresaWithIndex) =>
              renderBooleanIcon(empresa.destacado as boolean),
            width: "min-w-[120px]",
          },
          {
            key: "habilitado",
            label: "Habilitada",
            sortable: true,
            render: (empresa: EmpresaWithIndex) =>
              renderBooleanIcon(empresa.habilitado as boolean),
            width: "min-w-[120px]",
          },
        ]}
        onView={verDetalles} // ✅ NUEVO: Botón para ver perfil público
        onEdit={abrirEditar}
        onDelete={eliminar}
        pageSize={12} // ✅ Tamaño optimizado
      />

      {/* Modal - se mantiene igual pero con tamaño xl para mejor experiencia */}
      <Modal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={modoEdicion ? "Editar Empresa" : "Nueva Empresa"}
        size="xl"
      >
        <div className="max-h-[85vh] overflow-y-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              guardar();
            }}
            className="space-y-6 p-2"
          >
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs">!</span>
                </div>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Campos del formulario organizados en grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Nombre de la empresa"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
              />
              <FormField
                label="Email de contacto"
                name="email"
                value={form.email || ""}
                onChange={handleChange}
                type="email"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Teléfono"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                required
              />
              <FormField
                label="Sitio web"
                name="web"
                value={form.web || ""}
                onChange={handleChange}
                placeholder="www.ejemplo.com"
              />
            </div>

            <FormField
              label="Dirección"
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              placeholder="Av. Principal 1234"
            />

            <FormField
              label="Descripción de servicios"
              name="corrientes_de_residuos"
              value={form.corrientes_de_residuos || ""}
              onChange={handleChange}
              type="textarea"
              rows={3}
              placeholder="Describe los servicios que ofrece la empresa..."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Provincia
                </label>
                <select
                  name="provincia"
                  value={form.provincia}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      provincia: e.target.value,
                      localidad: "",
                    })
                  }
                  className="block w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione una provincia</option>
                  {provincias.map((prov) => (
                    <option key={prov.id} value={prov.nombre}>
                      {prov.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {esCaba(form.provincia || "") ? "Barrio" : "Localidad"}
                </label>
                <select
                  name="localidad"
                  value={form.localidad}
                  onChange={(e) =>
                    setForm({ ...form, localidad: e.target.value })
                  }
                  className="block w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!form.provincia}
                >
                  <option value="">
                    {esCaba(form.provincia || "")
                      ? "Seleccione un barrio"
                      : "Seleccione una localidad"}
                  </option>
                  {localidades.map((loc) => (
                    <option key={loc.id} value={loc.nombre}>
                      {loc.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
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
                className="block w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin asignar</option>
                {usuariosEmpresa.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.email} (ID {usuario.id})
                  </option>
                ))}
              </select>
            </div>

            <ServicioMultiSelect
              serviciosSeleccionados={form.servicios}
              onChange={(ids) => setForm({ ...form, servicios: ids })}
            />

            {/* Sección de imágenes mejorada */}
            <div className="space-y-4 bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                  <Eye size={16} className="text-white" />
                </div>
                <div>
                  <label className="block text-lg font-semibold text-gray-900">
                    Galería de Imágenes
                  </label>
                  <p className="text-sm text-gray-600">
                    La primera imagen será la imagen principal de la empresa
                  </p>
                </div>
              </div>

              {modoEdicion && empresaIdEditar ? (
                <ImageUploader
                  empresaId={empresaIdEditar}
                  imagenes={form.imagenes}
                  onChange={handleImagenesChange}
                />
              ) : (
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Eye size={32} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">
                    Imágenes disponibles después de crear
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Las imágenes se pueden agregar después de crear la empresa
                  </p>
                </div>
              )}
            </div>

            {/* Checkboxes mejorados */}
            <div className="flex items-center gap-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.destacado}
                  onChange={(e) =>
                    setForm({ ...form, destacado: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-semibold text-gray-900">
                    Empresa Destacada
                  </span>
                  <p className="text-xs text-gray-600">
                    Aparecerá en los primeros resultados
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.habilitado}
                  onChange={(e) =>
                    setForm({ ...form, habilitado: e.target.checked })
                  }
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <div>
                  <span className="text-sm font-semibold text-gray-900">
                    Empresa Habilitada
                  </span>
                  <p className="text-xs text-gray-600">
                    Visible en la guía pública
                  </p>
                </div>
              </label>
            </div>

            {/* Botones mejorados */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                disabled={loading}
                className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 font-medium"
              >
                Cancelar
              </button>

              {!modoEdicion && (
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-3 bg-green-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 ${
                    loading
                      ? "opacity-50 cursor-not-allowed transform-none"
                      : "hover:bg-green-700 hover:scale-105"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creando...
                    </div>
                  ) : (
                    "Crear Empresa"
                  )}
                </button>
              )}

              {modoEdicion && (
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 ${
                    loading
                      ? "opacity-50 cursor-not-allowed transform-none"
                      : "hover:bg-blue-700 hover:scale-105"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Guardando...
                    </div>
                  ) : (
                    "Guardar Cambios"
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
