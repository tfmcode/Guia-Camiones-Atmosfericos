import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth/verify-jwt";
import { usuarioUpdateSchema } from "@/schemas/usuarioSchemas";
import bcrypt from "bcrypt";
import { z } from "zod";

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
  const parse = usuarioUpdateSchema.safeParse(body);

  if (!parse.success) {
    return NextResponse.json(
      { errors: parse.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { password, ...rest } = parse.data;
  const dataToUpdate: Omit<z.infer<typeof usuarioUpdateSchema>, "password"> & {
    password?: string;
  } = { ...rest };

  if (password) {
    const hashed = await bcrypt.hash(password, 10);
    dataToUpdate.password = hashed;
  }

  const actualizado = await prisma.usuario.update({
    where: { id: Number(id) },
    data: dataToUpdate,
  });

  // Eliminamos manualmente el password en lugar de usar destructuring
  const sanitizado = {
    id: actualizado.id,
    nombre: actualizado.nombre,
    email: actualizado.email,
    rol: actualizado.rol,
    creadoEn: actualizado.creadoEn,
  };

  return NextResponse.json(sanitizado);
}

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

  await prisma.usuario.delete({
    where: { id: Number(id) },
  });

  return NextResponse.json({ message: "Usuario eliminado" });
}
