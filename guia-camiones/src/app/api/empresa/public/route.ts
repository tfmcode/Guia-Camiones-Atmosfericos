import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET público para listar empresas
export async function GET() {
  const empresas = await prisma.empresa.findMany({
    select: {
      id: true,
      nombre: true,
      provincia: true,
      localidad: true,
      servicios: true,
      imagenes: true,
      destacado: true,
      slug: true,
    },
  });

  return NextResponse.json(empresas);
}
