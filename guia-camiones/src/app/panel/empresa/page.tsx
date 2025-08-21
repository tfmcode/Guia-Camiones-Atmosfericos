"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { EmpresaInput } from "@/types";
import ServicioMultiSelect from "@/components/ui/ServicioMultiSelect";
import { ImageUploader } from "@/components/ui/ImageUploader";
import {
  Building2,
  Mail,
  MapPin,
  FileText,
  Image as ImageIcon,
  Save,
  Eye,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function PanelEmpresa() {
  const [form, setForm] = useState<
    EmpresaInput & { servicios: number[]; id?: number; slug?: string }
  >({
    id: undefined,
    slug: undefined,
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
    servicios: [],
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
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchEmpresa = async () => {
      try {
        const res = await axios.get<{
          empresa: EmpresaInput & {
            servicios: { id: number; nombre: string }[];
            id: number;
            slug: string;
          };
        }>("/api/empresa/me", { withCredentials: true });
        const { empresa } = res.data;

        setForm({
          id: empresa.id,
          slug: empresa.slug,
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
          servicios: Array.isArray(empresa.servicios)
            ? (empresa.servicios as { id: number; nombre: string }[]).map((s) =>
                typeof s === "object" ? s.id : s
              )
            : [],
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

    // Limpiar mensajes al editar
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await axios.put("/api/empresa/me", form, { withCredentials: true });
      setSuccess("¡Datos actualizados correctamente!");

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(""), 3000);

      // Opcional: refrescar para obtener datos actualizados
      // router.refresh();
    } catch (error) {
      console.error("Error al actualizar los datos", error);
      setError("Error al actualizar los datos. Intentá nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos de tu empresa...</p>
        </div>
      </div>
    );
  }

  const inputStyles =
    "w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200";

  const sectionStyles =
    "bg-white rounded-xl shadow-sm border border-gray-100 p-6";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
            <Building2 size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Mi Empresa</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Gestioná la información de tu empresa que aparecerá en la guía
          pública. Los cambios se reflejarán inmediatamente en tu perfil.
        </p>

        {/* Botón ver perfil público */}
        {form.slug && (
          <Link
            href={`/empresas/${form.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            <Eye size={16} />
            Ver perfil público
          </Link>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Mensajes */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs">✓</span>
            </div>
            <p className="text-green-700 text-sm font-medium">{success}</p>
          </div>
        )}

        {/* Información básica */}
        <div className={sectionStyles}>
          <div className="flex items-center gap-3 mb-6">
            <Building2 size={20} className="text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              Información Básica
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la empresa *
              </label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className={inputStyles}
                placeholder="Ej: Servicios Ambientales SA"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono *
              </label>
              <input
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                className={inputStyles}
                placeholder="Ej: 11 4567-8900"
                required
              />
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className={sectionStyles}>
          <div className="flex items-center gap-3 mb-6">
            <Mail size={20} className="text-green-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              Información de Contacto
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email de contacto
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={inputStyles}
                placeholder="contacto@empresa.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sitio web
              </label>
              <input
                name="web"
                value={form.web}
                onChange={handleChange}
                className={inputStyles}
                placeholder="www.empresa.com"
              />
            </div>
          </div>
        </div>

        {/* Ubicación */}
        <div className={sectionStyles}>
          <div className="flex items-center gap-3 mb-6">
            <MapPin size={20} className="text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900">Ubicación</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <input
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                className={inputStyles}
                placeholder="Av. Corrientes 1234"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provincia
                </label>
                <select
                  name="provincia"
                  value={form.provincia}
                  onChange={handleChange}
                  className={inputStyles}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Localidad
                </label>
                <select
                  name="localidad"
                  value={form.localidad}
                  onChange={handleChange}
                  className={inputStyles}
                  disabled={!form.provincia}
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
          </div>
        </div>

        {/* Servicios */}
        <div className={sectionStyles}>
          <div className="flex items-center gap-3 mb-6">
            <FileText size={20} className="text-purple-500" />
            <h2 className="text-xl font-semibold text-gray-900">Servicios</h2>
          </div>

          <div className="space-y-6">
            <ServicioMultiSelect
              serviciosSeleccionados={form.servicios}
              onChange={(ids) =>
                setForm((prev) => ({ ...prev, servicios: ids }))
              }
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción adicional de servicios
              </label>
              <textarea
                name="corrientes_de_residuos"
                value={form.corrientes_de_residuos}
                onChange={handleChange}
                rows={4}
                className={`${inputStyles} resize-none`}
                placeholder="Describí en detalle los servicios que ofrece tu empresa, tipos de residuos que maneja, horarios de atención, etc."
              />
            </div>
          </div>
        </div>

        {/* Imágenes */}
        <div className={sectionStyles}>
          <div className="flex items-center gap-3 mb-6">
            <ImageIcon size={20} className="text-amber-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              Galería de Imágenes
            </h2>
          </div>

          {form.id ? (
            <ImageUploader
              empresaId={form.id}
              imagenes={form.imagenes}
              onChange={(nuevas: string[]) =>
                setForm((prev) => ({ ...prev, imagenes: nuevas }))
              }
            />
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <ImageIcon size={32} className="text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                Guardá los datos básicos primero para poder subir imágenes
              </p>
            </div>
          )}
        </div>

        {/* Botón guardar */}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            disabled={saving}
            className={`flex items-center gap-3 px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 ${
              saving
                ? "opacity-75 cursor-not-allowed transform-none"
                : "hover:bg-blue-700 hover:scale-105"
            }`}
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Guardando cambios...
              </>
            ) : (
              <>
                <Save size={20} />
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
