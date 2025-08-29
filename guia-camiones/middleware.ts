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
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("token");
    return response;
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

  // Control de APIs protegidas
  if (path.startsWith("/api/")) {
    const adminApis = ["/api/admin/", "/api/empresa/admin/", "/api/usuarios"];
    const empresaApis = ["/api/empresa/me"];

    if (adminApis.some((api) => path.startsWith(api)) && user.rol !== "ADMIN") {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    if (
      empresaApis.some((api) => path.startsWith(api)) &&
      user.rol !== "EMPRESA"
    ) {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  // CLAVE: Solo aplicar middleware a rutas que realmente necesitan protección
  // Esto excluye automáticamente /uploads/, /_next/, y todas las rutas públicas
  matcher: [
    "/panel/:path*", // Paneles de admin y empresa
    "/api/admin/:path*", // APIs de admin
    "/api/empresa/admin/:path*", // APIs de admin de empresa
    "/api/empresa/me", // API de perfil de empresa
    "/api/usuarios/:path*", // APIs de usuarios
    "/api/auth/me", // API de verificación de usuario
  ],
};
