// src/app/api/registro/route.ts
import { NextResponse } from "next/server";
import { generarSlug } from "@/lib/slugify";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import {
  enviarEmail,
  templateRegistroPendiente,
  templateNotificacionAdminRegistro,
} from "@/lib/email";

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

      // ✅ Insertar empresa con habilitado = false por defecto
      const insertEmpresaQuery = `
        INSERT INTO empresa (nombre, email, telefono, provincia, localidad, slug, usuario_id, habilitado)
        VALUES ($1, $2, $3, $4, $5, $6, $7, false)
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

      console.log(`✅ Empresa registrada: ${nombre} (${email})`);

      // 📧 ENVIAR EMAILS
      try {
        // 1️⃣ Email a la empresa registrada
        const { html: htmlEmpresa, text: textEmpresa } =
          templateRegistroPendiente(nombre, email);
        const emailEmpresa = enviarEmail({
          to: email,
          subject: "Registro Recibido - Guía Atmosféricos",
          html: htmlEmpresa,
          text: textEmpresa,
        });

        // 2️⃣ Email al administrador
        const emailAdmin =
          process.env.SMTP_FROM ||
          process.env.SMTP_USER ||
          "administracion@guia-atmosfericos.com";
        const { html: htmlAdmin, text: textAdmin } =
          templateNotificacionAdminRegistro(
            nombre,
            email,
            telefono,
            provincia,
            localidad
          );
        const emailAdministrador = enviarEmail({
          to: emailAdmin,
          subject: `🔔 Nueva Empresa Registrada: ${nombre}`,
          html: htmlAdmin,
          text: textAdmin,
        });

        // Enviar ambos emails en paralelo
        const [resultadoEmpresa, resultadoAdmin] = await Promise.all([
          emailEmpresa,
          emailAdministrador,
        ]);

        if (resultadoEmpresa.success) {
          console.log(`📧 Email de registro enviado a empresa: ${email}`);
        } else {
          console.error(
            `❌ Error al enviar email a empresa:`,
            resultadoEmpresa.error
          );
        }

        if (resultadoAdmin.success) {
          console.log(
            `📧 Email de notificación enviado a admin: ${emailAdmin}`
          );
        } else {
          console.error(
            `❌ Error al enviar email a admin:`,
            resultadoAdmin.error
          );
        }
      } catch (emailError) {
        console.error(`❌ Error crítico al enviar emails:`, emailError);
        // No fallar el registro si fallan los emails
      }
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return NextResponse.json(
      {
        mensaje:
          "Empresa registrada con éxito. Revisá tu email para más información.",
      },
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
