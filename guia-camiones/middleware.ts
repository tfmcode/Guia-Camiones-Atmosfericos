import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwt } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 🔧 PASO 1: Excluir rutas que NUNCA necesitan autenticación
  const excludedPaths = [
    // Archivos estáticos y uploads
    "/uploads/", // ✅ TUS IMÁGENES SUBIDAS
    "/_next/static/", // Next.js assets estáticos
    "/_next/image/", // Optimización de imágenes Next.js
    "/favicon.ico", // Favicon
    "/manifest.json", // PWA manifest
    "/apple-icon.png", // Apple touch icon
    "/WhatsApp.svg", // Tu botón de WhatsApp
    "/img/", // Tus imágenes estáticas

    // APIs públicas específicas
    "/api/auth/login", // Login endpoint
    "/api/auth/logout", // Logout endpoint
    "/api/registro", // Registro público
    "/api/empresa/public/", // Empresas públicas
    "/api/servicios", // Servicios públicos (sin auth)
  ];

  // ✅ Si la ruta está excluida, permitir siempre
  if (excludedPaths.some((excludedPath) => path.startsWith(excludedPath))) {
    return NextResponse.next();
  }

  // ✅ Permitir archivos con extensión (css, js, png, etc.)
  if (path.includes(".") && !path.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 🔧 PASO 2: Verificar autenticación
  const token = request.cookies.get("token")?.value;

  // Si no hay token, redirige a login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const user = verifyJwt(token);

  // Si el token es inválido, también redirige a login
  if (!user) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    // ✅ Limpiar cookie inválida
    response.cookies.delete("token");
    return response;
  }

  // 🔧 PASO 3: Control de acceso por roles
  // Rutas privadas para ADMIN
  if (path.startsWith("/panel/admin")) {
    if (user.rol !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // Rutas privadas para EMPRESA
  if (path.startsWith("/panel/empresa")) {
    if (user.rol !== "EMPRESA") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // 🔧 PASO 4: Control de APIs privadas
  if (path.startsWith("/api/")) {
    // APIs que requieren rol ADMIN
    const adminApis = ["/api/admin/", "/api/empresa/admin/", "/api/usuarios"];

    if (adminApis.some((api) => path.startsWith(api)) && user.rol !== "ADMIN") {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    // APIs que requieren rol EMPRESA
    const empresaApis = ["/api/empresa/me"];

    if (
      empresaApis.some((api) => path.startsWith(api)) &&
      user.rol !== "EMPRESA"
    ) {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    // API /api/auth/me - disponible para usuarios autenticados
    if (path.startsWith("/api/auth/me")) {
      // Ya verificamos que el token es válido arriba
      return NextResponse.next();
    }
  }

  // ✅ Todo bien → continuar
  return NextResponse.next();
}

export const config = {
  matcher: [
    // ✅ MATCHER OPTIMIZADO - Solo aplicar donde sea necesario
    "/panel/:path*", // Rutas del panel (admin y empresa)
    "/api/admin/:path*", // APIs de admin
    "/api/empresa/:path*", // APIs de empresa (incluye /me y /admin)
    "/api/usuarios/:path*", // APIs de usuarios
    "/api/auth/me", // API de verificación de usuario
  ],
};
