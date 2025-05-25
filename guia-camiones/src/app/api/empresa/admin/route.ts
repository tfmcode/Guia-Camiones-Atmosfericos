import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/auth/verify-jwt";
import { empresaSchema } from "@/schemas/empresaSchema";

// GET: Lista todas las empresas (solo ADMIN)
export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const user = token && verifyJwt(token);

  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const empresas = await prisma.empresa.findMany();
  return NextResponse.json(empresas);
}

// POST: Crea nueva empresa (slug auto, usuario opcional)
export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const user = token && verifyJwt(token);

  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parse = empresaSchema.safeParse(body);

  if (!parse.success) {
    return NextResponse.json(
      { errors: parse.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const slug = parse.data.nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/\-+/g, "-")
    .replace(/^\-+|\-+$/g, "");

  const nueva = await prisma.empresa.create({
    data: {
      ...parse.data,
      slug,
    },
  });

  return NextResponse.json(nueva, { status: 201 });
}
