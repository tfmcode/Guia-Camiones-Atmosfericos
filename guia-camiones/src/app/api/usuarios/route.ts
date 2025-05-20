import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Schema para validación de entrada
const usuarioSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  rol: z.enum(["ADMIN", "EMPRESA", "USUARIO"]),
});

// GET → Lista de usuarios
export async function GET() {
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        creadoEn: true,
      },
    });

    return NextResponse.json(usuarios);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}

// POST → Crear usuario
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const parsed = usuarioSchema.parse(data);

    const existe = await prisma.usuario.findUnique({
      where: { email: parsed.email },
    });
    if (existe) {
      return NextResponse.json(
        { error: "Email ya registrado" },
        { status: 409 }
      );
    }

    const nuevoUsuario = await prisma.usuario.create({ data: parsed });

    return NextResponse.json(nuevoUsuario, { status: 201 });
  } catch (err) {
    const errorMessage =
      err instanceof z.ZodError
        ? err.flatten().fieldErrors
        : "Error al crear usuario";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
