// app/api/empresa/admin/[id]/uploads/route.ts
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { verifyJwt } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Base del filesystem donde se escriben los archivos (Nginx lee de acá)
const BASE =
  process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");
// Prefijo público (URL que va a la DB / frontend)
const PUBLIC_BASE = process.env.UPLOADS_BASE_URL || "/uploads";

// Tipos permitidos (podés sumar svg si lo habilitás en next.config.js)
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params?.id;

  const token = req.cookies.get("token")?.value;
  const user = token && verifyJwt(token);

  if (
    !user ||
    typeof user === "string" ||
    (user.rol !== "ADMIN" && user.rol !== "EMPRESA")
  ) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("file") as File[];

    if (!files.length) {
      return NextResponse.json(
        { message: "No se recibieron archivos" },
        { status: 400 }
      );
    }

    const savedUrls: string[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json(
          { message: `Tipo de archivo no permitido: ${file.type}` },
          { status: 400 }
        );
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { message: "El archivo es muy grande. Máximo 5MB." },
          { status: 400 }
        );
      }

      const rawName = file.name
        .split(".")
        .slice(0, -1)
        .join(".")
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9-]/g, "");
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const filename = `${rawName || "img"}-${Date.now()}.${ext}`;

      const relativePath = path.join("empresa", String(id), filename); // sin slash inicial
      const targetPath = path.join(BASE, relativePath);

      // Crear carpeta y escribir con permisos legibles por nginx
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(targetPath, buffer, { mode: 0o644 });

      const publicUrl = `${PUBLIC_BASE}/${relativePath.replace(/\\/g, "/")}`;
      savedUrls.push(publicUrl);
    }

    return NextResponse.json({
      urls: savedUrls,
      message: `${savedUrls.length} archivo(s) subido(s) correctamente`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);

    if (msg.includes("ENOSPC")) {
      return NextResponse.json(
        { message: "No hay espacio suficiente en el servidor" },
        { status: 507 }
      );
    }
    if (msg.includes("EACCES") || msg.includes("EPERM")) {
      return NextResponse.json(
        { message: "Error de permisos en el servidor" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Error interno del servidor al subir archivos",
        error: process.env.NODE_ENV === "development" ? msg : undefined,
      },
      { status: 500 }
    );
  }
}
