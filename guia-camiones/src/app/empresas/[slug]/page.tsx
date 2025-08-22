// app/empresas/[slug]/page.tsx

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Servicio } from "@/types";
import {
  Phone,
  Mail,
  MapPin,
  Globe,
  Star,
  ArrowLeft,
  ExternalLink,
  Briefcase,
} from "lucide-react";

import { getEmpresaBySlug, getEmpresas } from "@/lib/api/empresaService";

// Generar rutas estáticas para desarrollo (evita fallos en producción)
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  if (process.env.NODE_ENV === "production") {
    return [];
  }

  try {
    const empresas = await getEmpresas();
    return empresas.map((e) => ({ slug: e.slug }));
  } catch (err) {
    console.error("Error en generateStaticParams:", err);
    return [];
  }
}

// Componente de página
export default async function EmpresaDetail(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;

  const empresa = await getEmpresaBySlug(slug);
  if (!empresa || !empresa.habilitado) return notFound();

  const imagenPrincipal = empresa.imagenes?.[0] || "/img/sinFoto.png";
  const imagenesSecundarias = empresa.imagenes?.slice(1) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header simple */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/empresas"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Volver a empresas</span>
              <span className="sm:hidden">Volver</span>
            </Link>

            {empresa.destacado && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-full font-semibold text-sm">
                <Star size={16} className="fill-current" />
                Empresa Destacada
              </div>
            )}
          </div>

          {/* Header con imagen y título lado a lado en desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Imagen principal */}
            <div className="lg:col-span-1">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-lg">
                <Image
                  src={imagenPrincipal}
                  alt={`Imagen principal de ${empresa.nombre}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  priority
                />
              </div>
            </div>

            {/* Información principal */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                  {empresa.nombre}
                </h1>
                {(empresa.localidad || empresa.provincia) && (
                  <p className="text-lg sm:text-xl text-gray-600 font-medium">
                    {[empresa.localidad, empresa.provincia]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </div>

              {/* Contacto rápido en el header - SIN LINKS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                {empresa.telefono && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <Phone size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Teléfono</p>
                      <p className="font-semibold text-gray-900">
                        {empresa.telefono}
                      </p>
                    </div>
                  </div>
                )}

                {empresa.email && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <Mail size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {empresa.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Información de contacto completa */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Información de Contacto
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {empresa.web && (
              <a
                href={
                  empresa.web.startsWith("http")
                    ? empresa.web
                    : `https://${empresa.web}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                  <Globe size={20} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Sitio web
                  </p>
                  <p className="text-gray-900 font-semibold text-sm truncate group-hover:text-purple-600 transition-colors">
                    {empresa.web}
                  </p>
                </div>
                <ExternalLink
                  size={16}
                  className="text-gray-400 group-hover:text-purple-500 flex-shrink-0 transition-colors"
                />
              </a>
            )}

            {empresa.direccion && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-red-50">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Ubicación
                  </p>
                  <p className="text-gray-900 font-semibold text-sm leading-tight">
                    {empresa.direccion}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Servicios */}
        {empresa.servicios && empresa.servicios.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Briefcase size={20} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Servicios Ofrecidos
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {empresa.servicios.map((servicio: Servicio) => (
                <div
                  key={servicio.id}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">
                    {servicio.nombre}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Información adicional */}
        {empresa.corrientes_de_residuos && (
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Información Adicional
            </h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed text-lg">
                {empresa.corrientes_de_residuos}
              </p>
            </div>
          </div>
        )}

        {/* Galería de imágenes mejorada */}
        {imagenesSecundarias.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Galería de Imágenes
            </h2>

            {/* Grid responsivo mejorado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {imagenesSecundarias.map((url, i) => (
                <div
                  key={i}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                >
                  <Image
                    src={url}
                    alt={`Imagen ${i + 2} de ${empresa.nombre}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />

                  {/* Overlay con número de imagen */}
                  <div className="absolute top-3 right-3 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-white text-sm font-semibold">
                      {i + 2}
                    </span>
                  </div>
                </div>
              ))}
            </div>

           
          </div>
        )}

        {/* Call to action final mejorado */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            ¿Necesitás este servicio?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Contactá directamente con {empresa.nombre} para solicitar una
            cotización personalizada
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {empresa.telefono && (
              <a
                href={`tel:${empresa.telefono}`}
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Phone size={20} />
                Llamar ahora
              </a>
            )}
            {empresa.email && (
              <a
                href={`mailto:${empresa.email}`}
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-400 transition-all duration-200 border border-blue-400 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Mail size={20} />
                Enviar email
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
