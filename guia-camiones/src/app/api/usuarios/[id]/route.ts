import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import { generarSlug } from "@/lib/slugify"; // ✅ Importar la función de slug
import pool from "@/lib/db";

export async function PUT(req: NextRequest) {
  const tokenStore = await cookies();
  const token = tokenStore.get("token")?.value;
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
    const { nombre, email, rol, password } = body;

    if (!nombre || !email || !rol) {
      return NextResponse.json(
        { message: "Nombre, email y rol son obligatorios" },
        { status: 400 }
      );
    }

    let hashedPassword;
    if (password && password.trim() !== "") {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const query = `
      UPDATE usuario
      SET nombre = $1, email = $2, rol = $3${
        hashedPassword ? ", password = $4" : ""
      }
      WHERE id = $${hashedPassword ? 5 : 4}
      RETURNING id, nombre, email, rol, creado_en
    `;

    const values = hashedPassword
      ? [nombre.trim(), email.trim(), rol, hashedPassword, Number(id)]
      : [nombre.trim(), email.trim(), rol, Number(id)];

    const { rows } = await pool.query(query, values);
    const actualizado = rows[0];

    if (!actualizado) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // ✅ Si se actualiza a EMPRESA, crear en tabla empresa si no existe
    if (rol === "EMPRESA") {
      const existeEmpresaQuery = "SELECT id FROM empresa WHERE usuario_id = $1";
      const existeEmpresa = await pool.query(existeEmpresaQuery, [Number(id)]);

      if (existeEmpresa.rows.length === 0) {
        // ✅ FIX: Generar slug correctamente
        const slug = generarSlug(nombre.trim());

        const insertEmpresaQuery = `
          INSERT INTO empresa (nombre, slug, email, usuario_id, habilitado, destacado)
          VALUES ($1, $2, $3, $4, true, false)
        `;
        await pool.query(insertEmpresaQuery, [
          nombre.trim(),
          slug, // ✅ Incluir el slug generado
          email.trim(),
          Number(id),
        ]);

        console.log(`✅ Empresa creada automáticamente con slug: ${slug}`);
      }
    }

    return NextResponse.json(actualizado);
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return NextResponse.json(
      { message: "Error al actualizar usuario" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const tokenStore = await cookies();
  const token = tokenStore.get("token")?.value;
  const user = token && verifyJwt(token);

  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const id = req.nextUrl.pathname.split("/").pop();
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  try {
    // Primero eliminar en la tabla empresa si existe para mantener consistencia
    await pool.query("DELETE FROM empresa WHERE usuario_id = $1", [Number(id)]);

    const deleteQuery = "DELETE FROM usuario WHERE id = $1 RETURNING id";
    const { rows } = await pool.query(deleteQuery, [Number(id)]);
    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Usuario eliminado" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return NextResponse.json(
      { message: "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}
