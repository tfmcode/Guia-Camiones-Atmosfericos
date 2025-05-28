import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: { slug: string } }
) {
  const { slug } = context.params;

  const empresa = await prisma.empresa.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      nombre: true,
      email: true,
      telefono: true,
      direccion: true,
      provincia: true,
      localidad: true,
      servicios: true,
      imagenes: true,
      destacado: true,
    },
  });

  if (!empresa) {
    return NextResponse.json({ message: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json(empresa);
}
