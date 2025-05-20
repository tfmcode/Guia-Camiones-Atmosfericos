export interface Empresa {
  id: number;
  slug: string;
  nombre: string;
  email?: string;
  telefono: string;
  direccion: string;
  provincia?: string;
  localidad?: string;
  servicios: string[];
  imagenes: string[];
  destacado: boolean;
  habilitado: boolean;
  fechaCreacion: string;
  usuarioId: number;
}

export type EmpresaInput = Omit<
  Empresa,
  "id" | "fechaCreacion" | "slug" | "usuarioId"
>;
