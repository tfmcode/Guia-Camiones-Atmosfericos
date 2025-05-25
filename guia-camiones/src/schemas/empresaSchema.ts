import { z } from "zod";

export const empresaSchema = z.object({
  nombre: z.string().min(2, "El nombre es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono: z.string().min(6, "Teléfono inválido"),
  direccion: z.string().min(3, "Dirección requerida"),
  provincia: z.string().min(2, "Provincia requerida"),
  localidad: z.string().min(2, "Localidad requerida"),
  servicios: z.array(z.string()).optional(),
  imagenes: z.array(z.string()).optional(),
  destacado: z.boolean().optional(),
  habilitado: z.boolean().optional(),
  usuarioId: z.number().optional(), // 👈 agregado como opcional
});
