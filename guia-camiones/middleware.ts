// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwt } from "@/lib/auth/verify-jwt";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  // Si no hay token, redirige a /login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const user = verifyJwt(token);

  // Si el token no es válido, redirige a /login
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const url = request.nextUrl;

  // Protecciones por rol
  if (url.pathname.startsWith("/panel/admin") && user.rol !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (url.pathname.startsWith("/panel/empresa") && user.rol !== "EMPRESA") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*"],
};
