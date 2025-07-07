import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET() {
  const tokenStore = await cookies();
  const token = tokenStore.get("token")?.value;
  const user = token && verifyJwt(token);

  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  try {
    const query = `
      SELECT id, nombre, email, rol, creado_en
      FROM usuario
      ORDER BY creado_en DESC
    `;
    const { rows } = await pool.query(query);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json(
      { message: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const tokenStore = await cookies();
  const token = tokenStore.get("token")?.value;
  const user = token && verifyJwt(token);

  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { email, nombre, password, rol } = body;

    if (!email || !nombre || !password || !rol) {
      return NextResponse.json(
        { message: "Todos los campos son obligatorios" },
        { status: 400 }
      );
    }

    // Verificar existencia del usuario
    const existeQuery = "SELECT id FROM usuario WHERE email = $1";
    const existeResult = await pool.query(existeQuery, [email.trim()]);

    if (existeResult.rows.length > 0) {
      return NextResponse.json(
        { message: "Email ya registrado" },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    // Insertar el usuario
    const insertQuery = `
      INSERT INTO usuario (nombre, email, password, rol)
      VALUES ($1, $2, $3, $4)
      RETURNING id, nombre, email, rol, creado_en
    `;
    const values = [nombre.trim(), email.trim(), hashed, rol];

    const { rows } = await pool.query(insertQuery, values);
    const nuevoUsuario = rows[0];

    // Si el rol es EMPRESA, crear automáticamente en tabla empresa
    if (rol === "EMPRESA") {
      const insertEmpresaQuery = `
        INSERT INTO empresa (nombre, email, usuario_id, habilitado, destacado)
        VALUES ($1, $2, $3, true, false)
      `;
      await pool.query(insertEmpresaQuery, [
        nombre.trim(),
        email.trim(),
        nuevoUsuario.id,
      ]);
    }

    return NextResponse.json(nuevoUsuario, { status: 201 });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    return NextResponse.json(
      { message: "Error al crear usuario" },
      { status: 500 }
    );
  }
}
