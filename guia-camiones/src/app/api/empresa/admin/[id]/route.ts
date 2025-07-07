import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth";
import pool from "@/lib/db";
import { generarSlug } from "@/lib/slugify";

// PUT: Actualiza empresa
export async function PUT(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const user = token && verifyJwt(token);

  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const id = req.nextUrl.pathname.split("/").pop();
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
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

    const updateQuery = `
      UPDATE empresa
      SET nombre = $1,
          slug = $2,
          email = $3,
          telefono = $4,
          direccion = $5,
          provincia = $6,
          localidad = $7,
          imagenes = $8,
          destacado = $9,
          habilitado = $10,
          web = $11,
          corrientes_de_residuos = $12,
          usuario_id = $13
      WHERE id = $14
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
      Number(id),
    ];

    const { rows } = await pool.query(updateQuery, values);
    const actualizada = rows[0];

    if (!actualizada) {
      return NextResponse.json(
        { message: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(actualizada);
  } catch (error) {
    console.error("❌ Error al actualizar empresa:", error);
    return NextResponse.json(
      { message: "Error al actualizar empresa" },
      { status: 500 }
    );
  }
}

// DELETE: Elimina empresa
export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const user = token && verifyJwt(token);

  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const id = req.nextUrl.pathname.split("/").pop();
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  try {
    const deleteQuery = "DELETE FROM empresa WHERE id = $1 RETURNING id";
    const { rows } = await pool.query(deleteQuery, [Number(id)]);

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Empresa eliminada" });
  } catch (error) {
    console.error("❌ Error al eliminar empresa:", error);
    return NextResponse.json(
      { message: "Error al eliminar empresa" },
      { status: 500 }
    );
  }
}
