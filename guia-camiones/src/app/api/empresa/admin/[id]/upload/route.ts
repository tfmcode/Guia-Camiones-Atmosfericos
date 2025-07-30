import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const token = req.cookies.get("token")?.value;
  const user = token && verifyJwt(token);

  if (!user || (user.rol !== "ADMIN" && user.rol !== "EMPRESA")) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  const formData = await req.formData();
  const files = formData.getAll("file") as File[];

  if (!files.length) {
    return NextResponse.json(
      { message: "No se recibieron archivos" },
      { status: 400 }
    );
  }

  const savedFiles: string[] = [];

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop();
    const name = file.name
      .split(".")
      .slice(0, -1)
      .join(".")
      .replace(/\s+/g, "-");
    const filename = `${name}-${Date.now()}.${ext}`;

    const relativePath = `/uploads/empresa/${id}/${filename}`;
    const fsPath = `${process.cwd()}/public${relativePath}`;

    const fs = await import("fs/promises");
    await fs.mkdir(`${process.cwd()}/public/uploads/empresa/${id}`, {
      recursive: true,
    });
    await fs.writeFile(fsPath, buffer);

    savedFiles.push(relativePath);
  }

  return NextResponse.json({ urls: savedFiles });
}
