import { Empresa } from "@/types/empresa";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://guia-atmosfericos.com";

export async function getEmpresas(): Promise<Empresa[]> {
  const res = await fetch(`${BASE_URL}/api/empresa/public`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error ${res.status}: ${errorText}`);
  }

  return res.json();
}

export async function getEmpresaBySlug(slug: string): Promise<Empresa | null> {
  const res = await fetch(
    `${BASE_URL}/api/empresa/public/${encodeURIComponent(slug)}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error ${res.status}: ${errorText}`);
  }

  return res.json();
}
