import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth/verify-jwt";
import { empresaSchema } from "@/schemas/empresaSchema";

// PUT: Actualiza empresa
export async function PUT(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const user = token && verifyJwt(token);
  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const id = req.nextUrl.pathname.split("/").pop();
  if (!id) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  const body = await req.json();
  const parse = empresaSchema.safeParse(body);

  if (!parse.success) {
    return NextResponse.json(
      { errors: parse.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const slug = parse.data.nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/\-+/g, "-")
    .replace(/^\-+|\-+$/g, "");

  const actualizada = await prisma.empresa.update({
    where: { id: Number(id) },
    data: {
      ...parse.data,
      slug,
    },
  });

  return NextResponse.json(actualizada);
}

// DELETE: Elimina empresa
export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const user = token && verifyJwt(token);
  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const id = req.nextUrl.pathname.split("/").pop();
  if (!id) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  await prisma.empresa.delete({
    where: { id: Number(id) },
  });

  return NextResponse.json({ message: "Empresa eliminada" });
}
