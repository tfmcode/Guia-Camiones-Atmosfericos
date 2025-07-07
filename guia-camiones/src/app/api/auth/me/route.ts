import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const user = token && verifyJwt(token);

  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const query = `
      SELECT id, email, nombre, rol
      FROM usuario
      WHERE id = $1
    `;
    const values = [user.id];

    const { rows } = await pool.query(query, values);
    const usuario = rows[0];

    if (!usuario) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ usuario });
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return NextResponse.json(
      { message: "Error al obtener usuario" },
      { status: 500 }
    );
  }
}
