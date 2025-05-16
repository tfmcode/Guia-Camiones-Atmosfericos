import { NextResponse } from "next/server";
import { signJwt } from "@/lib/auth/sign-jwt";
import { getUsuarioByEmailYPassword } from "@/lib/db";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  // Reemplazá por consulta real a tu base
  const user = await getUsuarioByEmailYPassword(email, password);

  if (!user) {
    return NextResponse.json(
      { error: "Credenciales inválidas" },
      { status: 401 }
    );
  }

  const token = signJwt({
    id: user.id,
    email: user.email,
    rol: user.rol,
    nombre: user.nombre,
  });

  const response = NextResponse.json({ success: true });

  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 2, // 2 horas
    path: "/",
  });

  return response;
}
