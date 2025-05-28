import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { verifyJwt } from "@/lib/auth/verify-jwt";
import { usuarioSchema } from "@/schemas/usuarioSchemas";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const user = token && verifyJwt(token);

  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      creadoEn: true,
    },
  });

  return NextResponse.json(usuarios);
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const user = token && verifyJwt(token);

  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();

  const parse = usuarioSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { errors: parse.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email, nombre, password, rol } = parse.data;

  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe) {
    return NextResponse.json(
      { message: "Email ya registrado" },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(password, 10);

  const nuevo = await prisma.usuario.create({
    data: { nombre, email, password: hashed, rol },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...resto } = nuevo;

  return NextResponse.json(resto, { status: 201 });
}
