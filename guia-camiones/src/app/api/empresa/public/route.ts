import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    // Traer empresas habilitadas con orden de fecha de creación descendente
    const empresasQuery = `
      SELECT 
        e.id, e.nombre, e.provincia, e.localidad, e.imagenes, 
        e.destacado, e.slug, e.telefono, e.email
      FROM empresa e
      WHERE e.habilitado = true
      ORDER BY e.fecha_creacion DESC
    `;
    const { rows: empresas } = await pool.query(empresasQuery);

    // Si no hay empresas, devolver array vacío
    if (empresas.length === 0) {
      return NextResponse.json([]);
    }

    // Obtener todos los servicios asociados a las empresas de un solo query
    const empresaIds = empresas.map((e) => e.id);
    const serviciosQuery = `
      SELECT es.empresa_id, s.id, s.nombre
      FROM empresa_servicio es
      JOIN servicio s ON s.id = es.servicio_id
      WHERE es.empresa_id = ANY($1::int[])
    `;
    const { rows: servicios } = await pool.query(serviciosQuery, [empresaIds]);

    // Mapear servicios a cada empresa
    const empresasConServicios = empresas.map((empresa) => ({
      ...empresa,
      servicios: servicios
        .filter((s) => s.empresa_id === empresa.id)
        .map((s) => ({
          id: s.id,
          nombre: s.nombre,
        })),
    }));

    return NextResponse.json(empresasConServicios);
  } catch (error) {
    console.error("❌ Error al obtener empresas públicas:", error);
    return NextResponse.json(
      { message: "Error al obtener empresas" },
      { status: 500 }
    );
  }
}
