import { Empresa } from "@/types/empresa";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://guia-atmosfericos.com";

// ✅ AGREGADO: Headers anti-caché consistentes
const getCacheHeaders = () => ({
  "Content-Type": "application/json",
  "Cache-Control": "no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "Last-Modified": new Date().toUTCString(),
});

export async function getEmpresas(): Promise<Empresa[]> {
  console.log("🔄 [empresaService] Cargando lista de empresas...");

  // ✅ AGREGADO: Timestamp único para evitar caché
  const res = await fetch(`${BASE_URL}/api/empresa/public?t=${Date.now()}`, {
    headers: getCacheHeaders(),
    // ✅ AGREGADO: Configuraciones adicionales para evitar cache en Next.js
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("❌ [empresaService] Error obteniendo empresas:", errorText);
    throw new Error(`Error ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  console.log(
    "✅ [empresaService] Empresas cargadas:",
    Array.isArray(data) ? data.length : "respuesta no es array"
  );

  return data;
}

export async function getEmpresaBySlug(slug: string): Promise<Empresa | null> {
  console.log(`🔄 [empresaService] Cargando empresa con slug: "${slug}"`);

  // ✅ AGREGADO: Timestamp único para evitar caché
  const res = await fetch(
    `${BASE_URL}/api/empresa/public/${encodeURIComponent(
      slug
    )}?t=${Date.now()}`,
    {
      headers: getCacheHeaders(),
      // ✅ AGREGADO: Configuraciones adicionales para evitar cache en Next.js
      cache: "no-store",
      next: { revalidate: 0 },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error(
      `❌ [empresaService] Error obteniendo empresa ${slug}:`,
      errorText
    );

    // ✅ AGREGADO: Manejo específico para 404
    if (res.status === 404) {
      console.log(`ℹ️ [empresaService] Empresa ${slug} no encontrada`);
      return null;
    }

    throw new Error(`Error ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  console.log(
    `✅ [empresaService] Empresa cargada: "${data.nombre}" (slug: ${data.slug})`
  );

  return data;
}
