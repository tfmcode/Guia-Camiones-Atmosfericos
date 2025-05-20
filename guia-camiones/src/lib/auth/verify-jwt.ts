// lib/auth/verify-jwt.ts
import jwt from "jsonwebtoken";
import type { Usuario } from "@/types/usuario";

const JWT_SECRET = process.env.JWT_SECRET || "secreto-temporal";

export const verifyJwt = (
  token: string
): Pick<Usuario, "id" | "email" | "rol" | "nombre"> | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as Pick<
      Usuario,
      "id" | "email" | "rol" | "nombre"
    >;
    return decoded;
  } catch (err) {
    console.error("Error verificando JWT:", err);
    return null;
  }
};
