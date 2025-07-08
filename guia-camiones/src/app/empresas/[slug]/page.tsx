// app/empresas/[slug]/page.tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Empresa } from "@/types/empresa";
import { getEmpresaBySlug } from "@/lib/api/empresaService";

// 1. Generar rutas estáticas con slugs existentes
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/empresa/public`,
    { next: { revalidate: 60 } }
  );
  const empresas: Empresa[] = await res.json();
  return empresas.map((e) => ({ slug: e.slug }));
}

// 2. Componente de página principal para cada slug
export default async function Page({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}): Promise<React.JSX.Element> {
  // Asegurarse de extraer `params` si viene como promesa
  const { slug } = await params;

  const empresa = await getEmpresaBySlug(slug);
  if (!empresa || !empresa.habilitado) return notFound();

  return (
    <div className="max-w-6xl mx-auto px-6 pt-12 pb-16 space-y-16">
      {/* -- Sección de encabezado -- */}
      <div className="border-b pb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900">{empresa.nombre}</h1>
        <p className="text-zinc-500 mt-2 text-base">Información detallada del perfil de la empresa.</p>
      </div>

      {/* -- Sección de detalles -- */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow ring-1 ring-zinc-100 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-zinc-500 mb-1">Teléfono</p>
            <p className="text-zinc-800 font-medium">{empresa.telefono}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500 mb-1">Email</p>
            <p className="text-zinc-800 font-medium">{empresa.email || "No especificado"}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500 mb-1">Dirección</p>
            <p className="text-zinc-800 font-medium">{empresa.direccion}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500 mb-1">Provincia</p>
            <p className="text-zinc-800 font-medium">{empresa.provincia || "No definida"}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500 mb-1">Localidad</p>
            <p className="text-zinc-800 font-medium">{empresa.localidad || "No definida"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-sm text-zinc-500 mb-1">Servicios</p>
            <p className="text-zinc-800 font-medium">
              {Array.isArray(empresa.servicios) && empresa.servicios.length > 0
                ? empresa.servicios.map((s) => s.nombre).join(", ")
                : "No especificado"}
            </p>
          </div>
        </div>
      </div>

      {/* -- Galería de imágenes -- */}
      {empresa.imagenes?.length > 0 ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-zinc-800">Imágenes de la empresa</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {empresa.imagenes.map((url, i) => (
              <div key={i} className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-md ring-1 ring-zinc-200">
                <Image src={url || "/placeholder.jpg"} alt={`imagen-${i}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" priority={i === 0} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">No hay imágenes disponibles para esta empresa.</p>
      )}
    </div>
  );
}
