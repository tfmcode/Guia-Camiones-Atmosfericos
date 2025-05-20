// src/app/api/empresas/admin/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Schema con campos opcionales y string vacío permitido en los campos string
const empresaUpdateSchema = z
  .object({
    nombre: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    telefono: z.string().optional().or(z.literal("")),
    direccion: z.string().optional().or(z.literal("")),
    provincia: z.string().optional().or(z.literal("")),
    localidad: z.string().optional().or(z.literal("")),
    servicios: z.array(z.string()).optional(),
    imagenes: z.array(z.string()).optional(),
    destacado: z.boolean().optional(),
    habilitado: z.boolean().optional(),
  })
  .strict();

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const parsed = empresaUpdateSchema.parse(body);

    // Eliminar campos con valor "" si Prisma no los acepta
    const cleanData = Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => value !== "")
    );

    const updated = await prisma.empresa.update({
      where: { id: Number(params.id) },
      data: cleanData,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("❌ Error actualizando empresa:", err);
    return NextResponse.json(
      { error: "Error al actualizar empresa" },
      { status: 400 }
    );
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
    return NextResponse.json(
      { error: "Error al eliminar empresa" },
      { status: 500 }
    );
  }
}
