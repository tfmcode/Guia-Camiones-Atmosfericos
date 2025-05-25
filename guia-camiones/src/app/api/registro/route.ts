import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { empresaSchema } from "@/schemas/empresaSchema";
import { z } from "zod";

const registroSchema = empresaSchema.extend({
  password: z.string().min(6, "Contraseña requerida"),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parse = registroSchema.safeParse(body);

  if (!parse.success) {
    return NextResponse.json(
      { errors: parse.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { password, ...empresaData } = parse.data;
  const hashed = await bcrypt.hash(password, 10);

  // Generamos el slug a partir del nombre
  const slug = empresaData.nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // elimina tildes
    .replace(/\s+/g, "-") // espacios por guiones
    .replace(/[^a-z0-9\-]/g, "") // caracteres especiales
    .replace(/\-+/g, "-") // unifica múltiples guiones
    .replace(/^\-+|\-+$/g, ""); // guiones al inicio y fin

  // Nos aseguramos de que email no sea undefined
  const email = empresaData.email || "";

  const usuario = await prisma.usuario.create({
    data: {
      nombre: empresaData.nombre,
      email: email,
      password: hashed,
      rol: "EMPRESA",
      empresa: {
        create: {
          ...empresaData,
          email: email,
          slug: slug,
        },
      },
    },
    include: {
      empresa: true,
    },
  });

  return NextResponse.json(usuario, { status: 201 });
}
