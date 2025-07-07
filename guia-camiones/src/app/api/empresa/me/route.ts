import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const user = token && verifyJwt(token);

  if (!user || user.rol !== "EMPRESA") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  try {
    const empresaQuery = `
      SELECT e.*,
        COALESCE(
          JSON_AGG(
            json_build_object('id', s.id, 'nombre', s.nombre)
          ) FILTER (WHERE s.id IS NOT NULL), '[]'
        ) AS servicios
      FROM empresa e
      LEFT JOIN empresa_servicio es ON e.id = es.empresa_id
      LEFT JOIN servicio s ON es.servicio_id = s.id
      WHERE e.usuario_id = $1
      GROUP BY e.id
    `;
    const { rows } = await pool.query(empresaQuery, [user.id]);
    const empresa = rows[0];

    if (!empresa) {
      return NextResponse.json(
        { message: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ empresa });
  } catch (error) {
    console.error("❌ Error al obtener empresa:", error);
    return NextResponse.json(
      { message: "Error interno al obtener empresa" },
      { status: 500 }
    );
  }
}

/* ✅ PUT: actualizar datos de la empresa logueada y devolver actualizada */
export async function PUT(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const user = token && verifyJwt(token);

  if (!user || user.rol !== "EMPRESA") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { password, servicios, ...rest } = body;

    if (!rest.nombre || !rest.telefono || !rest.direccion) {
      return NextResponse.json(
        { message: "Nombre, teléfono y dirección son obligatorios" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    Object.entries(rest).forEach(([key, value]) => {
      if (typeof value === "string") {
        updateData[key] = value.trim();
      } else {
        updateData[key] = value;
      }
    });

    const empresaQuery = "SELECT id FROM empresa WHERE usuario_id = $1";
    const { rows } = await pool.query(empresaQuery, [user.id]);
    const empresa = rows[0];

    if (!empresa) {
      return NextResponse.json(
        { message: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    // Construir dinámicamente el query de actualización
    const setClauses = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updateData)) {
      setClauses.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }

    if (setClauses.length > 0) {
      const updateQuery = `UPDATE empresa SET ${setClauses.join(
        ", "
      )} WHERE id = $${idx}`;
      values.push(empresa.id);
      await pool.query(updateQuery, values);
    }

    // Actualizar contraseña si corresponde
    if (password && password.length > 4) {
      const hashed = await bcrypt.hash(password, 10);
      await pool.query("UPDATE usuario SET password = $1 WHERE id = $2", [
        hashed,
        user.id,
      ]);
    }

    // Actualizar servicios si se enviaron
    if (Array.isArray(servicios)) {
      await pool.query("DELETE FROM empresa_servicio WHERE empresa_id = $1", [
        empresa.id,
      ]);

      if (servicios.length > 0) {
        const insertValues = servicios
          .map((id, i) => `($1, $${i + 2})`)
          .join(", ");
        const params = [empresa.id, ...servicios];

        const insertQuery = `
          INSERT INTO empresa_servicio (empresa_id, servicio_id)
          VALUES ${insertValues}
        `;
        await pool.query(insertQuery, params);
      }
    }

    // 🔄 Devolver la empresa actualizada con servicios
    const updatedEmpresaQuery = `
      SELECT e.*,
        COALESCE(
          JSON_AGG(
            json_build_object('id', s.id, 'nombre', s.nombre)
          ) FILTER (WHERE s.id IS NOT NULL), '[]'
        ) AS servicios
      FROM empresa e
      LEFT JOIN empresa_servicio es ON e.id = es.empresa_id
      LEFT JOIN servicio s ON es.servicio_id = s.id
      WHERE e.id = $1
      GROUP BY e.id
    `;
    const { rows: updatedRows } = await pool.query(updatedEmpresaQuery, [
      empresa.id,
    ]);
    const updatedEmpresa = updatedRows[0];

    return NextResponse.json({
      message: "Empresa actualizada correctamente",
      empresa: updatedEmpresa,
    });
  } catch (error) {
    console.error("❌ Error al actualizar empresa:", error);
    return NextResponse.json(
      { message: "Error interno al actualizar empresa" },
      { status: 500 }
    );
  }
}
