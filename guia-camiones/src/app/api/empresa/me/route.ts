import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth/verify-jwt";
import { empresaSchema } from "@/schemas/empresaSchema";
import bcrypt from "bcrypt";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const user = token && verifyJwt(token);

  if (!user || user.rol !== "EMPRESA") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const empresa = await prisma.empresa.findUnique({
    where: { usuarioId: user.id },
  });

  return NextResponse.json(empresa);
}

export async function PUT(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const user = token && verifyJwt(token);

  if (!user || user.rol !== "EMPRESA") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();

  // Validamos los datos del formulario (sin incluir password)
  const parse = empresaSchema.partial().safeParse(body);

  if (!parse.success) {
    return NextResponse.json(
      { errors: parse.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Datos parseados
  const dataToUpdate = parse.data;

  // Si vino una contraseña, la actualizamos en la tabla Usuario
  if (body.password && typeof body.password === "string") {
    const hashed = await bcrypt.hash(body.password, 10);
    await prisma.usuario.update({
      where: { id: user.id },
      data: { password: hashed },
    });
  }

  // Actualizamos la empresa (sin password)
  const actualizada = await prisma.empresa.update({
    where: { usuarioId: user.id },
    data: dataToUpdate,
  });

  return NextResponse.json(actualizada);
}
