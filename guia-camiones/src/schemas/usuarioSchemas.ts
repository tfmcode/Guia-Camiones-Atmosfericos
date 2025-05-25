import { z } from "zod";

export const usuarioSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  rol: z.enum(["ADMIN", "EMPRESA", "USUARIO"]),
});

export const usuarioUpdateSchema = z.object({
  nombre: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(), // 👈 agregá esto
  rol: z.enum(["ADMIN", "EMPRESA", "USUARIO"]).optional(),
});
