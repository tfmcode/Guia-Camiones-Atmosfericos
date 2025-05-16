import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwt } from "@/lib/auth/verify.jwt";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  const url = request.nextUrl;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const user = verifyJwt(token);

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Protección por rol
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
