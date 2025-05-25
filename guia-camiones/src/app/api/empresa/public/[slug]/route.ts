// src/app/api/empresa/public/[slug]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

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
