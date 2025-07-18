import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth";
import { generarSlug } from "@/lib/slugify";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const user = token && verifyJwt(token);

  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  try {
    const { rows } = await pool.query("SELECT * FROM empresa ORDER BY id DESC");
    return NextResponse.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener empresas:", error);
    return NextResponse.json(
      { message: "Error al obtener empresas" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const user = token && verifyJwt(token);

  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
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
      servicios = [], // ✅ capturamos servicios si vienen
    } = body;

    if (!nombre || !telefono || !direccion) {
      return NextResponse.json(
        { message: "Nombre, teléfono y dirección son obligatorios" },
        { status: 400 }
      );
    }

    const slug = generarSlug(nombre);

    // Insertar empresa
    const insertQuery = `
      INSERT INTO empresa 
      (nombre, slug, email, telefono, direccion, provincia, localidad, imagenes, destacado, habilitado, web, corrientes_de_residuos, usuario_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
    ];

    const { rows } = await pool.query(insertQuery, values);
    const nuevaEmpresa = rows[0];

    // ✅ Insertar en empresa_servicio si hay servicios seleccionados
    if (Array.isArray(servicios) && servicios.length > 0) {
      const insertValues = servicios
        .map((_, idx) => `($1, $${idx + 2})`)
        .join(", ");
      const insertParams = [nuevaEmpresa.id, ...servicios];

      const insertServiciosQuery = `
        INSERT INTO empresa_servicio (empresa_id, servicio_id)
        VALUES ${insertValues}
      `;
      await pool.query(insertServiciosQuery, insertParams);
    }

    return NextResponse.json(nuevaEmpresa, { status: 201 });
  } catch (error) {
    console.error("❌ Error al crear empresa:", error);
    return NextResponse.json(
      { message: "Error al crear empresa" },
      { status: 500 }
    );
  }
}
