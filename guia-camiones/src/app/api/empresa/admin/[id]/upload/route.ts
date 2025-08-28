// src/app/api/empresa/admin/[id]/upload/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";

export const dynamic = "force-dynamic";

const BASE = process.env.UPLOADS_DIR || "/var/www/guia/uploads";
const PUBLIC_BASE = process.env.UPLOADS_BASE_URL || "/uploads";

const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

type Ctx = { params: { id: string } };

export async function POST(req: Request, { params }: Ctx) {
  const { id } = params;

  // 👇 cookies() es Promise, por eso el await:
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
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

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

    const nameNoExt = file.name
      .split(".")
      .slice(0, -1)
      .join(".")
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-]/g, "");
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const filename = `${nameNoExt || "img"}-${Date.now()}.${ext}`;

    // sin slash inicial para que el alias de nginx /uploads/ resuelva bien
    const relative = path.join("empresa", String(id), filename);
    const target = path.join(BASE, relative);

    await fs.mkdir(path.dirname(target), { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(target, buf, { mode: 0o644 });

    urls.push(`${PUBLIC_BASE}/${relative.replace(/\\/g, "/")}`);
  }

  return NextResponse.json({
    urls,
    message: `${urls.length} archivo(s) subido(s) correctamente`,
  });
}
