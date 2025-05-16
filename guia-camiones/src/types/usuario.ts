export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: "ADMIN" | "EMPRESA" | "USUARIO";
  creadoEn: string;
}

export type UsuarioInput = Omit<Usuario, "id" | "creadoEn"> & {
  password: string;
};
