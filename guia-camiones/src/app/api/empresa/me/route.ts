import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { generarSlug } from "@/lib/slugify"; // ✅ AGREGADO: Importar función de slug
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

    // ✅ AGREGADO: Headers para evitar caché
    return NextResponse.json(
      { empresa },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("❌ Error al obtener empresa:", error);
    return NextResponse.json(
      { message: "Error interno al obtener empresa" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const user = token && verifyJwt(token);

  if (!user || user.rol !== "EMPRESA") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { password, servicios, imagenes, ...rest } = body;

    if (!rest.nombre || !rest.telefono || !rest.direccion) {
      return NextResponse.json(
        { message: "Nombre, teléfono y dirección son obligatorios" },
        { status: 400 }
      );
    }

    // ✅ CAMBIO: Obtener datos actuales de la empresa para comparar
    const empresaQuery =
      "SELECT id, nombre, slug FROM empresa WHERE usuario_id = $1";
    const { rows } = await pool.query(empresaQuery, [user.id]);
    const empresa = rows[0];

    if (!empresa) {
      return NextResponse.json(
        { message: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    console.log(
      "🔄 Actualizando empresa ID:",
      empresa.id,
      "- Usuario:",
      user.id
    );

    const updateData: Record<string, unknown> = {};
    Object.entries(rest).forEach(([key, value]) => {
      if (typeof value === "string") {
        updateData[key] = value.trim();
      } else {
        updateData[key] = value;
      }
    });

    // ✅ CAMBIO: Generar nuevo slug si cambió el nombre
    let nuevoSlug = empresa.slug; // Mantener slug actual por defecto
    if (updateData.nombre && updateData.nombre !== empresa.nombre) {
      nuevoSlug = generarSlug(updateData.nombre as string);
      updateData.slug = nuevoSlug;
      console.log("📝 Nombre cambió, nuevo slug generado:", nuevoSlug);
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

    // Agregar campo imágenes si viene en el body
    if (Array.isArray(imagenes)) {
      setClauses.push(`imagenes = $${idx}`);
      values.push(imagenes);
      idx++;
      console.log("🖼️ Actualizando imágenes:", imagenes.length, "archivos");
    }

    // ✅ CAMBIO: Solo actualizar si hay cambios
    if (setClauses.length > 0) {
      const updateQuery = `UPDATE empresa SET ${setClauses.join(
        ", "
      )} WHERE id = $${idx} RETURNING slug`;
      values.push(empresa.id);

      console.log("🚀 Ejecutando actualización de empresa...");
      const updateResult = await pool.query(updateQuery, values);
      const empresaActualizada = updateResult.rows[0];

      console.log(
        "✅ Empresa actualizada, slug actual:",
        empresaActualizada?.slug
      );
    }

    // Actualizar contraseña si corresponde
    if (password && password.length > 4) {
      const hashed = await bcrypt.hash(password, 10);
      await pool.query("UPDATE usuario SET password = $1 WHERE id = $2", [
        hashed,
        user.id,
      ]);
      console.log("🔐 Contraseña actualizada");
    }

    // ✅ CAMBIO: Actualizar servicios de forma más robusta
    if (Array.isArray(servicios)) {
      console.log("🔧 Actualizando servicios:", servicios);

      // Eliminar servicios existentes
      await pool.query("DELETE FROM empresa_servicio WHERE empresa_id = $1", [
        empresa.id,
      ]);

      // Insertar nuevos servicios
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
        console.log(
          "✅ Servicios actualizados:",
          servicios.length,
          "servicios"
        );
      }
    }

    // ✅ CAMBIO: Devolver la empresa actualizada completa con servicios
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

    console.log("✅ Datos finales de empresa:", {
      id: updatedEmpresa.id,
      nombre: updatedEmpresa.nombre,
      slug: updatedEmpresa.slug,
      servicios: updatedEmpresa.servicios?.length || 0,
      imagenes: updatedEmpresa.imagenes?.length || 0,
    });

    // ✅ AGREGADO: Headers para evitar caché en la respuesta
    return NextResponse.json(
      {
        message: "Empresa actualizada correctamente",
        empresa: updatedEmpresa,
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("❌ Error al actualizar empresa:", error);
    return NextResponse.json(
      { message: "Error interno al actualizar empresa" },
      { status: 500 }
    );
  }
}
