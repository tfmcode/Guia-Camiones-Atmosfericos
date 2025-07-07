import { Empresa } from "./empresa";

export type Rol = "ADMIN" | "EMPRESA";

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
  creado_en: string;
  empresa?: Empresa;
}

export type UsuarioInput = Omit<Usuario, "id" | "creado_en" | "empresa"> & {
  password: string;
};
