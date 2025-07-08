// app/empresas/[slug]/page.tsx

import { notFound } from "next/navigation";
import Image from "next/image";
import type { Servicio } from "@/types";

import { getEmpresaBySlug, getEmpresas } from "@/lib/api/empresaService";

// 📌 Generar rutas estáticas para desarrollo (evita fallos en producción)
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  if (process.env.NODE_ENV === "production") {
    return [];
  }

  try {
    const empresas = await getEmpresas();
    return empresas.map((e) => ({ slug: e.slug }));
  } catch (err) {
    console.error("❌ Error en generateStaticParams:", err);
    return [];
  }
}

// 🧩 Componente de página
export default async function EmpresaDetail(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;

  const empresa = await getEmpresaBySlug(slug);
  if (!empresa || !empresa.habilitado) return notFound();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      <div className="border-b pb-6 text-center sm:text-left">
        <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900">
          {empresa.nombre}
        </h1>
        <p className="text-zinc-500 mt-2 text-base">
          Información detallada del perfil de la empresa.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-zinc-500 mb-1">Teléfono</p>
            <p className="text-zinc-800 font-medium">
              {empresa.telefono || "No especificado"}
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-500 mb-1">Email</p>
            <p className="text-zinc-800 font-medium">
              {empresa.email || "No especificado"}
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-500 mb-1">Dirección</p>
            <p className="text-zinc-800 font-medium">
              {empresa.direccion || "No especificado"}
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-500 mb-1">Provincia</p>
            <p className="text-zinc-800 font-medium">
              {empresa.provincia || "No especificado"}
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-500 mb-1">Localidad</p>
            <p className="text-zinc-800 font-medium">
              {empresa.localidad || "No especificado"}
            </p>
          </div>

          <div className="sm:col-span-2">
            <p className="text-sm text-zinc-500 mb-1">Servicios</p>
            {empresa.servicios && empresa.servicios.length > 0 ? (
              <ul className="list-disc list-inside text-zinc-800 font-medium">
                {empresa.servicios.map((s: Servicio) => (
                  <li key={s.id}>{s.nombre}</li>
                ))}
              </ul>
            ) : (
              <p className="text-zinc-800 font-medium">No especificado</p>
            )}
          </div>
        </div>
      </div>

      {empresa.imagenes && empresa.imagenes.length > 0 ? (
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-zinc-800">
            Imágenes de la empresa
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {empresa.imagenes.map((url, i) => (
              <div
                key={i}
                className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow ring-1 ring-zinc-200"
              >
                <Image
                  src={url || "/placeholder.jpg"}
                  alt={`imagen-${i}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority={i === 0}
                />
              </div>
            ))}
          </div>
        </section>
      ) : (
        <p className="text-sm text-zinc-500 text-center">
          No hay imágenes disponibles para esta empresa.
        </p>
      )}
    </div>
  );
}
