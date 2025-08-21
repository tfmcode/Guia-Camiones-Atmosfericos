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
      corrientes_de_residuos,
      usuarioId,
      servicios, // ✅ No ponemos valor por defecto aquí
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
      corrientes_de_residuos || null,
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

    // ✅ CAMBIO PRINCIPAL: Solo actualizar servicios si se enviaron explícitamente
    if (servicios !== undefined && Array.isArray(servicios)) {
      console.log(`🔄 Actualizando servicios para empresa ${id}:`, servicios);

      // 1) Borrar servicios anteriores
      await pool.query("DELETE FROM empresa_servicio WHERE empresa_id = $1", [
        Number(id),
      ]);

      // 2) Insertar nuevos servicios si vienen
      if (servicios.length > 0) {
        const insertValues = servicios
          .map((_, idx) => `($1, $${idx + 2})`)
          .join(", ");
        const insertParams = [Number(id), ...servicios];

        const insertQuery = `
          INSERT INTO empresa_servicio (empresa_id, servicio_id)
          VALUES ${insertValues}
        `;
        await pool.query(insertQuery, insertParams);
      }
    } else {
      console.log(
        `⏭️ No se enviaron servicios, manteniendo los actuales para empresa ${id}`
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
