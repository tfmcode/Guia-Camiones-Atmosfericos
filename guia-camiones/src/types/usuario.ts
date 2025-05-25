export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: "ADMIN" | "EMPRESA" | "USUARIO";
  creadoEn: string;
}

// Para crear
export type UsuarioInput = Omit<Usuario, "id" | "creadoEn"> & {
  password: string;
};

// Para editar
export type UsuarioUpdateInput = Omit<Usuario, "id" | "creadoEn"> & {
  password?: string;
};
