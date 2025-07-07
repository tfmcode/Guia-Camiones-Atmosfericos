import { NextResponse } from "next/server";
import { generarSlug } from "@/lib/slugify";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, email, password, telefono, provincia, localidad } = body;

    if (!nombre || !email || !password || !telefono) {
      return NextResponse.json(
        { mensaje: "Nombre, email, contraseña y teléfono son obligatorios" },
        { status: 400 }
      );
    }

    const existeQuery = "SELECT id FROM usuario WHERE email = $1";
    const existeResult = await pool.query(existeQuery, [email]);

    if (existeResult.rows.length > 0) {
      return NextResponse.json(
        { mensaje: "El email ya está registrado" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const insertUsuarioQuery = `
        INSERT INTO usuario (nombre, email, password, rol)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      const usuarioResult = await client.query(insertUsuarioQuery, [
        nombre,
        email,
        hashedPassword,
        "EMPRESA",
      ]);
      const nuevoUsuarioId = usuarioResult.rows[0].id;

      const insertEmpresaQuery = `
        INSERT INTO empresa (nombre, email, telefono, provincia, localidad, slug, usuario_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      await client.query(insertEmpresaQuery, [
        nombre,
        email,
        telefono,
        provincia || null,
        localidad || null,
        generarSlug(nombre),
        nuevoUsuarioId,
      ]);

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return NextResponse.json(
      { mensaje: "Empresa registrada con éxito" },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error en registro:", error);

    if (error instanceof Error) {
      return NextResponse.json({ mensaje: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { mensaje: "Error desconocido del servidor" },
      { status: 500 }
    );
  }
}
