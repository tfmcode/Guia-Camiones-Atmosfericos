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
  Briefcase
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
      {/* Header con imagen de fondo */}
      <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden bg-gray-200">
        <Image
          src={imagenPrincipal}
          alt={`Imagen principal de ${empresa.nombre}`}
          fill
          className="object-contain sm:object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Botón volver */}
        <div className="absolute top-6 left-6">
          <Link
            href="/empresas"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full font-medium hover:bg-white transition-all shadow-lg"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Volver a empresas</span>
            <span className="sm:hidden">Volver</span>
          </Link>
        </div>

        {/* Badge destacada */}
        {empresa.destacado && (
          <div className="absolute top-6 right-6">
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-amber-500 text-white rounded-full font-semibold text-sm shadow-lg">
              <Star size={16} className="fill-current" />
              Empresa Destacada
            </div>
          </div>
        )}

        {/* Título sobre la imagen */}
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 drop-shadow-lg">
            {empresa.nombre}
          </h1>
          <br />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Información de contacto destacada */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8 -mt-16 relative z-10 border border-gray-100">
          <div className="space-y-4">
            {/* Contacto directo en una sola fila */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {empresa.telefono && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 h-20">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone size={20} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Teléfono</p>
                    <p className="text-gray-900 font-semibold text-lg">{empresa.telefono}</p>
                  </div>
                </div>
              )}

              {empresa.email && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50 h-20">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail size={20} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Email</p>
                    <p className="text-gray-900 font-semibold text-sm break-words">{empresa.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Web y ubicación en segunda fila */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {empresa.web && (
                <a
                  href={empresa.web.startsWith('http') ? empresa.web : `https://${empresa.web}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors group h-20"
                >
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                    <Globe size={20} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Sitio web</p>
                    <p className="text-gray-900 font-semibold text-sm truncate">{empresa.web}</p>
                  </div>
                  <ExternalLink size={16} className="text-gray-400 group-hover:text-purple-500 flex-shrink-0" />
                </a>
              )}

              {(empresa.direccion || empresa.localidad || empresa.provincia) && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-red-50 h-20">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin size={20} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Ubicación</p>
                    <div className="text-gray-900 font-semibold">
                      {empresa.direccion && (
                        <p className="text-sm truncate leading-tight">{empresa.direccion}</p>
                      )}
                      {(empresa.localidad || empresa.provincia) && (
                        <p className="text-xs text-gray-600 truncate">
                          {[empresa.localidad, empresa.provincia].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Servicios */}
        {empresa.servicios && empresa.servicios.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Briefcase size={20} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Servicios Ofrecidos</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {empresa.servicios.map((servicio: Servicio) => (
                <div
                  key={servicio.id}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">{servicio.nombre}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Información adicional */}
        {empresa.corrientes_de_residuos && (
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Información Adicional</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">{empresa.corrientes_de_residuos}</p>
            </div>
          </div>
        )}

        {/* Galería de imágenes adicionales */}
        {imagenesSecundarias.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Galería de Imágenes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {imagenesSecundarias.map((url, i) => (
                <div
                  key={i}
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <Image
                    src={url}
                    alt={`Imagen ${i + 2} de ${empresa.nombre}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call to action final */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">¿Necesitás este servicio?</h2>
          <p className="text-blue-100 mb-6">
            Contactá directamente con {empresa.nombre} para solicitar una cotización
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {empresa.telefono && (
              <a
                href={`tel:${empresa.telefono}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                <Phone size={18} />
                Llamar ahora
              </a>
            )}
            {empresa.email && (
              <a
                href={`mailto:${empresa.email}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition-colors border border-blue-400"
              >
                <Mail size={18} />
                Enviar email
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}