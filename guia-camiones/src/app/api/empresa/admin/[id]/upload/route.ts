// src/app/api/empresa/admin/[id]/upload/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";

export const dynamic = "force-dynamic";

// ✅ FIX PRINCIPAL: Configuración de directorio que funciona en todos los entornos
const BASE =
  process.env.NODE_ENV === "production"
    ? process.env.UPLOADS_DIR ?? "/app/public/uploads" // Para producción (Railway, etc.)
    : path.join(process.cwd(), "public", "uploads"); // Para desarrollo local

// ✅ FIX: URL base más robusta
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://guia-atmosfericos.com"
    : "http://localhost:3000");

const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request, context: unknown) {
  console.log("🚀 [Upload] Iniciando proceso de upload...");

  const { id } = (context as { params?: { id?: string } })?.params ?? {};
  const empresaId = String(id ?? "");

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const user = token && verifyJwt(token);

  // ✅ FIX: Verificación de tipo más robusta
  if (
    !user ||
    typeof user === "string" ||
    !("rol" in user) ||
    (user.rol !== "ADMIN" && user.rol !== "EMPRESA")
  ) {
    console.error(
      "❌ [Upload] No autorizado:",
      typeof user === "object" && user && "rol" in user ? user.rol : "sin token"
    );
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  if (!empresaId || Number.isNaN(Number(empresaId))) {
    console.error("❌ [Upload] ID de empresa inválido:", empresaId);
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  console.log(`📁 [Upload] Procesando upload para empresa ${empresaId}`);
  console.log(`📁 [Upload] Usuario: ${user.email} (${user.rol})`);
  console.log(`📁 [Upload] BASE directory: ${BASE}`);
  console.log(`📁 [Upload] SITE_URL: ${SITE_URL}`);

  try {
    const form = await req.formData();
    const files = form.getAll("file") as File[];

    if (!files.length) {
      console.error("❌ [Upload] No se recibieron archivos");
      return NextResponse.json(
        { message: "No se recibieron archivos" },
        { status: 400 }
      );
    }

    console.log(`📁 [Upload] Procesando ${files.length} archivo(s)`);

    const urls: string[] = [];

    for (const file of files) {
      console.log(
        `📄 [Upload] Procesando archivo: ${file.name} (${file.size} bytes, ${file.type})`
      );

      if (!ALLOWED.has(file.type)) {
        console.error(`❌ [Upload] Tipo de archivo no permitido: ${file.type}`);
        return NextResponse.json(
          {
            message: `Tipo de archivo no permitido: ${file.type}. Formatos permitidos: JPG, PNG, WebP`,
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_SIZE) {
        console.error(`❌ [Upload] Archivo muy grande: ${file.size} bytes`);
        return NextResponse.json(
          {
            message: `El archivo "${file.name}" es muy grande. Máximo 5MB.`,
          },
          { status: 400 }
        );
      }

      // ✅ FIX: Generar nombre de archivo más seguro
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const ext = path.extname(file.name).toLowerCase() || ".jpg";
      const baseName =
        file.name
          .replace(/\.[^.]+$/, "")
          .replace(/\s+/g, "-")
          .replace(/[^a-zA-Z0-9-]/g, "")
          .substring(0, 20) || "img";

      const filename = `${baseName}-${timestamp}-${random}${ext}`;

      // ✅ FIX: Crear estructura de directorio más robusta
      const empresaDir = path.join(BASE, "empresa", empresaId);
      const filePath = path.join(empresaDir, filename);

      console.log(`📁 [Upload] Directorio empresa: ${empresaDir}`);
      console.log(`📁 [Upload] Ruta completa archivo: ${filePath}`);

      try {
        // ✅ FIX: Crear directorio recursivamente con mejor manejo de errores
        console.log(`📁 [Upload] Creando directorio: ${empresaDir}`);
        await fs.mkdir(empresaDir, { recursive: true, mode: 0o755 });
        console.log(`✅ [Upload] Directorio creado/verificado correctamente`);

        // ✅ FIX: Escribir archivo con mejor manejo
        const buffer = Buffer.from(await file.arrayBuffer());
        console.log(
          `💾 [Upload] Escribiendo archivo de ${buffer.length} bytes...`
        );

        await fs.writeFile(filePath, buffer, { mode: 0o644 });
        console.log(`✅ [Upload] Archivo guardado exitosamente: ${filename}`);

        // ✅ FIX: Verificar que el archivo se guardó correctamente
        const stats = await fs.stat(filePath);
        console.log(`📊 [Upload] Archivo verificado: ${stats.size} bytes`);
      } catch (writeError) {
        console.error(`❌ [Upload] Error al escribir archivo:`, writeError);

        // ✅ FIX: Fallback a directorio temporal si hay problemas de permisos
        if (
          writeError instanceof Error &&
          writeError.message.includes("EACCES")
        ) {
          console.log(`🔄 [Upload] Intentando usar directorio temporal...`);

          const tempDir = path.join(
            process.cwd(),
            "temp",
            "uploads",
            "empresa",
            empresaId
          );
          const tempFilePath = path.join(tempDir, filename);

          await fs.mkdir(tempDir, { recursive: true, mode: 0o755 });
          const buffer = Buffer.from(await file.arrayBuffer());
          await fs.writeFile(tempFilePath, buffer, { mode: 0o644 });

          console.log(
            `✅ [Upload] Archivo guardado en directorio temporal: ${tempFilePath}`
          );

          // Actualizar la ruta para la URL
          const relativePath = path.posix.join(
            "temp",
            "uploads",
            "empresa",
            empresaId,
            filename
          );
          const fullUrl = `${SITE_URL}/${relativePath}`;
          urls.push(fullUrl);

          console.log(`🔗 [Upload] URL temporal generada: ${fullUrl}`);
          continue;
        } else {
          throw writeError;
        }
      }

      // ✅ FIX: Generar URL con formato correcto - usando "uploads" directamente
      const relativePath = path.posix.join(
        "uploads",
        "empresa",
        empresaId,
        filename
      );
      const fullUrl = `${SITE_URL}/${relativePath}`;

      console.log(`🔗 [Upload] URL generada: ${fullUrl}`);
      urls.push(fullUrl);
    }

    console.log(
      `✅ [Upload] Upload completado. ${urls.length} archivo(s) procesado(s)`
    );

    return NextResponse.json({
      urls,
      message: `${urls.length} archivo(s) subido(s) correctamente`,
      debug:
        process.env.NODE_ENV === "development"
          ? {
              baseDir: BASE,
              siteUrl: SITE_URL,
              empresaId,
              generatedUrls: urls,
            }
          : undefined,
    });
  } catch (error) {
    console.error("❌ [Upload] Error crítico en upload:", error);

    // ✅ FIX: Mejor información de debugging
    const errorDetails =
      error instanceof Error
        ? {
            message: error.message,
            code: "code" in error ? error.code : undefined,
            errno: "errno" in error ? error.errno : undefined,
            path: "path" in error ? error.path : undefined,
          }
        : { message: String(error) };

    console.error("❌ [Upload] Detalles del error:", errorDetails);

    return NextResponse.json(
      {
        message: "Error interno del servidor al procesar la subida",
        details:
          process.env.NODE_ENV === "development"
            ? errorDetails
            : "Error interno del servidor",
        debug:
          process.env.NODE_ENV === "development"
            ? {
                baseDir: BASE,
                siteUrl: SITE_URL,
                empresaId,
                nodeEnv: process.env.NODE_ENV,
                platform: process.platform,
                cwd: process.cwd(),
              }
            : undefined,
      },
      { status: 500 }
    );
  }
}
