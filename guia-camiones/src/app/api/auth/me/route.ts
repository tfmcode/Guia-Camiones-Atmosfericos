// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth/verify-jwt";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json({ message: "No token" }, { status: 401 });
  }

  try {
    const payload = verifyJwt(token);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Token inválido:", error);
    return NextResponse.json({ message: "Token inválido" }, { status: 401 });
  }
}
