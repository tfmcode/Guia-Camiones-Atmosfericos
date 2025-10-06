// src/app/admin/empresas/page.tsx - VERSIÓN COMPONENTIZADA
"use client";

import { useEffect, useState, ChangeEvent } from "react";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import ServicioMultiSelect from "@/components/ui/ServicioMultiSelect";
import UbicacionFormSection from "@/components/admin/UbicacionFormSection";
import ImagenesFormSection from "@/components/admin/ImagenesFormSection";
import GeocodingBatchBanner from "@/components/admin/GeocodingBatchBanner";
import type { Empresa, EmpresaInput } from "@/types/empresa";
import axios from "axios";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/20/solid";
import { Building2, Plus, MapPin, Phone, AlertCircle } from "lucide-react";
import { esCaba, getBarriosFormateados } from "@/constants/barrios";

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
  const [geocodificando, setGeocodificando] = useState(false);
  const [resultadoGeocodificacion, setResultadoGeocodificacion] = useState<{
    total: number;
    exitosas: number;
    fallidas: number;
  } | null>(null);

  const [form, setForm] = useState<
    Omit<EmpresaInput, "slug"> & {
      servicios: number[];
      usuarioId: number | null;
      lat?: number | null;
      lng?: number | null;
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
    lat: null,
    lng: null,
  });

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        fetchEmpresas();
        const [provinciasRes, usuariosRes] = await Promise.all([
          fetch(
            "https://apis.datos.gob.ar/georef/api/provincias?campos=id,nombre"
          ),
          fetch("/api/usuarios?rol=EMPRESA"),
        ]);
        const [provinciasData, usuariosData] = await Promise.all([
          provinciasRes.json(),
          usuariosRes.json(),
        ]);
        setProvincias(provinciasData.provincias);
        setUsuariosEmpresa(usuariosData);
      } catch (err) {
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
        if (esCaba(form.provincia)) {
          setLocalidades(getBarriosFormateados());
          return;
        }
        const response = await fetch(
          `https://apis.datos.gob.ar/georef/api/municipios?provincia=${encodeURIComponent(
            form.provincia
          )}&campos=id,nombre&max=1000`
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setLocalidades(data.municipios || []);
      } catch {
        setLocalidades(esCaba(form.provincia) ? getBarriosFormateados() : []);
      }
    };
    cargarLocalidades();
  }, [form.provincia]);

  const fetchEmpresas = async () => {
    setTableLoading(true);
    try {
      const res = await fetch("/api/empresa/admin");
      const data = await res.json();
      setEmpresas(data);
    } catch (err) {
      console.error("Error al cargar empresas:", err);
      setError("Error al cargar empresas.");
    } finally {
      setTableLoading(false);
    }
  };

  const ejecutarGeocodificacionMasiva = async () => {
    const empresasSinCoordenadas = empresas.filter(
      (e) => !e.lat || !e.lng
    ).length;
    if (empresasSinCoordenadas === 0) {
      alert("No hay empresas pendientes de geocodificar");
      return;
    }
    if (
      !confirm(
        `¿Geocodificar ${empresasSinCoordenadas} empresas sin coordenadas?`
      )
    ) {
      return;
    }
    setGeocodificando(true);
    setResultadoGeocodificacion(null);
    try {
      const response = await fetch("/api/empresa/admin/geocode-batch", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Error al geocodificar empresas");
      const resultado = await response.json();
      setResultadoGeocodificacion(resultado);
      await fetchEmpresas();
    } catch (error) {
      console.error("Error al geocodificar:", error);
      alert("Error al ejecutar la geocodificación masiva");
    } finally {
      setGeocodificando(false);
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
      lat: null,
      lng: null,
    });
    setEmpresaIdEditar(null);
    setModoEdicion(false);
    setError("");
    setModalAbierto(true);
  };

  const abrirEditar = (empresa: EmpresaWithIndex) => {
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
      lat: empresa.lat ?? null,
      lng: empresa.lng ?? null,
    });
    setEmpresaIdEditar(empresa.id);
    setModoEdicion(true);
    setError("");
    setModalAbierto(true);
  };

  const verDetalles = (empresa: EmpresaWithIndex) => {
    window.open(`/empresas/${empresa.slug}`, "_blank");
  };

  const handleImagenesChange = async (nuevasImagenes: string[]) => {
    setForm((prev) => ({ ...prev, imagenes: nuevasImagenes }));
    if (modoEdicion && empresaIdEditar !== null) {
      try {
        await axios.put(`/api/empresa/admin/${empresaIdEditar}`, {
          ...form,
          imagenes: nuevasImagenes,
        });
        await fetchEmpresas();
      } catch (error) {
        console.error("Error al actualizar imágenes:", error);
        setError("Error al actualizar las imágenes en el servidor.");
      }
    }
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
        const response = await axios.post("/api/empresa/admin", form);
        if (
          response.data &&
          typeof response.data === "object" &&
          "id" in response.data
        ) {
          setEmpresaIdEditar((response.data as { id: number }).id);
          setModoEdicion(true);
        }
      }
      await fetchEmpresas();
      if (modoEdicion) setModalAbierto(false);
      setError("");
    } catch (err: unknown) {
      alert(
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
          ? err.response.data.message
          : "Error al eliminar empresa."
      );
    }
  };

  const eliminar = async (empresa: EmpresaWithIndex) => {
    if (!confirm(`¿Eliminar a ${empresa.nombre}?`)) return;
    setLoading(true);
    try {
      await axios.delete(`/api/empresa/admin/${empresa.id}`);
      fetchEmpresas();
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
      ) {
        alert(
          (err.response as { data: { message?: string } }).data.message ||
            "Error al eliminar empresa."
        );
      } else {
        alert("Error al eliminar empresa.");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderBooleanIcon = (value: boolean) => (
    <div className="flex items-center gap-2">
      {value ? (
        <CheckCircleIcon className="h-5 w-5 text-green-500" />
      ) : (
        <XCircleIcon className="h-5 w-5 text-red-500" />
      )}
      <span
        className={`text-xs font-medium px-2 py-1 rounded-full ${
          value ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"
        }`}
      >
        {value ? "Activa" : "Inactiva"}
      </span>
    </div>
  );

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

  const renderNombreConServicios = (empresa: EmpresaWithIndex) => (
    <div className="font-semibold text-gray-900 text-sm leading-tight max-w-[200px]">
      {empresa.nombre}
    </div>
  );

  const renderGeocodingStatus = (empresa: EmpresaWithIndex) => {
    const hasCoords = !!(empresa.lat && empresa.lng);
    return (
      <div className="flex items-center gap-2">
        {hasCoords ? (
          <div className="flex items-center gap-1 text-green-600">
            <MapPin size={14} className="fill-current" />
            <span className="text-xs font-medium">Geocodificada</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-amber-600">
            <AlertCircle size={14} />
            <span className="text-xs font-medium">Sin coordenadas</span>
          </div>
        )}
      </div>
    );
  };

  const empresasConIndex: EmpresaWithIndex[] = empresas.map((empresa) => ({
    ...empresa,
  }));
  const empresasSinCoordenadas = empresas.filter(
    (e) => !e.lat || !e.lng
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
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
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blue-700 hover:scale-105"
            }`}
          >
            <Plus size={20} />
            Nueva Empresa
          </button>
        </div>
      </div>

      {/* Error */}
      {error && !modalAbierto && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">!</span>
          </div>
          <p className="text-red-700 text-sm font-medium flex-1">{error}</p>
          <button
            onClick={() => setError("")}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Banner Geocodificación */}
      <GeocodingBatchBanner
        empresasSinCoordenadas={empresasSinCoordenadas}
        geocodificando={geocodificando}
        resultadoGeocodificacion={resultadoGeocodificacion}
        onExecute={ejecutarGeocodificacionMasiva}
      />

      {/* Tabla */}
      <DataTable<EmpresaWithIndex>
        data={empresasConIndex}
        loading={tableLoading}
        searchKeys={["nombre", "email", "direccion", "telefono"]}
        columns={[
          {
            key: "nombre",
            label: "Empresa",
            sortable: true,
            render: renderNombreConServicios,
            width: "min-w-[280px]",
            sticky: true,
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
            render: (e: EmpresaWithIndex) =>
              renderBooleanIcon(e.destacado as boolean),
            width: "min-w-[120px]",
          },
          {
            key: "habilitado",
            label: "Habilitada",
            sortable: true,
            render: (e: EmpresaWithIndex) =>
              renderBooleanIcon(e.habilitado as boolean),
            width: "min-w-[120px]",
          },
          {
            key: "lat",
            label: "Mapa",
            sortable: false,
            render: renderGeocodingStatus,
            width: "min-w-[140px]",
          },
        ]}
        onView={verDetalles}
        onEdit={abrirEditar}
        onDelete={eliminar}
        pageSize={12}
      />

      {/* Modal */}
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
            {/* Campos básicos */}
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
              label="Descripción de servicios"
              name="corrientes_de_residuos"
              value={form.corrientes_de_residuos || ""}
              onChange={handleChange}
              type="textarea"
              rows={3}
            />

            {/* Componente Ubicación */}
            <UbicacionFormSection
              direccion={form.direccion}
              provincia={form.provincia}
              localidad={form.localidad}
              lat={form.lat}
              lng={form.lng}
              provincias={provincias}
              localidades={localidades}
              onDireccionChange={handleChange}
              onProvinciaChange={(provincia) =>
                setForm({ ...form, provincia, localidad: "" })
              }
              onLocalidadChange={(localidad) => setForm({ ...form, localidad })}
              onLocationSelect={(coords) =>
                setForm({
                  ...form,
                  direccion: coords.address,
                  lat: coords.lat,
                  lng: coords.lng,
                })
              }
            />

            {/* Usuario asignado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                {usuariosEmpresa.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email} (ID {u.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Servicios */}
            <ServicioMultiSelect
              serviciosSeleccionados={form.servicios}
              onChange={(ids) => setForm({ ...form, servicios: ids })}
            />

            {/* Componente Imágenes */}
            <ImagenesFormSection
              modoEdicion={modoEdicion}
              empresaId={empresaIdEditar}
              imagenes={form.imagenes}
              onChange={handleImagenesChange}
            />

            {/* Checkboxes */}
            <div className="flex items-center gap-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.destacado}
                  onChange={(e) =>
                    setForm({ ...form, destacado: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded"
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
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.habilitado}
                  onChange={(e) =>
                    setForm({ ...form, habilitado: e.target.checked })
                  }
                  className="w-5 h-5 text-green-600 border-gray-300 rounded"
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

            {/* Botones */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                disabled={loading}
                className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancelar
              </button>
              {!modoEdicion && (
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-3 bg-green-600 text-white rounded-xl font-semibold ${
                    loading ? "opacity-50" : "hover:bg-green-700"
                  }`}
                >
                  {loading ? "Creando..." : "Crear Empresa"}
                </button>
              )}
              {modoEdicion && (
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold ${
                    loading ? "opacity-50" : "hover:bg-blue-700"
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
