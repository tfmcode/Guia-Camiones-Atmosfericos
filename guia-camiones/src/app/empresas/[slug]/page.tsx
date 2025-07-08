// app/empresas/[slug]/page.tsx

import { notFound } from "next/navigation";
import Image from "next/image";
import type { Empresa } from "@/types/empresa";
import { getEmpresaBySlug } from "@/lib/api/empresaService";
import {JSX} from "react";

// ✅ Generar slugs estáticos (debe permanecer aquí)
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/empresa/public`,
    { next: { revalidate: 60 } }
  );
  const empresas: Empresa[] = await res.json();
  return empresas.map((e) => ({ slug: e.slug }));
}

// ✅ Página principal
export default async function Page({
  params,
}: {
  params: { slug: string };
}): Promise<JSX.Element> {
  const { slug } = params; // ✅ SIN await

  const empresa = await getEmpresaBySlug(slug);
  if (!empresa || !empresa.habilitado) return notFound();

  return (
    <div className="max-w-6xl mx-auto px-6 pt-12 pb-16 space-y-16">
      {/* Encabezado */}
      <div className="border-b pb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900">
          {empresa.nombre}
        </h1>
        <p className="text-zinc-500 mt-2 text-base">
          Información detallada del perfil de la empresa.
        </p>
      </div>

      {/* Información */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow ring-1 ring-zinc-100 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { label: "Teléfono", value: empresa.telefono },
            { label: "Email", value: empresa.email || "No especificado" },
            { label: "Dirección", value: empresa.direccion },
            { label: "Provincia", value: empresa.provincia || "No definida" },
            { label: "Localidad", value: empresa.localidad || "No definida" },
          ].map((item, i) => (
            <div key={i}>
              <p className="text-sm text-zinc-500 mb-1">{item.label}</p>
              <p className="text-zinc-800 font-medium">{item.value}</p>
            </div>
          ))}
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

      {/* Galería */}
      {empresa.imagenes?.length > 0 ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-zinc-800">
            Imágenes de la empresa
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {empresa.imagenes.map((url, i) => (
              <div
                key={i}
                className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-md ring-1 ring-zinc-200"
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
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          No hay imágenes disponibles para esta empresa.
        </p>
      )}
    </div>
  );
}
