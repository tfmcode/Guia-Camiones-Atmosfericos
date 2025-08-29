import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";

export const dynamic = "force-dynamic";

const BASE = process.env.UPLOADS_DIR ?? "/var/www/guia/uploads";
const PUBLIC_BASE = process.env.UPLOADS_BASE_URL ?? "/uploads";

const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request, context: unknown) {
  // ✅ Tu casteo está perfecto
  const { id } = (context as { params?: { id?: string } })?.params ?? {};
  const empresaId = String(id ?? "");

  // ✅ Manejo de cookies perfecto
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const user = token && verifyJwt(token);

  // ✅ Validación de autorización perfecta
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
      // ✅ Validaciones de archivo perfectas
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

      // ✅ Generación de nombre perfecta
      const baseName =
        file.name
          .replace(/\.[^.]+$/, "")
          .replace(/\s+/g, "-")
          .replace(/[^a-zA-Z0-9-]/g, "") || "img";

      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const filename = `${baseName}-${Date.now()}.${ext}`;

      // ✅ Construcción de rutas perfecta
      const relative = path.join("empresa", empresaId, filename);
      const target = path.join(BASE, relative);

      // ✅ Crear directorio y escribir archivo
      await fs.mkdir(path.dirname(target), { recursive: true });
      const buf = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(target, buf, { mode: 0o644 });

      // ✅ OPCIONAL: Log para debugging (puedes quitarlo en producción)
      console.log(`📁 Archivo guardado: ${target}`);
      console.log(
        `🌐 URL pública: ${PUBLIC_BASE}/${relative.replace(/\\/g, "/")}`
      );

      urls.push(`${PUBLIC_BASE}/${relative.replace(/\\/g, "/")}`);
    }

    // ✅ Respuesta perfecta
    return NextResponse.json({
      urls,
      message: `${urls.length} archivo(s) subido(s) correctamente`,
    });
  } catch (error) {
    // ✅ MEJORA MENOR: Mejor manejo de errores
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
