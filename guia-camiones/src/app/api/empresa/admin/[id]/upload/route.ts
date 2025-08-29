import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";

export const dynamic = "force-dynamic";

const BASE = process.env.UPLOADS_DIR ?? "/var/www/guia/uploads";
const PUBLIC_BASE = process.env.UPLOADS_BASE_URL ?? "/uploads";
// Usar la variable que ya tienes configurada
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://guia-atmosfericos.com";

const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request, context: unknown) {
  const { id } = (context as { params?: { id?: string } })?.params ?? {};
  const empresaId = String(id ?? "");

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const user = token && verifyJwt(token);

  if (
    !user ||
    typeof user === "string" ||
    (user.rol !== "ADMIN" && user.rol !== "EMPRESA")
  ) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  if (!empresaId || Number.isNaN(Number(empresaId))) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  try {
    const form = await req.formData();
    const files = form.getAll("file") as File[];

    if (!files.length) {
      return NextResponse.json(
        { message: "No se recibieron archivos" },
        { status: 400 }
      );
    }

    const urls: string[] = [];

    for (const file of files) {
      if (!ALLOWED.has(file.type)) {
        return NextResponse.json(
          {
            message: `Tipo de archivo no permitido: ${file.type}. Formatos permitidos: JPG, PNG, WebP`,
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          {
            message: `El archivo "${file.name}" es muy grande. Máximo 5MB.`,
          },
          { status: 400 }
        );
      }

      const baseName =
        file.name
          .replace(/\.[^.]+$/, "")
          .replace(/\s+/g, "-")
          .replace(/[^a-zA-Z0-9-]/g, "") || "img";

      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const filename = `${baseName}-${Date.now()}.${ext}`;

      const relative = path.join("empresa", empresaId, filename);
      const target = path.join(BASE, relative);

      await fs.mkdir(path.dirname(target), { recursive: true });
      const buf = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(target, buf, { mode: 0o644 });

      console.log(`📁 Archivo guardado: ${target}`);

      // FIX PRINCIPAL: Generar URL completa en lugar de relativa
      const fullUrl = `${SITE_URL}${PUBLIC_BASE}/${relative.replace(
        /\\/g,
        "/"
      )}`;
      console.log(`URL completa generada: ${fullUrl}`);

      urls.push(fullUrl);
    }

    return NextResponse.json({
      urls,
      message: `${urls.length} archivo(s) subido(s) correctamente`,
    });
  } catch (error) {
    console.error("❌ Error en upload:", error);

    return NextResponse.json(
      {
        message: "Error interno del servidor al procesar la subida",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
