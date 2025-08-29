import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth";
import { generarSlug } from "@/lib/slugify";
import pool from "@/lib/db";

const noCacheHeaders = {
  "Cache-Control": "no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const user = token && verifyJwt(token);

  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  try {
    const query = `
      SELECT 
        e.id, e.nombre, e.slug, e.email, e.telefono, e.direccion, 
        e.provincia, e.localidad, e.imagenes, e.destacado, e.habilitado, 
        e.web, e.corrientes_de_residuos, e.usuario_id as "usuarioId", e.fecha_creacion,
        COALESCE(
          JSON_AGG(json_build_object('id', s.id, 'nombre', s.nombre))
          FILTER (WHERE s.id IS NOT NULL), '[]'
        ) AS servicios
      FROM empresa e
      LEFT JOIN empresa_servicio es ON e.id = es.empresa_id
      LEFT JOIN servicio s ON es.servicio_id = s.id
      GROUP BY e.id
      ORDER BY e.id DESC
    `;
    const { rows } = await pool.query(query);
    return NextResponse.json(rows, { headers: noCacheHeaders });
  } catch (error) {
    console.error("❌ Error al obtener empresas:", error);
    return NextResponse.json(
      { message: "Error al obtener empresas" },
      { status: 500, headers: noCacheHeaders }
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
      servicios = [],
    } = body;

    if (!nombre || !telefono || !direccion) {
      return NextResponse.json(
        { message: "Nombre, teléfono y dirección son obligatorios" },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const slug = generarSlug(nombre);

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
      Array.isArray(imagenes) && imagenes.length > 0 ? imagenes : null,
      destacado,
      habilitado,
      web || null,
      corrientes_de_residuos || null,
      usuarioId || null,
    ];

    const { rows } = await pool.query(insertQuery, values);
    const nuevaEmpresa = rows[0];

    if (Array.isArray(servicios) && servicios.length > 0) {
      const insertValues = servicios
        .map((_, idx) => `($1, $${idx + 2})`)
        .join(", ");
      const insertParams = [nuevaEmpresa.id, ...servicios];
      await pool.query(
        `INSERT INTO empresa_servicio (empresa_id, servicio_id) VALUES ${insertValues}`,
        insertParams
      );
    }

    // devolver completa con servicios
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
      [nuevaEmpresa.id]
    );

    return NextResponse.json(full.rows[0], {
      status: 201,
      headers: noCacheHeaders,
    });
  } catch (error) {
    console.error("❌ Error al crear empresa:", error);
    return NextResponse.json(
      { message: "Error al crear empresa" },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
