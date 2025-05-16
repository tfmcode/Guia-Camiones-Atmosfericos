import { notFound } from "next/navigation";
import Image from "next/image";
import type { Empresa } from "@/types/empresa";
import { getEmpresaBySlug, getEmpresas } from "@/lib/api/empresaService";

export async function generateStaticParams() {
  const empresas = await getEmpresas();
  return empresas.map((empresa) => ({
    slug: empresa.slug,
  }));
}

export default async function EmpresaDetail({
  params,
}: {
  params: { slug: string };
}) {
  const empresa: Empresa | null = await getEmpresaBySlug(params.slug);
  if (!empresa) return notFound();

  return (
    <div className="p-6 space-y-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">{empresa.nombre}</h1>

      <p>
        <strong>Teléfono:</strong> {empresa.telefono}
      </p>
      <p>
        <strong>Email:</strong> {empresa.email || "No especificado"}
      </p>
      <p>
        <strong>Dirección:</strong> {empresa.direccion}
      </p>
      <p>
        <strong>Provincia:</strong> {empresa.provincia || "No definida"}
      </p>
      <p>
        <strong>Localidad:</strong> {empresa.localidad || "No definida"}
      </p>
      <p>
        <strong>Servicios:</strong> {empresa.servicios.join(", ")}
      </p>

      {empresa.imagenes?.length > 0 ? (
        <div className="space-y-2">
          <strong>Imágenes:</strong>
          <div className="grid grid-cols-2 gap-2">
            {empresa.imagenes.map((url, i) => (
              <div
                key={i}
                className="relative w-full aspect-[4/3] rounded overflow-hidden border"
              >
                <Image
                  src={url || "/placeholder.jpg"}
                  alt={`imagen-${i}`}
                  fill
                  className="object-cover"
                  priority={i === 0}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No hay imágenes disponibles.</p>
      )}
    </div>
  );
}
