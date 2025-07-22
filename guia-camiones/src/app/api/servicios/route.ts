import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth";
import pool from "@/lib/db";

// GET: Búsqueda de servicios (autocomplete)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.toLowerCase().trim();

    let query = "";
    let params: string[] = [];

    if (q && q.length >= 2) {
      query = `
        SELECT id, nombre
        FROM servicio
        WHERE LOWER(nombre) LIKE $1
        ORDER BY nombre ASC
        LIMIT 10
      `;
      params = [`%${q}%`];
    } else {
      query = `
        SELECT id, nombre
        FROM servicio
        ORDER BY nombre ASC
      `;
      params = [];
    }

    const { rows: servicios } = await pool.query(query, params);
    return NextResponse.json(servicios);
  } catch (error) {
    console.error("❌ Error al buscar servicios:", error);
    return NextResponse.json(
      { message: "Error interno al buscar servicios" },
      { status: 500 }
    );
  }
}

// POST: Crear nuevo servicio (ADMIN)
export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const user = token && verifyJwt(token);

  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const nombre = body.nombre?.trim();

    if (!nombre || nombre.length < 2) {
      return NextResponse.json({ message: "Nombre inválido" }, { status: 400 });
    }

    // Verificar si ya existe
    const existeQuery = "SELECT id FROM servicio WHERE nombre = $1";
    const { rows: existentes } = await pool.query(existeQuery, [nombre]);

    if (existentes.length > 0) {
      return NextResponse.json(
        { message: "El servicio ya existe" },
        { status: 400 }
      );
    }

    // Insertar nuevo servicio
    const insertQuery = `
      INSERT INTO servicio (nombre)
      VALUES ($1)
      RETURNING id, nombre
    `;
    const { rows } = await pool.query(insertQuery, [nombre]);
    const creado = rows[0];

    return NextResponse.json(creado, { status: 201 });
  } catch (error) {
    console.error("❌ Error al crear servicio:", error);
    return NextResponse.json(
      { message: "Error interno al crear servicio" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar servicio por nombre exacto (ADMIN)
export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const user = token && verifyJwt(token);

  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const nombre = body.nombre?.trim();

    if (!nombre) {
      return NextResponse.json(
        { message: "Nombre requerido" },
        { status: 400 }
      );
    }

    const deleteQuery = "DELETE FROM servicio WHERE nombre = $1 RETURNING id";
    const { rows } = await pool.query(deleteQuery, [nombre]);

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Servicio no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Servicio eliminado" });
  } catch (error) {
    console.error("❌ Error al eliminar servicio:", error);
    return NextResponse.json(
      { message: "Error interno al eliminar servicio" },
      { status: 500 }
    );
  }
}
