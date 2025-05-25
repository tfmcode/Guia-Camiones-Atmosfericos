import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Sesión cerrada" });
  response.cookies.set("token", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0, // Eliminar cookie
  });
  return response;
}
