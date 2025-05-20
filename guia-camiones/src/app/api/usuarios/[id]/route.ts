import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const usuarioUpdateSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  rol: z.enum(["ADMIN", "EMPRESA", "USUARIO"]),
});

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(params.id) },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        creadoEn: true,
      },
    });

    if (!usuario)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    return NextResponse.json(usuario);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener usuario" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const data = usuarioUpdateSchema.parse(body);

    const updated = await prisma.usuario.update({
      where: { id: Number(params.id) },
      data,
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.usuario.delete({ where: { id: Number(params.id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}
