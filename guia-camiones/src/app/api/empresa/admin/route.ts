import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth";
import { generarSlug } from "@/lib/slugify";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const user = token && verifyJwt(token);

  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  try {
    const { rows } = await pool.query("SELECT * FROM empresa ORDER BY id DESC");
    return NextResponse.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener empresas:", error);
    return NextResponse.json(
      { message: "Error al obtener empresas" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const user = token && verifyJwt(token);

  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      nombre,
      email,
      telefono,
      direccion,
      provincia,
      localidad,
      imagenes = [],
      destacado = false,
      habilitado = true,
      web,
      corrienteServicios,
      usuarioId,
    } = body;

    if (!nombre || !telefono || !direccion) {
      return NextResponse.json(
        { message: "Nombre, teléfono y dirección son obligatorios" },
        { status: 400 }
      );
    }

    const slug = generarSlug(nombre);

    const insertQuery = `
      INSERT INTO empresa 
      (nombre, slug, email, telefono, direccion, provincia, localidad, imagenes, destacado, habilitado, web, corrientes_de_residuos, usuario_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const values = [
      nombre,
      slug,
      email || null,
      telefono,
      direccion,
      provincia || null,
      localidad || null,
      imagenes.length > 0 ? imagenes : null,
      destacado,
      habilitado,
      web || null,
      corrienteServicios || null,
      usuarioId || null,
    ];

    const { rows } = await pool.query(insertQuery, values);
    const nueva = rows[0];

    return NextResponse.json(nueva, { status: 201 });
  } catch (error) {
    console.error("❌ Error al crear empresa:", error);
    return NextResponse.json(
      { message: "Error al crear empresa" },
      { status: 500 }
    );
  }
}
