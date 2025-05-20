import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { verifyJwt } from "@/lib/auth/verify-jwt";

const empresaSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email().optional(),
  telefono: z.string().min(5),
  direccion: z.string(),
  provincia: z.string().optional(),
  localidad: z.string().optional(),
  servicios: z.array(z.string()).optional().default([]),
  imagenes: z.array(z.string()).optional().default([]),
  destacado: z.boolean().optional().default(false),
  habilitado: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    const empresas = await prisma.empresa.findMany({
      orderBy: { id: "asc" },
    });
    return NextResponse.json(empresas);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener empresas" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    const user = token ? verifyJwt(token) : null;

    if (!user || user.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await req.json();
    const parsed = empresaSchema.parse(data);

    const slug = parsed.nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const existe = await prisma.empresa.findUnique({ where: { slug } });
    if (existe) {
      return NextResponse.json({ error: "Slug ya en uso" }, { status: 409 });
    }

    const nueva = await prisma.empresa.create({
      data: {
        ...parsed,
        slug,
        usuarioId: user.id,
      },
    });

    return NextResponse.json(nueva, { status: 201 });
  } catch (err) {
    const msg =
      err instanceof z.ZodError
        ? err.flatten().fieldErrors
        : "Error inesperado";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
