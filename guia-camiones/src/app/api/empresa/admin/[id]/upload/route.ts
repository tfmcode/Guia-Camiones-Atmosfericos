import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  console.log("📁 Upload endpoint llamado para empresa ID:", id);

  const token = req.cookies.get("token")?.value;
  const user = token && verifyJwt(token);

  if (
    !user ||
    typeof user === "string" ||
    (user.rol !== "ADMIN" && user.rol !== "EMPRESA")
  ) {
    console.error(
      "❌ Usuario no autorizado:",
      typeof user === "object" ? user?.rol : "sin token"
    );
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  if (!id || isNaN(Number(id))) {
    console.error("❌ ID inválido:", id);
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("file") as File[];

    console.log("📋 Archivos recibidos:", files.length);

    if (!files.length) {
      console.error("❌ No se recibieron archivos");
      return NextResponse.json(
        { message: "No se recibieron archivos" },
        { status: 400 }
      );
    }

    const savedFiles: string[] = [];

    for (const file of files) {
      console.log("🔄 Procesando archivo:", file.name, "size:", file.size);

      // Validar tipo de archivo
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        console.error("❌ Tipo de archivo no permitido:", file.type);
        return NextResponse.json(
          { message: `Tipo de archivo no permitido: ${file.type}` },
          { status: 400 }
        );
      }

      // Validar tamaño (5MB máximo)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        console.error("❌ Archivo muy grande:", file.size);
        return NextResponse.json(
          { message: "El archivo es muy grande. Máximo 5MB." },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const name = file.name
        .split(".")
        .slice(0, -1)
        .join(".")
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9-]/g, ""); // Limpiar caracteres especiales

      const filename = `${name}-${Date.now()}.${ext}`;
      const relativePath = `/uploads/empresa/${id}/${filename}`;
      const fsPath = `${process.cwd()}/public${relativePath}`;

      console.log("💾 Guardando archivo:", relativePath);

      const fs = await import("fs/promises");

      // Crear directorio si no existe
      const dirPath = `${process.cwd()}/public/uploads/empresa/${id}`;
      await fs.mkdir(dirPath, { recursive: true });

      // Escribir archivo
      await fs.writeFile(fsPath, buffer);

      console.log("✅ Archivo guardado correctamente:", relativePath);
      savedFiles.push(relativePath);
    }

    console.log("🎉 Todos los archivos procesados:", savedFiles);

    return NextResponse.json({
      urls: savedFiles,
      message: `${savedFiles.length} archivo(s) subido(s) correctamente`,
    });
  } catch (error) {
    console.error("❌ Error en upload endpoint:", error);

    // Manejo específico de errores comunes
    if (error instanceof Error) {
      if (error.message.includes("ENOSPC")) {
        return NextResponse.json(
          { message: "No hay espacio suficiente en el servidor" },
          { status: 507 }
        );
      }

      if (error.message.includes("EACCES") || error.message.includes("EPERM")) {
        return NextResponse.json(
          { message: "Error de permisos en el servidor" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        message: "Error interno del servidor al subir archivos",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  }
}
