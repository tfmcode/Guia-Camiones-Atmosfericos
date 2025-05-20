import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const empresaSchema = z.object({
  nombre: z.string().min(3),
  email: z.string().email().optional(),
  telefono: z.string(),
  direccion: z.string(),
  provincia: z.string().optional(),
  localidad: z.string().optional(),
  servicios: z.array(z.string()),
  imagenes: z.array(z.string()).optional(),
  destacado: z.boolean().optional(),
  habilitado: z.boolean().optional(),
});

export async function GET() {
  const empresas = await prisma.empresa.findMany({
    orderBy: { id: "asc" },
  });
  return NextResponse.json(empresas);
}

export async function POST(req: NextRequest) {
  try {
    const data = empresaSchema.parse(await req.json());

    const nuevaEmpresa = await prisma.empresa.create({
      data: {
        ...data,
        usuarioId: 1, 
        slug: data.nombre.toLowerCase().replace(/\s+/g, "-"),
        destacado: data.destacado ?? false,
        habilitado: data.habilitado ?? true,
      },
    });

    return NextResponse.json(nuevaEmpresa, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al crear empresa" },
      { status: 400 }
    );
  }
}
