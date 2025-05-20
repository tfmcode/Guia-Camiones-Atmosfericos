import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Esquema para edición
const empresaUpdateSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email().optional(),
  telefono: z.string(),
  direccion: z.string(),
  provincia: z.string().optional(),
  localidad: z.string().optional(),
  servicios: z.array(z.string()).optional().default([]),
  imagenes: z.array(z.string()).optional().default([]),
  destacado: z.boolean(),
  habilitado: z.boolean(),
  usuarioId: z.number(),
});

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const empresa = await prisma.empresa.findUnique({
    where: { id: Number(params.id) },
  });

  if (!empresa) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  return NextResponse.json(empresa);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const data = empresaUpdateSchema.parse(body);

    const updated = await prisma.empresa.update({
      where: { id: Number(params.id) },
      data,
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 400 });
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.empresa.delete({
      where: { id: Number(params.id) },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
