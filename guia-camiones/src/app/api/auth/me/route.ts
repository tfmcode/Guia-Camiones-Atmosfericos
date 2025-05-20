import { NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth/verify-jwt";

export async function GET(req: Request) {
  const token = req.headers.get("cookie")?.split("token=")[1]?.split(";")[0];

  if (!token) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }

  const user = verifyJwt(token);

  if (!user) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  return NextResponse.json(user);
}
