import { cookies } from "next/headers";
import { verifyJwt } from "./auth";

export async function authMiddleware() {
  const cookieStore = await cookies(); 
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  const user = verifyJwt(token);

  if (!user) return null;

  return user as { id: number; rol: "ADMIN" | "EMPRESA" | "USUARIO" };
}
