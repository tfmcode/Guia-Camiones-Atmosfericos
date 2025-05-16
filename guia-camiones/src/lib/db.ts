import type { Usuario } from "@/types/usuario";

const mockUsuarios: Usuario[] = [
  {
    id: 1,
    nombre: "Admin Principal",
    email: "admin@guia.com",
    rol: "ADMIN",
    creadoEn: "2024-01-01",
  },
  {
    id: 2,
    nombre: "Empresa Test",
    email: "empresa@guia.com",
    rol: "EMPRESA",
    creadoEn: "2024-01-01",
  },
];

export const getUsuarioByEmailYPassword = async (
  email: string,
  password: string
) => {
  // Por ahora simula contraseña "1234"
  return (
    mockUsuarios.find((u) => u.email === email && password === "1234") || null
  );
};
