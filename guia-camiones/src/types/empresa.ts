export interface Empresa {
  id: number;
  nombre: string;
  slug: string; 
  email?: string;
  telefono: string;
  direccion: string;
  provincia?: string;
  localidad?: string;
  servicios: string[];
  imagenes: string[];
  destacado: boolean;
  habilitado: boolean;
  creadoEn: string;
}

export type EmpresaInput = Omit<Empresa, "id" | "creadoEn">;
