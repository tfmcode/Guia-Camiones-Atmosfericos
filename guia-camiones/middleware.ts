import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwt } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  // Si no hay token, redirige a login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const user = verifyJwt(token);

  // Si el token es inválido, también redirige a login
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const path = request.nextUrl.pathname;

  // Rutas privadas para ADMIN
  if (path.startsWith("/panel/admin") && user.rol !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // Rutas privadas para EMPRESA
  if (path.startsWith("/panel/empresa") && user.rol !== "EMPRESA") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // Todo bien → continuar
  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/admin/:path*", "/panel/empresa/:path*"],
};
