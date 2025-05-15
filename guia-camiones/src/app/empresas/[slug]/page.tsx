import { notFound } from "next/navigation";
import type { Empresa } from "@/types/empresa";
import { getEmpresaBySlug } from "@/lib/api/empresaService";
import Image from "next/image";

type Props = {
  params: { slug: string };
};

export default async function EmpresaDetail({ params }: Props) {
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

      <div className="space-y-2">
        <strong>Imágenes:</strong>
        <div className="grid grid-cols-2 gap-2">
          {empresa.imagenes.map((url, i) => (
            <div
              key={i}
              className="relative w-full h-40 rounded overflow-hidden border"
            >
              <Image
                src={url}
                alt={`imagen-${i}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
