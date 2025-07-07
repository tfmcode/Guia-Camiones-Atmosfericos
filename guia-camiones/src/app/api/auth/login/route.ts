import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signJwt } from "@/lib/auth";
import { cookies } from "next/headers";
import pool from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { mensaje: "Faltan credenciales" },
        { status: 400 }
      );
    }

    // Buscar el usuario por email
    const query = "SELECT * FROM usuario WHERE email = $1";
    const values = [email];

    const { rows } = await pool.query(query, values);
    const usuario = rows[0];

    if (!usuario || !usuario.password) {
      return NextResponse.json(
        { mensaje: "Email o contraseña incorrectos" },
        { status: 401 }
      );
    }

    const passwordOk = await bcrypt.compare(password, usuario.password);

    if (!passwordOk) {
      return NextResponse.json(
        { mensaje: "Email o contraseña incorrectos" },
        { status: 401 }
      );
    }

    const token = signJwt({
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    });

    // Guardar cookie HttpOnly
    (await cookies()).set("token", token, {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 2,
      sameSite: "lax",
    });

    // Excluir el password antes de enviar al cliente
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...usuarioSeguro } = usuario;

    return NextResponse.json({ usuario: usuarioSeguro }, { status: 200 });
  } catch (error: unknown) {
    console.error("Login error:", error);
    return NextResponse.json(
      { mensaje: "Error al iniciar sesión" },
      { status: 500 }
    );
  }
}
