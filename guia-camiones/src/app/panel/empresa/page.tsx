"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";
import { EmpresaInput } from "@/types";
import ServicioMultiSelect from "@/components/ui/ServicioMultiSelect";
import { ImageUploader } from "@/components/ui/ImageUploader";
import OptimizedAddressSearch from "@/components/maps/OptimizedAddressSearch";
import {
  Building2,
  Mail,
  MapPin,
  FileText,
  Image as ImageIcon,
  Save,
  Eye,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { esCaba, getBarriosFormateados } from "@/constants/barrios";

interface EmpresaResponse {
  empresa: {
    id: number;
    slug: string;
    nombre: string;
    email?: string;
    telefono: string;
    direccion: string;
    provincia?: string;
    localidad?: string;
    web?: string;
    corrientes_de_residuos?: string;
    imagenes: string[];
    destacado: boolean;
    habilitado: boolean;
    servicios: Array<{ id: number; nombre: string }>;
    lat?: number | null;
    lng?: number | null;
  };
}

interface ApiResponse {
  message: string;
  empresa?: EmpresaResponse["empresa"];
}

export default function PanelEmpresa() {
  const { refreshEmpresa } = useAuth();

  // ✅ STATE ACTUALIZADO con lat y lng
  const [form, setForm] = useState<
    EmpresaInput & {
      servicios: number[];
      id?: number;
      slug?: string;
      lat?: number | null;
      lng?: number | null;
    }
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
    lat: null,
    lng: null,
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

  // ✅ ACTUALIZADO: Cargar datos incluyendo lat/lng
  const fetchEmpresaData = async () => {
    try {
      console.log("🔄 Cargando datos de empresa...");

      const res = await axios.get<EmpresaResponse>("/api/empresa/me", {
        withCredentials: true,
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      const { empresa } = res.data;
      console.log("📊 Datos de empresa cargados:", empresa.nombre);

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
          ? empresa.servicios.map((s) => (typeof s === "object" ? s.id : s))
          : [],
        lat: empresa.lat ?? null,
        lng: empresa.lng ?? null,
      });

      return empresa;
    } catch (error) {
      console.error("❌ Error al obtener datos de empresa:", error);
      setError("Error al cargar los datos de la empresa.");
      return null;
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        await fetchEmpresaData();

        const provinciasRes = await fetch(
          "https://apis.datos.gob.ar/georef/api/provincias?campos=id,nombre"
        );
        const provinciasData = await provinciasRes.json();
        setProvincias(provinciasData.provincias);

        console.log("✅ Datos iniciales cargados correctamente");
      } catch (error) {
        console.error("❌ Error al cargar datos iniciales:", error);
        setError("Error al cargar los datos iniciales.");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const cargarLocalidades = async () => {
      if (!form.provincia) {
        setLocalidades([]);
        return;
      }

      try {
        if (esCaba(form.provincia)) {
          console.log("🏙️ Cargando barrios de CABA...");
          const barrios = getBarriosFormateados();
          setLocalidades(barrios);
          console.log(`✅ ${barrios.length} barrios de CABA cargados`);
          return;
        }

        console.log(`🌎 Cargando localidades para: ${form.provincia}`);

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
          `✅ ${municipios.length} localidades cargadas para ${form.provincia}`
        );
      } catch (error) {
        console.error("❌ Error al cargar localidades:", error);
        setLocalidades([]);

        if (esCaba(form.provincia)) {
          console.log("🔄 Usando fallback para barrios de CABA...");
          setLocalidades(getBarriosFormateados());
        }
      }
    };

    cargarLocalidades();
  }, [form.provincia]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      console.log("🚀 Enviando actualización de empresa:", {
        nombre: form.nombre,
        geocodificada: !!(form.lat && form.lng),
      });

      const response = await axios.put<ApiResponse>("/api/empresa/me", form, {
        withCredentials: true,
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      console.log("✅ Respuesta del servidor:", response.data);

      if (response.data && response.data.empresa) {
        const empresaActualizada = response.data.empresa;

        setForm((prevForm) => ({
          ...prevForm,
          slug: empresaActualizada.slug,
          id: empresaActualizada.id,
          nombre: empresaActualizada.nombre,
          email: empresaActualizada.email || "",
          telefono: empresaActualizada.telefono,
          direccion: empresaActualizada.direccion,
          provincia: empresaActualizada.provincia || "",
          localidad: empresaActualizada.localidad || "",
          web: empresaActualizada.web || "",
          corrientes_de_residuos:
            empresaActualizada.corrientes_de_residuos || "",
          imagenes: empresaActualizada.imagenes || [],
          destacado: empresaActualizada.destacado,
          habilitado: empresaActualizada.habilitado,
          servicios: Array.isArray(empresaActualizada.servicios)
            ? empresaActualizada.servicios.map((s) =>
                typeof s === "object" ? s.id : s
              )
            : [],
          lat: empresaActualizada.lat ?? null,
          lng: empresaActualizada.lng ?? null,
        }));

        console.log("📝 Form actualizado:", {
          slug: empresaActualizada.slug,
          geocodificada: !!(empresaActualizada.lat && empresaActualizada.lng),
        });
      }

      setSuccess("¡Datos actualizados correctamente!");

      await Promise.all([
        refreshEmpresa(),
        new Promise((resolve) => setTimeout(resolve, 500)).then(() =>
          fetchEmpresaData()
        ),
      ]);

      console.log("✅ Sincronización completa");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("❌ Error al actualizar los datos:", error);

      if (error instanceof Error) {
        setError(`Error al actualizar: ${error.message}`);
      } else {
        setError("Error al actualizar los datos. Intentá nuevamente.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleImagenesChange = async (nuevasImagenes: string[]) => {
    console.log("🖼️ Actualizando imágenes:", nuevasImagenes.length);

    setForm((prev) => ({ ...prev, imagenes: nuevasImagenes }));

    try {
      console.log("💾 Guardando imágenes automáticamente...");

      await axios.put<ApiResponse>(
        "/api/empresa/me",
        {
          ...form,
          imagenes: nuevasImagenes,
        },
        {
          withCredentials: true,
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }
      );

      await refreshEmpresa();

      console.log("✅ Imágenes guardadas y sincronizadas automáticamente");

      setSuccess("Imágenes actualizadas correctamente");
      setTimeout(() => setSuccess(""), 2000);
    } catch (error) {
      console.error("❌ Error al guardar imágenes automáticamente:", error);
      setError("Error al guardar las imágenes");
      setTimeout(() => setError(""), 3000);
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

        {form.slug ? (
          <div className="space-y-2">
            <Link
              href={`/empresas/${form.slug}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              <Eye size={16} />
              Ver perfil público
            </Link>
            <p className="text-xs text-gray-500">Slug actual: {form.slug}</p>
          </div>
        ) : (
          <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2">
            ⚠️ No hay slug disponible. Guardá los datos primero.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={() => setError("")}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
            <p className="text-green-700 text-sm font-medium">{success}</p>
            <button
              onClick={() => setSuccess("")}
              className="ml-auto text-green-500 hover:text-green-700"
            >
              ×
            </button>
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

        {/* ✅ SECCIÓN ACTUALIZADA: Ubicación con buscador inteligente */}
        <div className={sectionStyles}>
          <div className="flex items-center gap-3 mb-6">
            <MapPin size={20} className="text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900">Ubicación</h2>
          </div>

          <div className="space-y-4">
            {/* ✅ Buscador de direcciones con geocodificación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar y seleccionar dirección con Google Maps
              </label>
              <OptimizedAddressSearch
                onLocationSelect={(coords) => {
                  console.log("📍 Dirección seleccionada:", coords);
                  setForm({
                    ...form,
                    direccion: coords.address,
                    lat: coords.lat,
                    lng: coords.lng,
                  });
                }}
                placeholder="Buscar dirección exacta (ej: Av. Corrientes 1234, CABA)"
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Al seleccionar una dirección, las coordenadas se guardan
                automáticamente
              </p>
            </div>

            {/* Campo manual de dirección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                O escribir dirección manualmente
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
                  {esCaba(form.provincia || "") ? "Barrio" : "Localidad"}
                </label>
                <select
                  name="localidad"
                  value={form.localidad}
                  onChange={handleChange}
                  className={inputStyles}
                  disabled={!form.provincia}
                >
                  <option value="">
                    {esCaba(form.provincia || "")
                      ? "Seleccioná un barrio"
                      : "Seleccioná una localidad"}
                  </option>
                  {localidades.map((loc) => (
                    <option key={loc.id} value={loc.nombre}>
                      {loc.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ✅ Indicador de geocodificación */}
            {form.lat && form.lng && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin size={16} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-900 mb-1">
                      ✅ Dirección geocodificada correctamente
                    </p>
                    <p className="text-xs text-green-700 font-mono">
                      Coordenadas: {form.lat.toFixed(6)}, {form.lng.toFixed(6)}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Tu empresa aparecerá en el mapa de búsqueda por proximidad
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!form.lat && !form.lng && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin size={16} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900 mb-1">
                      ⚠️ Dirección sin geocodificar
                    </p>
                    <p className="text-xs text-amber-700">
                      Usa el buscador de Google Maps arriba para que tu empresa
                      aparezca en el mapa de proximidad
                    </p>
                  </div>
                </div>
              </div>
            )}
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
              onChange={(ids) => {
                console.log("🔧 Servicios seleccionados:", ids);
                setForm((prev) => ({ ...prev, servicios: ids }));
              }}
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
              onChange={handleImagenesChange}
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
