import jwt from "jsonwebtoken";
import type { Usuario } from "@/types/usuario";

const JWT_SECRET = process.env.JWT_SECRET!;

export const signJwt = (
  user: Pick<Usuario, "id" | "email" | "rol" | "nombre">
) => {
  console.log("SIGN JWT usando secret:", JWT_SECRET);
  return jwt.sign(
    
    {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol.toUpperCase(), // ⚠️ esto es CLAVE
    },
    JWT_SECRET,
    
    { expiresIn: "2h" }
  );
};
