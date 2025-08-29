import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth";
import pool from "@/lib/db";
import { generarSlug } from "@/lib/slugify";

const noCacheHeaders = {
  "Cache-Control": "no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

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

    // Separá servicios e imagenes, y dejá el resto en "rest"
    const { servicios, imagenes, ...rest } = body as Record<string, unknown>;

    // Validaciones mínimas
    if (!rest.nombre || !rest.telefono || !rest.direccion) {
      return NextResponse.json(
        { message: "Nombre, teléfono y dirección son obligatorios" },
        { status: 400, headers: noCacheHeaders }
      );
    }

    // Traer empresa actual para comparar slug por nombre
    const current = await pool.query(
      "SELECT id, nombre, slug FROM empresa WHERE id = $1",
      [Number(id)]
    );
    const empresaActual = current.rows[0];
    if (!empresaActual) {
      return NextResponse.json(
        { message: "Empresa no encontrada" },
        { status: 404, headers: noCacheHeaders }
      );
    }

    // Construir updateData con TODOS los campos del body (rest), trim de strings
    const updateData: Record<string, unknown> = {};
    Object.entries(rest).forEach(([k, v]) => {
      updateData[k] = typeof v === "string" ? (v as string).trim() : v;
    });

    // Solo regenerar slug si cambió el nombre, pero SIEMPRE incluir slug en el UPDATE
    let nuevoSlug = empresaActual.slug;
    if (
      typeof updateData.nombre === "string" &&
      updateData.nombre !== empresaActual.nombre
    ) {
      nuevoSlug = generarSlug(updateData.nombre as string);
    }
    updateData.slug = nuevoSlug;

    // Campos permitidos a actualizar
    const fieldsToUpdate = [
      "nombre",
      "email",
      "telefono",
      "direccion",
      "provincia",
      "localidad",
      "web",
      "corrientes_de_residuos",
      "destacado",
      "habilitado",
      "usuario_id",
      "slug",
    ];

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    fieldsToUpdate.forEach((field) => {
      if (field in updateData) {
        setClauses.push(`${field} = $${idx}`);
        values.push(updateData[field]);
        idx++;
      }
    });

    // Manejo de imágenes (array o null)
    if (Array.isArray(imagenes)) {
      setClauses.push(`imagenes = $${idx}`);
      values.push(imagenes);
      idx++;
    } else if (imagenes === null) {
      // permitir explicitamente vaciar
      setClauses.push(`imagenes = $${idx}`);
      values.push(null);
      idx++;
    }

    if (setClauses.length === 0) {
      // Nada para actualizar (no debería pasar, pero por las dudas)
      return NextResponse.json(
        { message: "No hay campos para actualizar" },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const updateQuery = `
      UPDATE empresa
      SET ${setClauses.join(", ")}
      WHERE id = $${idx}
      RETURNING id
    `;
    values.push(Number(id));

    await pool.query(updateQuery, values);

    // Servicios: solo tocar si se enviaron explícitamente
    if (servicios !== undefined) {
      if (!Array.isArray(servicios)) {
        return NextResponse.json(
          { message: "Formato inválido de servicios" },
          { status: 400, headers: noCacheHeaders }
        );
      }

      await pool.query("DELETE FROM empresa_servicio WHERE empresa_id = $1", [
        Number(id),
      ]);

      if (servicios.length > 0) {
        const insertValues = servicios
          .map((_, i) => `($1, $${i + 2})`)
          .join(", ");
        const params = [Number(id), ...servicios];
        await pool.query(
          `INSERT INTO empresa_servicio (empresa_id, servicio_id) VALUES ${insertValues}`,
          params
        );
      }
    }

    // Devolver empresa completa y fresca (con servicios)
    const full = await pool.query(
      `
      SELECT e.*,
        COALESCE(
          JSON_AGG(json_build_object('id', s.id, 'nombre', s.nombre))
          FILTER (WHERE s.id IS NOT NULL), '[]'
        ) AS servicios
      FROM empresa e
      LEFT JOIN empresa_servicio es ON e.id = es.empresa_id
      LEFT JOIN servicio s ON es.servicio_id = s.id
      WHERE e.id = $1
      GROUP BY e.id
      `,
      [Number(id)]
    );

    return NextResponse.json(full.rows[0], { headers: noCacheHeaders });
  } catch (error) {
    console.error("❌ Error al actualizar empresa:", error);
    return NextResponse.json(
      { message: "Error al actualizar empresa" },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

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
    const del = await pool.query(
      "DELETE FROM empresa WHERE id = $1 RETURNING id",
      [Number(id)]
    );

    if (del.rowCount === 0) {
      return NextResponse.json(
        { message: "Empresa no encontrada" },
        { status: 404, headers: noCacheHeaders }
      );
    }

    return NextResponse.json(
      { message: "Empresa eliminada" },
      { headers: noCacheHeaders }
    );
  } catch (error) {
    console.error("❌ Error al eliminar empresa:", error);
    return NextResponse.json(
      { message: "Error al eliminar empresa" },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
