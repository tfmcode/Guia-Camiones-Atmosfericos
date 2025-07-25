import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params;

  try {
    const empresaQuery = `
      SELECT 
        id, slug, nombre, email, telefono, direccion, provincia,
        localidad, imagenes, destacado, habilitado, fecha_creacion
      FROM empresa
      WHERE slug = $1
      LIMIT 1
    `;
    const { rows } = await pool.query(empresaQuery, [slug]);
    const empresa = rows[0];

    if (!empresa || !empresa.habilitado) {
      return NextResponse.json({ message: "No encontrado" }, { status: 404 });
    }

    const serviciosQuery = `
      SELECT s.id, s.nombre
      FROM empresa_servicio es
      JOIN servicio s ON s.id = es.servicio_id
      WHERE es.empresa_id = $1
    `;
    const { rows: servicios } = await pool.query(serviciosQuery, [empresa.id]);

    return NextResponse.json({
      ...empresa,
      servicios,
    });
  } catch (error) {
    console.error("❌ Error al obtener empresa pública:", error);
    return NextResponse.json(
      { message: "Error al obtener empresa" },
      { status: 500 }
    );
  }
}
