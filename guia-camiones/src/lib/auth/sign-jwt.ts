import jwt from "jsonwebtoken";
import type { Usuario } from "@/types/usuario";

const JWT_SECRET = process.env.JWT_SECRET || "secreto-temporal";

export const signJwt = (
  user: Pick<Usuario, "id" | "email" | "rol" | "nombre">
) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol.toUpperCase() as Usuario["rol"], // 👈 acá lo convertís y tipás
    },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
};
