import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth";
import pool from "@/lib/db";
import { generarSlug } from "@/lib/slugify";
import {
  enviarEmail,
  templateEmpresaHabilitada,
  templateEmpresaDeshabilitada,
} from "@/lib/email";

const noCacheHeaders = {
  "Cache-Control": "no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

async function geocodeAddress(
  direccion: string,
  localidad?: string,
  provincia?: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const addressParts = [direccion];
    if (localidad) addressParts.push(localidad);
    if (provincia) addressParts.push(provincia);
    addressParts.push("Argentina");
    const fullAddress = addressParts.join(", ");

    console.log("🌎 Geocodificando dirección:", fullAddress);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ No hay API key de Google Maps configurada");
      return null;
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      fullAddress
    )}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results?.[0]) {
      const location = data.results[0].geometry.location;
      console.log("✅ Geocodificación exitosa:", location);
      return {
        lat: location.lat,
        lng: location.lng,
      };
    }

    console.warn("⚠️ No se pudo geocodificar la dirección:", data.status);
    return null;
  } catch (error) {
    console.error("❌ Error en geocodificación:", error);
    return null;
  }
}

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
    const { servicios, imagenes, ...rest } = body as Record<string, unknown>;

    console.log("🔧 [BACKEND] Datos recibidos en PUT:", {
      id: Number(id),
      habilitado: rest.habilitado,
      nombre: rest.nombre,
      email: rest.email,
    });

    if (!rest.nombre || !rest.telefono || !rest.direccion) {
      return NextResponse.json(
        { message: "Nombre, teléfono y dirección son obligatorios" },
        { status: 400, headers: noCacheHeaders }
      );
    }

    // ✅ Obtener estado actual de la empresa
    const current = await pool.query(
      "SELECT id, nombre, slug, email, direccion, provincia, localidad, lat, lng, habilitado FROM empresa WHERE id = $1",
      [Number(id)]
    );
    const empresaActual = current.rows[0];

    if (!empresaActual) {
      return NextResponse.json(
        { message: "Empresa no encontrada" },
        { status: 404, headers: noCacheHeaders }
      );
    }

    // ✅ DETECTAR cambio en el campo `habilitado`
    const cambioHabilitado =
      rest.habilitado !== undefined &&
      Boolean(rest.habilitado) !== Boolean(empresaActual.habilitado);
    const nuevoEstadoHabilitado = Boolean(rest.habilitado);

    console.log("🔍 [BACKEND] Detección de cambio en habilitado:", {
      empresaActual_habilitado: empresaActual.habilitado,
      nuevo_habilitado: rest.habilitado,
      cambioHabilitado,
      nuevoEstadoHabilitado,
    });

    const updateData: Record<string, unknown> = {};
    Object.entries(rest).forEach(([k, v]) => {
      updateData[k] = typeof v === "string" ? (v as string).trim() : v;
    });

    // Regenerar slug si cambió el nombre
    let nuevoSlug = empresaActual.slug;
    if (
      typeof updateData.nombre === "string" &&
      updateData.nombre !== empresaActual.nombre
    ) {
      nuevoSlug = generarSlug(updateData.nombre as string);
      console.log(`📝 Nombre cambió, nuevo slug: ${nuevoSlug}`);
    }
    updateData.slug = nuevoSlug;

    // Re-geocodificar si cambió la ubicación
    const direccionCambio =
      (updateData.direccion &&
        updateData.direccion !== empresaActual.direccion) ||
      (updateData.provincia &&
        updateData.provincia !== empresaActual.provincia) ||
      (updateData.localidad &&
        updateData.localidad !== empresaActual.localidad);

    if (direccionCambio) {
      console.log("🗺️  Ubicación cambió, re-geocodificando...");

      const coords = await geocodeAddress(
        updateData.direccion as string,
        updateData.localidad as string | undefined,
        updateData.provincia as string | undefined
      );

      if (coords) {
        updateData.lat = coords.lat;
        updateData.lng = coords.lng;
        console.log(
          `✅ Re-geocodificación exitosa: ${coords.lat}, ${coords.lng}`
        );
      } else {
        updateData.lat = null;
        updateData.lng = null;
        console.log("⚠️ Re-geocodificación falló, coordenadas limpiadas");
      }
    }

    // Si no tiene coordenadas pero tiene dirección, intentar geocodificar
    if (
      !empresaActual.lat &&
      !empresaActual.lng &&
      updateData.direccion &&
      !direccionCambio
    ) {
      console.log("🆕 Empresa sin coordenadas, intentando geocodificar...");

      const coords = await geocodeAddress(
        updateData.direccion as string,
        (updateData.localidad || empresaActual.localidad) as string | undefined,
        (updateData.provincia || empresaActual.provincia) as string | undefined
      );

      if (coords) {
        updateData.lat = coords.lat;
        updateData.lng = coords.lng;
        console.log(
          `✅ Primera geocodificación exitosa: ${coords.lat}, ${coords.lng}`
        );
      }
    }

    // Si vienen lat/lng del frontend, usarlas
    if (rest.lat !== undefined && rest.lng !== undefined) {
      updateData.lat = rest.lat;
      updateData.lng = rest.lng;
      console.log(
        `📍 Usando coordenadas del frontend: ${rest.lat}, ${rest.lng}`
      );
    }

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
      "lat",
      "lng",
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

    // Manejo de imágenes
    if (Array.isArray(imagenes)) {
      setClauses.push(`imagenes = $${idx}`);
      values.push(imagenes);
      idx++;
    } else if (imagenes === null) {
      setClauses.push(`imagenes = $${idx}`);
      values.push(null);
      idx++;
    }

    if (setClauses.length === 0) {
      return NextResponse.json(
        { message: "No hay campos para actualizar" },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const updateQuery = `
      UPDATE empresa
      SET ${setClauses.join(", ")}
      WHERE id = $${idx}
      RETURNING id, nombre, email, slug
    `;
    values.push(Number(id));

    const updateResult = await pool.query(updateQuery, values);
    const empresaActualizada = updateResult.rows[0];

    console.log("📊 [BACKEND] Empresa actualizada:", {
      id: empresaActualizada.id,
      nombre: empresaActualizada.nombre,
      email: empresaActualizada.email,
      slug: empresaActualizada.slug,
      cambioHabilitado,
      nuevoEstadoHabilitado,
    });

    // Actualizar servicios
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

    // 📧 ENVIAR EMAIL SI CAMBIÓ EL ESTADO `habilitado`
    if (cambioHabilitado && empresaActualizada.email) {
      const emailEmpresa = empresaActualizada.email;
      const nombreEmpresa = empresaActualizada.nombre;
      const slugEmpresa = empresaActualizada.slug;

      console.log(
        `📧 [BACKEND] Cambio detectado en habilitado. Enviando email...`
      );
      console.log(`   → Email destino: ${emailEmpresa}`);
      console.log(`   → Nombre empresa: ${nombreEmpresa}`);
      console.log(
        `   → Nuevo estado: ${
          nuevoEstadoHabilitado ? "HABILITADA" : "DESHABILITADA"
        }`
      );

      try {
        if (nuevoEstadoHabilitado === true) {
          // ✅ Empresa HABILITADA
          console.log(`📧 [BACKEND] Preparando email de habilitación...`);
          const { html, text } = templateEmpresaHabilitada(
            nombreEmpresa,
            emailEmpresa,
            slugEmpresa
          );

          console.log(
            `📧 [BACKEND] Enviando email de habilitación a: ${emailEmpresa}`
          );
          const resultadoEmail = await enviarEmail({
            to: emailEmpresa,
            subject: "¡Tu Empresa fue Habilitada! - Guía Atmosféricos",
            html,
            text,
          });

          if (resultadoEmail.success) {
            console.log(
              `✅ [BACKEND] Email de habilitación enviado exitosamente a ${emailEmpresa}`
            );
          } else {
            console.error(
              `❌ [BACKEND] Error al enviar email de habilitación:`,
              resultadoEmail.error
            );
          }
        } else if (nuevoEstadoHabilitado === false) {
          // ⚠️ Empresa DESHABILITADA
          console.log(`📧 [BACKEND] Preparando email de deshabilitación...`);
          const { html, text } = templateEmpresaDeshabilitada(
            nombreEmpresa,
            emailEmpresa
          );

          console.log(
            `📧 [BACKEND] Enviando email de deshabilitación a: ${emailEmpresa}`
          );
          const resultadoEmail = await enviarEmail({
            to: emailEmpresa,
            subject: "Estado de tu Empresa - Guía Atmosféricos",
            html,
            text,
          });

          if (resultadoEmail.success) {
            console.log(
              `✅ [BACKEND] Email de deshabilitación enviado exitosamente a ${emailEmpresa}`
            );
          } else {
            console.error(
              `❌ [BACKEND] Error al enviar email de deshabilitación:`,
              resultadoEmail.error
            );
          }
        }
      } catch (emailError) {
        console.error(
          `❌ [BACKEND] Error crítico al enviar email de estado:`,
          emailError
        );
        // No revertir la actualización si falla el email
      }
    } else {
      if (cambioHabilitado && !empresaActualizada.email) {
        console.log(
          `⚠️ [BACKEND] Cambió habilitado pero la empresa no tiene email registrado`
        );
      }
      if (!cambioHabilitado) {
        console.log(
          `ℹ️ [BACKEND] No hubo cambio en el campo habilitado, no se envía email`
        );
      }
    }

    // Devolver empresa completa
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
    console.error("❌ [BACKEND] Error al actualizar empresa:", error);
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
