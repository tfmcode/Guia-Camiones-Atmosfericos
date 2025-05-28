import { Empresa } from "@/types/empresa";

// ⚠️ Pone tu dominio local o de producción
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://guia-atmosfericos.com";

export async function getEmpresas(): Promise<Empresa[]> {
  const res = await fetch(`${BASE_URL}/api/empresa/public`);
  if (!res.ok) {
    throw new Error("Error al cargar empresas");
  }
  return res.json();
}

export async function getEmpresaBySlug(slug: string): Promise<Empresa | null> {
  const res = await fetch(`${BASE_URL}/api/empresa/public/${slug}`);
  if (!res.ok) {
    throw new Error("Error al cargar empresa");
  }
  return res.json();
}
